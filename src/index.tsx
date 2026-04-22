import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ClipboardInspector } from './ClipboardInspector';
import { extractData } from './extract-data';
import type { ClipboardEntry } from './types';

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
