import JSZip from 'jszip';
import type { ClipboardEntry, FileInfo, ItemEntry, TypeEntry } from '../types';
import {
	sanitizeFilename,
	getFileExtension,
	fetchBlobFromObjectURL,
	timestampForFilename,
	triggerBrowserDownload
} from './utils';

type ZipContainer = JSZip;

type ItemManifestEntry =
	| {
			index: number;
			kind: string;
			type: string;
			filename: string;
			hasContent?: boolean;
			fileInfo?: { name: string; size: number; type: string };
	  }
	| {
			index: number;
			kind: string;
			type: string;
			error: string;
			fileInfo: {
				name: string;
				size: number;
				type: string;
				url: string;
			};
	  };

type FileManifestEntry =
	| {
			index: number;
			filename: string;
			originalName: string;
			size: number;
			type: string;
	  }
	| {
			index: number;
			error: string;
			name: string;
			size: number;
			type: string;
			url: string;
	  };

function generateReadme(data: ClipboardEntry[], label: string | undefined) {
	const timestamp = new Date().toISOString();
	return `Clipboard Data Export
=====================

Export Date: ${timestamp}
Source: ${label ?? 'clipboard'}
Entries: ${data.length}

This archive contains clipboard content exported from the Clipboard Inspector tool.

Structure:
----------
- README.txt (this file): Overview of the export
- metadata.json: Overall structure information
- data-<index>/types/: Text and binary content from different MIME types
- data-<index>/items/: String items and files from clipboard (with manifest.json)
- data-<index>/files/: Binary files from clipboard (with manifest.json)

Each data-<index> folder corresponds to one DataTransfer or ClipboardItem from
the original event. Text content is saved as plain files; binary content (images,
PDFs, etc.) keeps its original filename when available.

For support inquiries, please send this entire ZIP file.
`;
}

function generateMetadata(data: ClipboardEntry[], label: string | undefined) {
	const typesCount = data.map(d => d.types.length).reduce((a, b) => a + b, 0);
	const itemsCount = data
		.map(d => (d.type === 'DataTransfer' ? d.items.length : 0))
		.reduce((a, b) => a + b, 0);
	const filesCount = data
		.map(d => (d.type === 'DataTransfer' ? d.files.length : 0))
		.reduce((a, b) => a + b, 0);

	return {
		version: '1.0',
		timestamp: new Date().toISOString(),
		source: label ?? 'clipboard',
		summary: {
			totalTypes: typesCount,
			totalItems: itemsCount,
			totalFiles: filesCount,
			dataCount: data.length
		},
		entries: data.map((entry, index) => ({
			index,
			kind: entry.type,
			typeCount: entry.types.length,
			itemCount: entry.type === 'DataTransfer' ? entry.items.length : 0,
			fileCount: entry.type === 'DataTransfer' ? entry.files.length : 0
		})),
		note: 'All clipboard content included: text data and binary files (images, PDFs, etc.)'
	};
}

async function addTypesToZip(
	folder: ZipContainer,
	typesData: TypeEntry[] | undefined
): Promise<void> {
	if (!typesData || typesData.length === 0) return;
	const typesFolder = folder.folder('types');
	if (!typesFolder) return;

	for (const obj of typesData) {
		if (typeof obj.data === 'string') {
			const filename = sanitizeFilename(obj.type) + '.txt';
			typesFolder.file(filename, obj.data || '(Empty string)');
		} else if (obj.data?.url) {
			const blob = await fetchBlobFromObjectURL(obj.data.url);
			if (blob) {
				const ext = getFileExtension(obj.type);
				const filename =
					obj.data.name || `${sanitizeFilename(obj.type)}${ext}`;
				typesFolder.file(filename, blob);
			}
		}
	}
}

async function addItemsToZip(
	folder: ZipContainer,
	itemsData: ItemEntry[] | null | undefined
): Promise<void> {
	if (!itemsData || itemsData.length === 0) return;
	const itemsFolder = folder.folder('items');
	if (!itemsFolder) return;
	const manifest: ItemManifestEntry[] = [];

	for (let index = 0; index < itemsData.length; index++) {
		const item = itemsData[index];
		if (!item) continue;

		if (
			item.kind === 'string' &&
			typeof item.as_string_or_file === 'string'
		) {
			const filename = `item-${index}-string-${sanitizeFilename(
				item.type
			)}.txt`;
			itemsFolder.file(
				filename,
				item.as_string_or_file || '(Empty string)'
			);
			manifest.push({
				index,
				kind: item.kind,
				type: item.type,
				filename,
				hasContent: true
			});
		} else if (item.kind === 'file' && item.as_string_or_file) {
			const fileInfo = item.as_string_or_file as FileInfo;
			if (fileInfo.url) {
				const blob = await fetchBlobFromObjectURL(fileInfo.url);
				if (blob) {
					const ext = getFileExtension(fileInfo.type || item.type);
					const filename =
						fileInfo.name ||
						`item-${index}-file-${sanitizeFilename(
							item.type
						)}${ext}`;
					itemsFolder.file(filename, blob);
					manifest.push({
						index,
						kind: item.kind,
						type: item.type,
						filename,
						fileInfo: {
							name: fileInfo.name,
							size: fileInfo.size,
							type: fileInfo.type
						}
					});
				} else {
					manifest.push({
						index,
						kind: item.kind,
						type: item.type,
						error: 'Failed to fetch file data',
						fileInfo: {
							name: fileInfo.name,
							size: fileInfo.size,
							type: fileInfo.type,
							url: fileInfo.url
						}
					});
				}
			}
		}
	}

	if (manifest.length > 0) {
		itemsFolder.file('manifest.json', JSON.stringify(manifest, null, 2));
	}
}

async function addFilesToZip(
	folder: ZipContainer,
	filesData: (FileInfo | null)[] | null | undefined
): Promise<void> {
	if (!filesData || filesData.length === 0) return;
	const filesFolder = folder.folder('files');
	if (!filesFolder) return;
	const manifest: FileManifestEntry[] = [];
	const usedFilenames = new Set<string>();

	for (let index = 0; index < filesData.length; index++) {
		const file = filesData[index];
		if (!file?.url) continue;

		const blob = await fetchBlobFromObjectURL(file.url);
		if (blob) {
			const base =
				file.name || `file-${index}${getFileExtension(file.type)}`;
			let finalFilename = base;
			let counter = 1;

			while (usedFilenames.has(finalFilename)) {
				const lastDot = base.lastIndexOf('.');
				if (lastDot > 0) {
					const name = base.substring(0, lastDot);
					const ext = base.substring(lastDot);
					finalFilename = `${name}-${counter}${ext}`;
				} else {
					finalFilename = `${base}-${counter}`;
				}
				counter++;
			}

			usedFilenames.add(finalFilename);
			filesFolder.file(finalFilename, blob);

			manifest.push({
				index,
				filename: finalFilename,
				originalName: file.name,
				size: file.size,
				type: file.type
			});
		} else {
			manifest.push({
				index,
				error: 'Failed to fetch file data',
				name: file.name,
				size: file.size,
				type: file.type,
				url: file.url
			});
		}
	}

	if (manifest.length > 0) {
		filesFolder.file('manifest.json', JSON.stringify(manifest, null, 2));
	}
}

export async function downloadAsZip(
	data: ClipboardEntry[],
	label: string | undefined
): Promise<void> {
	const zip = new JSZip();

	zip.file('README.txt', generateReadme(data, label));
	zip.file(
		'metadata.json',
		JSON.stringify(generateMetadata(data, label), null, 2)
	);

	for (let i = 0; i < data.length; i++) {
		const entry = data[i];
		if (!entry) continue;
		const subFolder = zip.folder(`data-${i}`);
		if (!subFolder) continue;

		await addTypesToZip(subFolder, entry.types);
		if (entry.type === 'DataTransfer') {
			await addItemsToZip(subFolder, entry.items);
			await addFilesToZip(subFolder, entry.files);
		}
	}

	const blob = await zip.generateAsync({ type: 'blob' });
	const filename = `clipboard-data-${timestampForFilename()}.zip`;
	triggerBrowserDownload(blob, filename, 'application/zip');
}
