import type { ClipboardEntry, FileInfo, ItemEntry, TypeEntry } from '../types';
import {
	mimeToMarkdownLang,
	timestampForFilename,
	triggerBrowserDownload
} from './utils';

function formatBytes(n: number | undefined | null): string {
	if (typeof n !== 'number' || !Number.isFinite(n)) return 'unknown';
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function escapeTableCell(str: string | undefined | null): string {
	return (str ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderFencedBlock(lang: string, content: string): string {
	const fenceMatches = [...content.matchAll(/`{3,}/g)];
	const longestFence = fenceMatches.reduce(
		(max, [run]) => Math.max(max, run.length),
		2
	);
	const fence = '`'.repeat(longestFence + 1);
	return `${fence}${lang}\n${content}\n${fence}`;
}

function describeFile(file: FileInfo | null): string {
	if (!file) return '`N/A`';
	const parts: string[] = [];
	if (file.name) parts.push(`name: \`${file.name}\``);
	if (file.type) parts.push(`type: \`${file.type}\``);
	if (typeof file.size === 'number')
		parts.push(`size: ${formatBytes(file.size)}`);
	return parts.length > 0 ? parts.join(', ') : '`(empty file info)`';
}

function renderTypesSection(typesData: TypeEntry[] | undefined): string {
	if (!typesData || typesData.length === 0) return '';

	const lines: string[] = [];
	lines.push(`### \`.types\` (${typesData.length})`);
	lines.push('');
	lines.push('| # | type |');
	lines.push('|---|------|');
	typesData.forEach((obj, idx) => {
		lines.push(`| ${idx} | \`${escapeTableCell(obj.type)}\` |`);
	});
	lines.push('');

	typesData.forEach((obj, idx) => {
		lines.push(`#### types[${idx}] — \`${obj.type}\``);
		lines.push('');
		if (typeof obj.data === 'string') {
			if (obj.data.length === 0) {
				lines.push('_(empty string)_');
			} else {
				const lang = mimeToMarkdownLang(obj.type);
				lines.push(renderFencedBlock(lang, obj.data));
			}
		} else if (obj.data) {
			lines.push(`**Binary file**: ${describeFile(obj.data)}`);
		} else {
			lines.push('_N/A_');
		}
		lines.push('');
	});

	return lines.join('\n');
}

function renderItemsSection(itemsData: ItemEntry[] | null | undefined): string {
	if (!itemsData || itemsData.length === 0) return '';

	const lines: string[] = [];
	lines.push(`### \`.items\` (${itemsData.length})`);
	lines.push('');
	lines.push('| # | kind | type | preview |');
	lines.push('|---|------|------|---------|');
	itemsData.forEach((item, idx) => {
		let preview: string;
		if (
			item.kind === 'string' &&
			typeof item.as_string_or_file === 'string'
		) {
			const trimmed =
				item.as_string_or_file.length > 60
					? item.as_string_or_file.slice(0, 57) + '...'
					: item.as_string_or_file;
			preview = `\`${escapeTableCell(trimmed) || '(empty)'}\``;
		} else if (item.kind === 'file' && item.as_string_or_file) {
			preview = describeFile(item.as_string_or_file as FileInfo);
		} else {
			preview = '_N/A_';
		}
		lines.push(
			`| ${idx} | \`${item.kind}\` | \`${escapeTableCell(
				item.type
			)}\` | ${preview} |`
		);
	});
	lines.push('');

	itemsData.forEach((item, idx) => {
		if (
			item.kind === 'string' &&
			typeof item.as_string_or_file === 'string'
		) {
			lines.push(`#### items[${idx}] — string, \`${item.type}\``);
			lines.push('');
			if (item.as_string_or_file.length === 0) {
				lines.push('_(empty string)_');
			} else {
				const lang = mimeToMarkdownLang(item.type);
				lines.push(renderFencedBlock(lang, item.as_string_or_file));
			}
			lines.push('');
		}
	});

	return lines.join('\n');
}

function renderFilesSection(
	filesData: (FileInfo | null)[] | null | undefined
): string {
	if (!filesData || filesData.length === 0) return '';

	const lines: string[] = [];
	lines.push(`### \`.files\` (${filesData.length})`);
	lines.push('');
	lines.push('| # | name | type | size |');
	lines.push('|---|------|------|------|');
	filesData.forEach((file, idx) => {
		if (!file) {
			lines.push(`| ${idx} | _null_ | — | — |`);
			return;
		}
		lines.push(
			`| ${idx} | \`${escapeTableCell(
				file.name || '(no name)'
			)}\` | \`${escapeTableCell(file.type || '')}\` | ${formatBytes(
				file.size
			)} |`
		);
	});
	lines.push('');

	return lines.join('\n');
}

function renderEntry(entry: ClipboardEntry, index: number): string {
	const lines: string[] = [];
	lines.push(`## Entry ${index}: \`${entry.type}\``);
	lines.push('');
	const typesSection = renderTypesSection(entry.types);
	if (typesSection) lines.push(typesSection);
	if (entry.type === 'DataTransfer') {
		const itemsSection = renderItemsSection(entry.items);
		if (itemsSection) lines.push(itemsSection);
		const filesSection = renderFilesSection(entry.files);
		if (filesSection) lines.push(filesSection);
	}
	return lines.join('\n');
}

export function buildMarkdown(
	data: ClipboardEntry[],
	label: string | undefined
): string {
	const timestamp = new Date().toISOString();
	const typesCount = data.map(d => d.types.length).reduce((a, b) => a + b, 0);
	const itemsCount = data
		.map(d => (d.type === 'DataTransfer' ? d.items.length : 0))
		.reduce((a, b) => a + b, 0);
	const filesCount = data
		.map(d => (d.type === 'DataTransfer' ? d.files.length : 0))
		.reduce((a, b) => a + b, 0);

	const header = [
		'# Clipboard Data Export',
		'',
		`- **Export date**: ${timestamp}`,
		`- **Source**: \`${label ?? 'clipboard'}\``,
		`- **Entries**: ${data.length}`,
		`- **Total types / items / files**: ${typesCount} / ${itemsCount} / ${filesCount}`,
		'',
		'> Generated by [Clipboard Inspector](https://evercoder.github.io/clipboard-inspector/). Paste this file directly to an AI assistant to share clipboard context.',
		'',
		'---',
		''
	].join('\n');

	const body = data
		.map((entry, idx) => renderEntry(entry, idx))
		.join('\n\n---\n\n');

	return header + body + '\n';
}

export function downloadAsMarkdown(
	data: ClipboardEntry[],
	label: string | undefined
): void {
	const markdown = buildMarkdown(data, label);
	const filename = `clipboard-data-${timestampForFilename()}.md`;
	triggerBrowserDownload(markdown, filename, 'text/markdown;charset=utf-8');
}
