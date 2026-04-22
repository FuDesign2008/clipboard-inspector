import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ClipboardInspector } from './ClipboardInspector';
import { extractData } from './extract-data';
import type { ClipboardEntry, FileInfo } from './types';

const app_el = document.getElementById('app');
if (!app_el) {
	throw new Error('Missing #app root element in index.html');
}

const root: Root = createRoot(app_el);

type RenderInput =
	| DataTransfer
	| ClipboardItem
	| (DataTransfer | ClipboardItem)[]
	| null
	| undefined;

// extractData produces FileInfo objects whose `.url` comes from
// URL.createObjectURL(). Each new render batch supersedes the previous
// one (the DOM stops referencing the old URLs), so we collect the URLs
// owned by each render and revoke the prior batch once React has
// committed the new tree.
let activeObjectUrls: string[] = [];

function collectObjectUrls(entries: ClipboardEntry[]): string[] {
	const urls: string[] = [];
	const visitFile = (f: FileInfo | null | undefined): void => {
		if (f?.url) urls.push(f.url);
	};
	for (const entry of entries) {
		for (const t of entry.types) {
			if (t.data && typeof t.data === 'object') visitFile(t.data);
		}
		if (entry.type === 'DataTransfer') {
			for (const it of entry.items) {
				if (typeof it.as_string_or_file === 'object') {
					visitFile(it.as_string_or_file);
				}
			}
			for (const f of entry.files) visitFile(f);
		}
	}
	return urls;
}

async function render(data?: RenderInput, label?: string): Promise<void> {
	const list: (DataTransfer | ClipboardItem)[] = data
		? Array.isArray(data)
			? data
			: [data]
		: [];

	const resolved = await Promise.all(list.map(extractData));
	const extracted_data: ClipboardEntry[] = resolved.filter(
		(entry): entry is ClipboardEntry => Boolean(entry)
	);

	const previousUrls = activeObjectUrls;
	activeObjectUrls = collectObjectUrls(extracted_data);

	root.render(
		<ClipboardInspector
			data={extracted_data}
			label={label}
			onReset={() => {
				void render();
			}}
			onPasteFromClipboard={() => {
				navigator.clipboard
					.read()
					.then(items => {
						void render(items, 'ClipboardItems');
					})
					.catch((error: unknown) => {
						console.error('Clipboard read failed:', error);
					});
			}}
		/>
	);

	// Release the prior batch of object URLs *after* React has had a
	// chance to commit the new tree. Doing this synchronously would
	// invalidate images the old DOM is still painting.
	if (previousUrls.length > 0) {
		window.setTimeout(() => {
			for (const url of previousUrls) {
				URL.revokeObjectURL(url);
			}
		}, 0);
	}
}

void render();

document.addEventListener('paste', (e: ClipboardEvent) => {
	void render(e.clipboardData, 'clipboardData');
});

document.addEventListener('dragover', (e: DragEvent) => {
	e.preventDefault();
});

document.addEventListener('drop', (e: DragEvent) => {
	void render(e.dataTransfer, 'dataTransfer');
	e.preventDefault();
});
