import { describe, it, expect } from 'vitest';
import { buildMarkdown } from '../markdown';
import type { ClipboardEntry } from '../../types';

const dtEntry: ClipboardEntry = {
	type: 'DataTransfer',
	types: [
		{ type: 'text/plain', data: 'Hello world' },
		{
			type: 'text/html',
			data: '<p>Hello <strong>world</strong></p>'
		},
		{
			type: 'image/png',
			data: {
				name: 'pic.png',
				size: 2048,
				type: 'image/png',
				url: 'blob:fake'
			}
		}
	],
	items: [
		{ kind: 'string', type: 'text/plain', as_string_or_file: 'Hi' },
		{
			kind: 'file',
			type: 'image/png',
			as_string_or_file: {
				name: 'a.png',
				size: 123,
				type: 'image/png',
				url: 'blob:x'
			}
		}
	],
	files: [
		{ name: 'doc.pdf', size: 12345, type: 'application/pdf', url: 'blob:y' }
	]
};

const ciEntry: ClipboardEntry = {
	type: 'ClipboardItem',
	types: [
		{ type: 'text/plain', data: 'Async clipboard text' },
		{
			type: 'image/png',
			data: {
				name: 'screenshot.png',
				size: 99999,
				type: 'image/png',
				url: 'blob:z'
			}
		}
	]
};

describe('buildMarkdown', () => {
	it('header includes timestamp + entries count', () => {
		const md = buildMarkdown([dtEntry, ciEntry], 'clipboardData');
		expect(md).toContain('# Clipboard Data Export');
		expect(md).toContain('**Entries**: 2');
		expect(md).toContain('**Export date**:');
		expect(md).toContain('`clipboardData`');
	});

	it('DataTransfer entry has types/items/files sections', () => {
		const md = buildMarkdown([dtEntry], 'clipboardData');
		expect(md).toContain('## Entry 0: `DataTransfer`');
		expect(md).toContain('### `.types` (3)');
		expect(md).toContain('### `.items` (2)');
		expect(md).toContain('### `.files` (1)');
	});

	it('ClipboardItem entry has only types section', () => {
		const md = buildMarkdown([ciEntry], 'ClipboardItems');
		expect(md).toContain('## Entry 0: `ClipboardItem`');
		expect(md).toContain('### `.types` (2)');
		expect(md).not.toContain('### `.items`');
		expect(md).not.toContain('### `.files`');
	});

	it('text/plain uses empty lang, text/html uses html lang', () => {
		const md = buildMarkdown([dtEntry], 'clipboardData');
		expect(md).toContain('```\nHello world\n```');
		expect(md).toContain(
			'```html\n<p>Hello <strong>world</strong></p>\n```'
		);
	});

	it('binary type renders as file descriptor', () => {
		const md = buildMarkdown([dtEntry], 'clipboardData');
		expect(md).toContain('**Binary file**:');
		expect(md).toContain('name: `pic.png`');
		expect(md).toContain('type: `image/png`');
		expect(md).toContain('size: 2.0 KB');
	});

	it('fence expands when body contains triple backticks', () => {
		const entry: ClipboardEntry = {
			type: 'DataTransfer',
			types: [{ type: 'text/plain', data: 'a\n```\nnested\n```\nb' }],
			items: [],
			files: []
		};
		const md = buildMarkdown([entry], 'clipboardData');
		expect(md).toContain('````\na\n```\nnested\n```\nb\n````');
	});

	it('empty items/files arrays produce no section', () => {
		const entry: ClipboardEntry = {
			type: 'DataTransfer',
			types: [{ type: 'text/plain', data: 'ok' }],
			items: [],
			files: []
		};
		const md = buildMarkdown([entry], 'clipboardData');
		expect(md).not.toContain('### `.items`');
		expect(md).not.toContain('### `.files`');
	});

	it('items table preview for string truncates beyond 60 chars', () => {
		const longStr = 'x'.repeat(80);
		const entry: ClipboardEntry = {
			type: 'DataTransfer',
			types: [{ type: 'text/plain', data: longStr }],
			items: [
				{
					kind: 'string',
					type: 'text/plain',
					as_string_or_file: longStr
				}
			],
			files: []
		};
		const md = buildMarkdown([entry], 'clipboardData');
		expect(md).toContain('`' + 'x'.repeat(57) + '...`');
	});

	it('table pipe characters are escaped', () => {
		const entry: ClipboardEntry = {
			type: 'DataTransfer',
			types: [{ type: 'text/plain', data: 'ok' }],
			items: [
				{
					kind: 'string',
					type: 'text|weird',
					as_string_or_file: 'a|b'
				}
			],
			files: []
		};
		const md = buildMarkdown([entry], 'clipboardData');
		const escapedLine = md
			.split('\n')
			.find(l => l.includes('text\\|weird'));
		expect(escapedLine).toBeTruthy();
	});

	it('empty string items render _(empty string)_', () => {
		const entry: ClipboardEntry = {
			type: 'DataTransfer',
			types: [{ type: 'text/plain', data: '' }],
			items: [],
			files: []
		};
		const md = buildMarkdown([entry], 'clipboardData');
		expect(md).toContain('_(empty string)_');
	});

	it('formatBytes renders KB/MB correctly', () => {
		const entry: ClipboardEntry = {
			type: 'DataTransfer',
			types: [],
			items: [],
			files: [
				{
					name: 'small.txt',
					size: 512,
					type: 'text/plain',
					url: 'blob:1'
				},
				{
					name: 'medium.pdf',
					size: 100_000,
					type: 'application/pdf',
					url: 'blob:2'
				},
				{
					name: 'large.mp4',
					size: 5_000_000,
					type: 'video/mp4',
					url: 'blob:3'
				}
			]
		};
		const md = buildMarkdown([entry], 'clipboardData');
		expect(md).toContain('512 B');
		expect(md).toContain('97.7 KB');
		expect(md).toContain('4.77 MB');
	});

	it('trailing newline present', () => {
		const md = buildMarkdown([dtEntry], 'clipboardData');
		expect(md.endsWith('\n')).toBe(true);
	});

	it('multiple entries separated by horizontal rule', () => {
		const md = buildMarkdown([dtEntry, ciEntry], 'mix');
		const occurrences = (md.match(/\n---\n/g) ?? []).length;
		expect(occurrences).toBeGreaterThanOrEqual(2);
	});
});
