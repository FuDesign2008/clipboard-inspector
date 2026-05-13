import type { ClipboardEntry, FileInfo, TypeEntry } from '../types';
import {
	fetchBlobFromObjectURL,
	timestampForFilename,
	triggerBrowserDownload
} from './utils';

type EmbeddedTypeEntry =
	| { type: string; data: string; kind: 'text' }
	| { type: string; data: string; kind: 'binary'; mime: string };

async function blobUrlToDataUrl(url: string): Promise<string | null> {
	const blob = await fetchBlobFromObjectURL(url);
	if (!blob) return null;
	return new Promise(resolve => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as string);
		};
		reader.onerror = () => {
			resolve(null);
		};
		reader.readAsDataURL(blob);
	});
}

function isTextData(data: string | FileInfo | null): data is string {
	return typeof data === 'string';
}

function isBinaryData(data: string | FileInfo | null): data is FileInfo {
	return typeof data === 'object' && data !== null && 'url' in data;
}

async function embedTypeEntry(
	entry: TypeEntry
): Promise<EmbeddedTypeEntry | null> {
	if (entry.data === null) return null;

	if (isTextData(entry.data)) {
		return { type: entry.type, data: entry.data, kind: 'text' };
	}

	if (isBinaryData(entry.data)) {
		const dataUrl = await blobUrlToDataUrl(entry.data.url);
		if (!dataUrl) return null;
		return {
			type: entry.type,
			data: dataUrl,
			kind: 'binary',
			mime: entry.data.type
		};
	}

	return null;
}

async function embedEntry(
	entry: ClipboardEntry
): Promise<{ entryType: string; types: EmbeddedTypeEntry[] }> {
	const results = await Promise.all(entry.types.map(embedTypeEntry));
	return {
		entryType: entry.type,
		types: results.filter((t): t is EmbeddedTypeEntry => t !== null)
	};
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export async function buildHtml(
	data: ClipboardEntry[],
	label: string | undefined
): Promise<string> {
	const timestamp = new Date().toISOString();
	const source = escapeHtml(label ?? 'clipboard');
	const embedded = await Promise.all(data.map(embedEntry));
	const embeddedJson = JSON.stringify(embedded);

	const typesCount = data.map(d => d.types.length).reduce((a, b) => a + b, 0);

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clipboard Data — ${source}</title>
<style>
	* { box-sizing: border-box; margin: 0; padding: 0; }
	body {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		max-width: 720px;
		margin: 40px auto;
		padding: 0 20px;
		color: #1a1a1a;
		line-height: 1.6;
	}
	h1 { font-size: 1.5em; margin-bottom: 8px; }
	.meta { color: #666; font-size: 0.9em; margin-bottom: 24px; }
	.meta span { display: block; }
	.btn {
		display: inline-block;
		padding: 12px 28px;
		font-size: 1em;
		font-weight: 600;
		color: #fff;
		background: #2563eb;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn:hover { background: #1d4ed8; }
	.btn:disabled { background: #93c5fd; cursor: not-allowed; }
	.status {
		margin-top: 16px;
		padding: 10px 14px;
		border-radius: 6px;
		font-size: 0.9em;
		display: none;
	}
	.status.success { display: block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
	.status.error { display: block; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
	.status.info { display: block; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
	.types-list { margin-top: 24px; }
	.types-list h2 { font-size: 1.1em; margin-bottom: 8px; }
	.types-list ul { list-style: none; }
	.types-list li {
		padding: 6px 0;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-size: 0.85em;
		color: #555;
	}
	.types-list li.binary { color: #7c3aed; }
</style>
</head>
<body>
<h1>Clipboard Data</h1>
<div class="meta">
	<span>Source: ${source}</span>
	<span>Entries: ${data.length}</span>
	<span>Total types: ${typesCount}</span>
	<span>Exported: ${timestamp}</span>
</div>
<button class="btn" id="set-clipboard" type="button">Set Clipboard</button>
<div class="status" id="status"></div>
<div class="types-list">
	<h2>Available MIME types</h2>
	<ul id="types-list"></ul>
</div>
<script type="application/json" id="clipboard-data">
${embeddedJson}
</script>
<script>
(function () {
	'use strict';
	var clipboardData = JSON.parse(
		document.getElementById('clipboard-data').textContent
	);
	var status = document.getElementById('status');
	var btn = document.getElementById('set-clipboard');
	var list = document.getElementById('types-list');

	// Render type list
	clipboardData.forEach(function (entry) {
		entry.types.forEach(function (t) {
			var li = document.createElement('li');
			if (t.kind === 'binary') {
				li.className = 'binary';
				li.textContent = t.type + ' (binary — ' + (t.mime || 'unknown') + ')';
			} else {
				var preview =
					t.data.length > 80
						? t.data.slice(0, 77) + '...'
						: t.data;
				li.textContent = t.type + ': ' + preview;
			}
			list.appendChild(li);
		});
	});

	function showStatus(type, msg) {
		status.className = 'status ' + type;
		status.textContent = msg;
	}

	async function blobFromDataUrl(dataUrl, mimeType) {
		var resp = await fetch(dataUrl);
		return await resp.blob();
	}

	btn.addEventListener('click', async function () {
		if (!navigator.clipboard) {
			showStatus(
				'error',
				'Clipboard API not available in this browser or context.'
			);
			return;
		}
		if (typeof navigator.clipboard.write !== 'function') {
			showStatus(
				'error',
				'Clipboard write not supported in this browser.'
			);
			return;
		}

		btn.disabled = true;
		showStatus('info', 'Writing to clipboard...');

		try {
			var clipboardItems = await Promise.all(
				clipboardData.map(async function (entry) {
					var blobs = {};
					await Promise.all(
						entry.types.map(async function (t) {
							if (t.kind === 'text') {
								blobs[t.type] = new Blob(
									[t.data],
									{ type: t.type }
								);
							} else {
								blobs[t.type] = await blobFromDataUrl(
									t.data,
									t.mime
								);
							}
						})
					);
					return new ClipboardItem(blobs);
				})
			);

			await navigator.clipboard.write(clipboardItems);
			showStatus('success', '\\u2705 Clipboard set successfully.');
		} catch (err) {
			console.error('Clipboard write failed:', err);
			showStatus(
				'error',
				'Failed to write to clipboard: ' + (err.message || String(err))
			);
		} finally {
			btn.disabled = false;
		}
	});
})();
</script>
</body>
</html>
`;
}

export async function downloadAsHtml(
	data: ClipboardEntry[],
	label: string | undefined
): Promise<void> {
	const html = await buildHtml(data, label);
	const filename = `clipboard-data-${timestampForFilename()}.html`;
	triggerBrowserDownload(html, filename, 'text/html;charset=utf-8');
}
