import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildHtml } from '../html';
import * as utils from '../utils';
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
				url: 'blob:fake-png'
			}
		}
	],
	items: [],
	files: []
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
				url: 'blob:fake-screenshot'
			}
		}
	]
};

const emptyEntry: ClipboardEntry = {
	type: 'ClipboardItem',
	types: [{ type: 'text/plain', data: '' }]
};

const nullDataEntry: ClipboardEntry = {
	type: 'ClipboardItem',
	types: [{ type: 'text/rtf', data: null }]
};

describe('buildHtml', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(utils, 'fetchBlobFromObjectURL').mockResolvedValue(null);
	});

	it('produces HTML with doctype, head, and body', async () => {
		const html = await buildHtml([dtEntry], 'clipboardData');
		expect(html).toContain('<!doctype html>');
		expect(html).toContain('<title>Clipboard Data');
		expect(html).toContain('<button');
		expect(html).toContain('Set Clipboard');
	});

	it('includes source label in title and meta', async () => {
		const html = await buildHtml([dtEntry], 'clipboardData');
		expect(html).toContain('clipboardData');
	});

	it('includes export timestamp', async () => {
		const html = await buildHtml([dtEntry], 'clipboardData');
		expect(html).toContain('Exported:');
	});

	it('includes entries and types count in meta', async () => {
		const html = await buildHtml([dtEntry, ciEntry], 'test');
		expect(html).toContain('Entries: 2');
		expect(html).toContain('Total types: 5');
	});

	it('embeds clipboard data as JSON in a script tag', async () => {
		const html = await buildHtml([dtEntry], 'test');
		expect(html).toContain(
			'<script type="application/json" id="clipboard-data">'
		);
		expect(html).toContain('"entryType":"DataTransfer"');
	});

	it('handles empty string data', async () => {
		const html = await buildHtml([emptyEntry], 'test');
		expect(html).toContain(
			'<script type="application/json" id="clipboard-data">'
		);
		// Empty string should still be embedded as text kind
		expect(html).toContain('"kind":"text"');
	});

	it('skips null data entries', async () => {
		const html = await buildHtml([nullDataEntry], 'test');
		const pattern =
			/<script type="application\/json" id="clipboard-data">([\s\S]*?)<\/script>/;
		const match = pattern.exec(html);
		expect(match).not.toBeNull();
		if (!match || typeof match[1] !== 'string')
			throw new Error('Pattern not found');
		const parsed = JSON.parse(match[1]) as unknown[];
		expect(parsed[0]).toHaveProperty('types');
		const entry = parsed[0] as { types: unknown[] };
		expect(entry.types).toHaveLength(0);
	});

	it('includes clipboard API write script', async () => {
		const html = await buildHtml([dtEntry], 'test');
		expect(html).toContain('navigator.clipboard.write');
		expect(html).toContain('new ClipboardItem');
		expect(html).toContain('>Set Clipboard<');
	});

	it('escapes HTML in label', async () => {
		const html = await buildHtml([dtEntry], '<script>alert(1)</script>');
		expect(html).not.toContain('<script>alert(1)</script>');
		expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
	});

	it('handles empty data array', async () => {
		const html = await buildHtml([], 'test');
		expect(html).toContain('<!doctype html>');
		expect(html).toContain('Entries: 0');
	});

	it('includes blobFromDataUrl helper for binary data', async () => {
		const html = await buildHtml([dtEntry], 'test');
		expect(html).toContain('blobFromDataUrl');
	});

	it('encodes binary data as kind binary when fetch succeeds', async () => {
		vi.restoreAllMocks();
		const mockBlob = new Blob(['fake-image-data'], {
			type: 'image/png'
		});
		vi.spyOn(utils, 'fetchBlobFromObjectURL').mockResolvedValueOnce(
			mockBlob
		);
		// FileReader is not available in Node.js test environment
		const ogFileReader = globalThis.FileReader;
		// @ts-expect-error - partial mock for test
		globalThis.FileReader = class {
			result = 'data:image/png;base64,ZmFrZQ==';
			readAsDataURL(_blob: Blob) {
				setTimeout(() => {
					if (this.onload) this.onload();
				}, 0);
			}
			onload: (() => void) | undefined;
		};
		try {
			const html = await buildHtml([dtEntry], 'test');
			expect(html).toContain('"kind":"binary"');
			expect(html).toContain('"type":"image/png"');
		} finally {
			globalThis.FileReader = ogFileReader;
		}
	});
});
