import React from 'react';
import ReactDOM from 'react-dom';
import { ClipboardInspector } from './ClipboardInspector.jsx';
import { extractData } from './extract-data.js';

const app_el = document.getElementById('app');

async function render(data, label) {
	const extracted_data = data
		? await Promise.all(
				(Array.isArray(data) ? data : [data]).map(extractData)
		  )
		: [];
	ReactDOM.render(
		<ClipboardInspector
			data={extracted_data}
			label={label}
			onReset={() => render()}
			onPasteFromClipboard={() => {
				navigator.clipboard.read().then(d => {
					render(d, 'ClipboardItems');
				});
			}}
		/>,
		app_el
	);
}

render();

document.addEventListener('paste', e => {
	render(e.clipboardData, 'clipboardData');
});

document.addEventListener('dragover', e => {
	e.preventDefault();
});

document.addEventListener('drop', e => {
	render(e.dataTransfer, 'dataTransfer');
	e.preventDefault();
});
