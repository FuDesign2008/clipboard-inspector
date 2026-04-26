import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MDN_BASE, MDN_URLS } from './mdn-urls';
import { downloadAsZip } from './download/zip';
import { downloadAsMarkdown } from './download/markdown';
import { useTranslation } from './i18n/useTranslation';
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

const SUCCESS_RESET_MS = 2000;

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
	const { t } = useTranslation();

	const [zipState, setZipState] = useState<DownloadState>('idle');
	const [mdState, setMdState] = useState<DownloadState>('idle');

	// Track pending success-reset timers so unmounting or a second click
	// doesn't leak a timer or fire setState on an unmounted component.
	const zipResetTimer = useRef<number | null>(null);
	const mdResetTimer = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (zipResetTimer.current !== null) {
				window.clearTimeout(zipResetTimer.current);
			}
			if (mdResetTimer.current !== null) {
				window.clearTimeout(mdResetTimer.current);
			}
		};
	}, []);

	const autoselect = useCallback((e: React.FocusEvent<HTMLSpanElement>) => {
		const range = document.createRange();
		range.selectNodeContents(e.currentTarget);
		const selection = window.getSelection();
		if (!selection) return;
		selection.removeAllRanges();
		selection.addRange(range);
	}, []);

	const handleDownloadZip = useCallback((): void => {
		setZipState('loading');
		// Wrap async body in a self-invoked function so onClick sees a
		// plain () => void handler (mirrors handleDownloadMarkdown below).
		void (async () => {
			try {
				await downloadAsZip(data, label);
				setZipState('success');
				zipResetTimer.current = window.setTimeout(() => {
					setZipState('idle');
					zipResetTimer.current = null;
				}, SUCCESS_RESET_MS);
			} catch (error: unknown) {
				console.error('Failed to generate ZIP:', error);
				window.alert(t('app.zipError'));
				setZipState('idle');
			}
		})();
	}, [data, label, t]);

	const handleDownloadMarkdown = useCallback((): void => {
		setMdState('loading');
		try {
			downloadAsMarkdown(data, label);
			setMdState('success');
			mdResetTimer.current = window.setTimeout(() => {
				setMdState('idle');
				mdResetTimer.current = null;
			}, SUCCESS_RESET_MS);
		} catch (error: unknown) {
			console.error('Failed to generate Markdown:', error);
			window.alert(t('app.mdError'));
			setMdState('idle');
		}
	}, [data, label, t]);

	function render_file(file: FileInfo | null): React.ReactNode {
		if (!file) return <em>{t('app.notAvailable')}</em>;
		return (
			<table>
				<thead>
					<tr>
						<th>{t('app.colName')}</th>
						<th>{t('app.colSize')}</th>
						<th>{t('app.colType')}</th>
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
			return obj.data || <em>{t('app.emptyString')}</em>;
		}
		return render_file(obj.data);
	}

	if (!data.length) {
		return (
			<div className="intro-msg">
				<h2>{t('app.introTitle')}</h2>
				<ul>
					<li>
						<button
							disabled={has_async_clipboard}
							onClick={onPasteFromClipboard}
						>
							{t('app.pasteClipboard')}
						</button>{' '}
						{t('app.clipboardApiNote')}
					</li>
					<li>
						{t('app.pasteWith')} <kbd>Ctrl+V</kbd> / <kbd>⌘V</kbd>{' '}
						{t('app.keyboardOr')}{' '}
						<span contentEditable onFocus={autoselect}>
							{t('app.pasteInHere')}
						</span>{' '}
						{t('app.noKeyboard')}
					</li>
					<li>{t('app.dropSomething')}</li>
				</ul>
			</div>
		);
	}

	return (
		<div>
			<div className="action-buttons">
				<button type="button" onClick={onReset}>
					{t('app.goBack')}
				</button>
				<button
					type="button"
					onClick={handleDownloadMarkdown}
					disabled={mdState === 'loading'}
					className="download-button download-button--md"
					title={t('app.downloadMdTitle')}
				>
					{mdState === 'loading'
						? t('app.buildingMd')
						: mdState === 'success'
							? t('app.downloaded')
							: t('app.downloadMd')}
				</button>
				<button
					type="button"
					onClick={handleDownloadZip}
					disabled={zipState === 'loading'}
					className="download-button download-button--zip"
					title={t('app.downloadZipTitle')}
				>
					{zipState === 'loading'
						? t('app.generatingZip')
						: zipState === 'success'
							? t('app.downloaded')
							: t('app.downloadZip')}
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
							{t('app.contains')}
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
										{t('app.typesCount', {
											count: render_data.types.length
										})}
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
																	{t(
																		'app.copyAsText'
																	)}
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
										{t('app.itemsCount', {
											count: render_data.items.length
										})}
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
																			{t(
																				'app.emptyString'
																			)}
																		</em>
																	)
																) : (
																	<em>
																		{t(
																			'app.notAvailable'
																		)}
																	</em>
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
										{t('app.filesCount', {
											count: render_data.files.length
										})}
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
