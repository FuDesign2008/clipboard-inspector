import JSZip from 'jszip';
import {
	sanitizeFilename,
	getFileExtension,
	fetchBlobFromObjectURL,
	timestampForFilename,
	triggerBrowserDownload
} from './utils.js';

function generateReadme(data, label) {
	const timestamp = new Date().toISOString();
	return `Clipboard Data Export
=====================

Export Date: ${timestamp}
Source: ${label || 'clipboard'}

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

function generateMetadata(data, label) {
	const typesCount = data
		.map(d => d.types?.length || 0)
		.reduce((a, b) => a + b, 0);
	const itemsCount = data
		.map(d => d.items?.length || 0)
		.reduce((a, b) => a + b, 0);
	const filesCount = data
		.map(d => d.files?.length || 0)
		.reduce((a, b) => a + b, 0);

	return {
		version: '1.0',
		timestamp: new Date().toISOString(),
		source: label || 'clipboard',
		summary: {
			totalTypes: typesCount,
			totalItems: itemsCount,
			totalFiles: filesCount,
			dataCount: data.length
		},
		entries: data.map((entry, index) => ({
			index,
			kind: entry.type,
			typeCount: entry.types?.length || 0,
			itemCount: entry.items?.length || 0,
			fileCount: entry.files?.length || 0
		})),
		note: 'All clipboard content included: text data and binary files (images, PDFs, etc.)'
	};
}

async function addTypesToZip(folder, typesData) {
	if (!typesData || typesData.length === 0) return;
	const typesFolder = folder.folder('types');

	for (const obj of typesData) {
		if (typeof obj.data === 'string') {
			const filename = sanitizeFilename(obj.type) + '.txt';
			typesFolder.file(filename, obj.data || '(Empty string)');
		} else if (typeof obj.data === 'object' && obj.data !== null) {
			if (obj.data.url) {
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
}

async function addItemsToZip(folder, itemsData) {
	if (!itemsData || itemsData.length === 0) return;
	const itemsFolder = folder.folder('items');
	const manifest = [];

	for (let index = 0; index < itemsData.length; index++) {
		const item = itemsData[index];

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
			const fileInfo = item.as_string_or_file;
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

async function addFilesToZip(folder, filesData) {
	if (!filesData || filesData.length === 0) return;
	const filesFolder = folder.folder('files');
	const manifest = [];
	const usedFilenames = new Set();

	for (let index = 0; index < filesData.length; index++) {
		const file = filesData[index];
		if (!file || !file.url) continue;

		const blob = await fetchBlobFromObjectURL(file.url);
		if (blob) {
			let filename =
				file.name || `file-${index}${getFileExtension(file.type)}`;
			let finalFilename = filename;
			let counter = 1;

			while (usedFilenames.has(finalFilename)) {
				const lastDot = filename.lastIndexOf('.');
				if (lastDot > 0) {
					const name = filename.substring(0, lastDot);
					const ext = filename.substring(lastDot);
					finalFilename = `${name}-${counter}${ext}`;
				} else {
					finalFilename = `${filename}-${counter}`;
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

export async function downloadAsZip(data, label) {
	const zip = new JSZip();

	zip.file('README.txt', generateReadme(data, label));
	zip.file(
		'metadata.json',
		JSON.stringify(generateMetadata(data, label), null, 2)
	);

	for (let i = 0; i < data.length; i++) {
		const item = data[i];
		const subFolder = zip.folder(`data-${i}`);
		if (item.types) {
			await addTypesToZip(subFolder, item.types);
		}
		if (item.items) {
			await addItemsToZip(subFolder, item.items);
		}
		if (item.files) {
			await addFilesToZip(subFolder, item.files);
		}
	}

	const blob = await zip.generateAsync({ type: 'blob' });
	const filename = `clipboard-data-${timestampForFilename()}.zip`;
	triggerBrowserDownload(blob, filename, 'application/zip');
}
