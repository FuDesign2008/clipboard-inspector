import React, { useCallback, useState } from 'react';
import { MDN_BASE, MDN_URLS } from './mdn-urls.js';
import { downloadAsZip } from './download/zip.js';
import { downloadAsMarkdown } from './download/markdown.js';

export function ClipboardInspector(props) {
	const { data, label, onReset, onPasteFromClipboard } = props;
	const has_async_clipboard =
		!navigator.clipboard || !navigator.clipboard.read;

	const [zipState, setZipState] = useState('idle');
	const [mdState, setMdState] = useState('idle');

	const autoselect = useCallback(e => {
		const range = document.createRange();
		range.selectNodeContents(e.target);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}, []);

	const handleDownloadZip = useCallback(async () => {
		setZipState('loading');
		try {
			await downloadAsZip(data, label);
			setZipState('success');
			setTimeout(() => setZipState('idle'), 2000);
		} catch (error) {
			console.error('Failed to generate ZIP:', error);
			alert('Failed to generate ZIP file. See console for details.');
			setZipState('idle');
		}
	}, [data, label]);

	const handleDownloadMarkdown = useCallback(() => {
		setMdState('loading');
		try {
			downloadAsMarkdown(data, label);
			setMdState('success');
			setTimeout(() => setMdState('idle'), 2000);
		} catch (error) {
			console.error('Failed to generate Markdown:', error);
			alert('Failed to generate Markdown file. See console for details.');
			setMdState('idle');
		}
	}, [data, label]);

	function render_file(file) {
		return file ? (
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
									<img src={file.url} />
								</a>
							</code>
						</td>
					</tr>
				</tbody>
			</table>
		) : (
			<em>N/A</em>
		);
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
						if you don't have a keyboard
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
					onClick={handleDownloadZip}
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

						{render_data.types && (
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
										{render_data.types.map((obj, idx) => (
											<tr key={idx}>
												<td>
													<code>{obj.type}</code>
													{obj.type.match(
														/^text\//
													) &&
														navigator.clipboard &&
														navigator.clipboard
															.writeText && (
															<div className="cb-copy">
																<button
																	onClick={e =>
																		navigator.clipboard.writeText(
																			obj.data
																		)
																	}
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
															{typeof obj.data ===
															'object'
																? render_file(
																		obj.data
																  )
																: obj.data || (
																		<em>
																			Empty
																			string
																		</em>
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

						{render_data.items && (
							<div className="clipboard-section">
								<h3>
									<a
										className="mdn"
										href={`${MDN_BASE}/DataTransfer/items`}
									>
										.items
									</a>
									<span className="anno">
										{render_data.items ? (
											`${render_data.items.length} item(s) available`
										) : (
											<em>Undefined</em>
										)}
									</span>
								</h3>

								{render_data.items ? (
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
											{render_data.items.map(
												(item, idx) => (
													<tr key={idx}>
														<td>
															<code>
																{item.kind}
															</code>
														</td>
														<td>
															<code>
																{item.type}
															</code>
														</td>
														<td>
															{item.kind ===
															'string' ? (
																<pre className="cb-entry">
																	<code>
																		{item.as_string_or_file || (
																			<em>
																				Empty
																				string
																			</em>
																		)}
																	</code>
																</pre>
															) : (
																render_file(
																	item.as_string_or_file
																)
															)}
														</td>
													</tr>
												)
											)}
										</tbody>
									</table>
								) : null}
							</div>
						)}

						{render_data.files && (
							<div className="clipboard-section">
								<h3>
									<a
										className="mdn"
										href={`${MDN_BASE}/DataTransfer/files`}
									>
										.files
									</a>
									<span className="anno">
										{render_data.files
											? `${render_data.files.length} file(s) available`
											: '<em>Undefined</em>'}
									</span>
								</h3>
								{render_data.files ? (
									render_data.files.map((file, idx) => (
										<div key={idx}>{render_file(file)}</div>
									))
								) : (
									<span>N/A</span>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
