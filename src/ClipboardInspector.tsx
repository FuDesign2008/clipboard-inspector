import React, { useCallback, useState } from 'react';
import { MDN_BASE, MDN_URLS } from './mdn-urls';
import { downloadAsZip } from './download/zip';
import { downloadAsMarkdown } from './download/markdown';
import type {
	ClipboardEntry,
	DownloadState,
	FileInfo,
	TypeEntry
} from './types';

export type ClipboardInspectorProps = {
	data: ClipboardEntry[];
	label: string | undefined;
	onReset: () => void;
	onPasteFromClipboard: () => void;
};

export function ClipboardInspector({
	data,
	label,
	onReset,
	onPasteFromClipboard
}: ClipboardInspectorProps): React.ReactElement {
	// Feature detection: `navigator.clipboard` and its members are unavailable in
	// older browsers and non-secure contexts. TypeScript's DOM lib marks them as
	// non-nullable, so narrow behind a single isolated expression that can hold
	// an eslint-disable without getting split across lines by Prettier.
	/* eslint-disable @typescript-eslint/no-unnecessary-condition */
	const has_async_clipboard = !navigator.clipboard?.read;
	const has_clipboard_write =
		typeof navigator.clipboard?.writeText === 'function';
	/* eslint-enable @typescript-eslint/no-unnecessary-condition */

	const [zipState, setZipState] = useState<DownloadState>('idle');
	const [mdState, setMdState] = useState<DownloadState>('idle');

	const autoselect = useCallback((e: React.FocusEvent<HTMLSpanElement>) => {
		const range = document.createRange();
		range.selectNodeContents(e.currentTarget);
		const selection = window.getSelection();
		if (!selection) return;
		selection.removeAllRanges();
		selection.addRange(range);
	}, []);

	const handleDownloadZip = useCallback(async () => {
		setZipState('loading');
		try {
			await downloadAsZip(data, label);
			setZipState('success');
			window.setTimeout(() => {
				setZipState('idle');
			}, 2000);
		} catch (error: unknown) {
			console.error('Failed to generate ZIP:', error);
			window.alert(
				'Failed to generate ZIP file. See console for details.'
			);
			setZipState('idle');
		}
	}, [data, label]);

	const handleDownloadMarkdown = useCallback(() => {
		setMdState('loading');
		try {
			downloadAsMarkdown(data, label);
			setMdState('success');
			window.setTimeout(() => {
				setMdState('idle');
			}, 2000);
		} catch (error: unknown) {
			console.error('Failed to generate Markdown:', error);
			window.alert(
				'Failed to generate Markdown file. See console for details.'
			);
			setMdState('idle');
		}
	}, [data, label]);

	function render_file(file: FileInfo | null): React.ReactNode {
		if (!file) return <em>N/A</em>;
		return (
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Size</th>
						<th>Type</th>
						<th>
							<a
								className="mdn"
								href={`${MDN_BASE}/URL/createObjectURL`}
							>
								URL.createObjectURL(file)
							</a>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<code>{file.name}</code>
						</td>
						<td>
							<code>{file.size}</code>
						</td>
						<td>
							<code>{file.type}</code>
						</td>
						<td>
							<code>
								<a href={file.url}>
									<img src={file.url} alt={file.name} />
								</a>
							</code>
						</td>
					</tr>
				</tbody>
			</table>
		);
	}

	function render_type_cell(obj: TypeEntry): React.ReactNode {
		if (typeof obj.data === 'string') {
			return obj.data || <em>Empty string</em>;
		}
		return render_file(obj.data);
	}

	if (!data.length) {
		return (
			<div className="intro-msg">
				<h2>To get started, either:</h2>
				<ul>
					<li>
						<button
							disabled={has_async_clipboard}
							onClick={onPasteFromClipboard}
						>
							Paste using the Clipboard API
						</button>{' '}
						if your browser supports the Asynchronous Clipboard API
					</li>
					<li>
						Paste with the <kbd>Ctrl+V</kbd> / <kbd>⌘V</kbd>{' '}
						keyboard shortcut or{' '}
						<span contentEditable onFocus={autoselect}>
							paste in here
						</span>{' '}
						if you don&apos;t have a keyboard
					</li>
					<li>Drop something on the page</li>
				</ul>
			</div>
		);
	}

	return (
		<div>
			<div className="action-buttons">
				<button type="button" onClick={onReset}>
					← Go back
				</button>
				<button
					type="button"
					onClick={handleDownloadMarkdown}
					disabled={mdState === 'loading'}
					className="download-button download-button--md"
					title="Download as a single Markdown file, ready to paste into an AI chat"
				>
					{mdState === 'loading'
						? 'Building Markdown...'
						: mdState === 'success'
							? 'Downloaded!'
							: 'Download as Markdown'}
				</button>
				<button
					type="button"
					onClick={() => {
						void handleDownloadZip();
					}}
					disabled={zipState === 'loading'}
					className="download-button download-button--zip"
					title="Download everything (text + binary files) as a ZIP archive"
				>
					{zipState === 'loading'
						? 'Generating ZIP...'
						: zipState === 'success'
							? 'Downloaded!'
							: 'Download as ZIP'}
				</button>
			</div>
			{data.map((render_data, idx) => {
				const URLS = MDN_URLS[render_data.type];
				return (
					<div className="clipboard-summary" key={idx}>
						<h2>
							<a
								className="mdn"
								href={`${MDN_BASE}/${URLS.ctr.url}`}
							>
								{URLS.ctr.label(label)}
							</a>{' '}
							contains:
						</h2>

						{render_data.types.length > 0 && (
							<div className="clipboard-section">
								<h3>
									<a
										className="mdn"
										href={`${MDN_BASE}/DataTransfer/types`}
									>
										.types
									</a>
									<span className="anno">
										{render_data.types.length} type(s)
										available
									</span>
								</h3>
								<table>
									<thead>
										<tr>
											<th>type</th>
											<th>
												<a
													className="mdn"
													href={`${MDN_BASE}/${URLS.getData.url}`}
												>
													{URLS.getData.label}
												</a>
											</th>
										</tr>
									</thead>
									<tbody>
										{render_data.types.map((obj, tIdx) => (
											<tr key={tIdx}>
												<td>
													<code>{obj.type}</code>
													{has_clipboard_write &&
														/^text\//.exec(
															obj.type
														) && (
															<div className="cb-copy">
																<button
																	onClick={() => {
																		void navigator.clipboard.writeText(
																			typeof obj.data ===
																				'string'
																				? obj.data
																				: ''
																		);
																	}}
																>
																	Copy as
																	plain text
																</button>
															</div>
														)}
												</td>
												<td>
													<pre className="cb-entry">
														<code>
															{render_type_cell(
																obj
															)}
														</code>
													</pre>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{render_data.type === 'DataTransfer' && (
							<div className="clipboard-section">
								<h3>
									<a
										className="mdn"
										href={`${MDN_BASE}/DataTransfer/items`}
									>
										.items
									</a>
									<span className="anno">
										{`${render_data.items.length} item(s) available`}
									</span>
								</h3>

								<table>
									<thead>
										<tr>
											<th>kind</th>
											<th>type</th>
											<th>
												<a
													className="mdn"
													href={`${MDN_BASE}/DataTransferItem/getAsString`}
												>
													getAsString()
												</a>{' '}
												{' / '}
												<a
													className="mdn"
													href={`${MDN_BASE}/DataTransferItem/getAsFile`}
												>
													getAsFile()
												</a>
											</th>
										</tr>
									</thead>
									<tbody>
										{render_data.items.map((item, iIdx) => (
											<tr key={iIdx}>
												<td>
													<code>{item.kind}</code>
												</td>
												<td>
													<code>{item.type}</code>
												</td>
												<td>
													{item.kind === 'string' ? (
														<pre className="cb-entry">
															<code>
																{typeof item.as_string_or_file ===
																'string' ? (
																	item.as_string_or_file || (
																		<em>
																			Empty
																			string
																		</em>
																	)
																) : (
																	<em>N/A</em>
																)}
															</code>
														</pre>
													) : (
														render_file(
															typeof item.as_string_or_file ===
																'string'
																? null
																: item.as_string_or_file
														)
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{render_data.type === 'DataTransfer' && (
							<div className="clipboard-section">
								<h3>
									<a
										className="mdn"
										href={`${MDN_BASE}/DataTransfer/files`}
									>
										.files
									</a>
									<span className="anno">
										{`${render_data.files.length} file(s) available`}
									</span>
								</h3>
								{render_data.files.map((file, fIdx) => (
									<div key={fIdx}>{render_file(file)}</div>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
