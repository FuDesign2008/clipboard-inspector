export function sanitizeFilename(str: string | undefined | null): string {
	if (!str) return 'unknown';
	return str
		.replace(/\//g, '-')
		.replace(/[<>:"|?*\\]/g, '')
		.replace(/\s+/g, '-')
		.toLowerCase();
}

export function isTextMimeType(mimeType: string | undefined | null): boolean {
	if (!mimeType) return false;
	return (
		mimeType.startsWith('text/') ||
		mimeType === 'application/json' ||
		mimeType === 'application/xml' ||
		mimeType === 'application/javascript' ||
		mimeType === 'application/xhtml+xml' ||
		mimeType.includes('+xml') ||
		mimeType.includes('+json')
	);
}

const MIME_TO_EXT: Readonly<Record<string, string>> = {
	'image/png': '.png',
	'image/jpeg': '.jpg',
	'image/jpg': '.jpg',
	'image/gif': '.gif',
	'image/webp': '.webp',
	'image/svg+xml': '.svg',
	'image/bmp': '.bmp',
	'application/pdf': '.pdf',
	'application/zip': '.zip',
	'application/x-zip-compressed': '.zip',
	'video/mp4': '.mp4',
	'video/webm': '.webm',
	'audio/mpeg': '.mp3',
	'audio/wav': '.wav',
	'text/plain': '.txt',
	'text/html': '.html',
	'text/css': '.css',
	'application/json': '.json',
	'application/javascript': '.js'
};

export function getFileExtension(
	mimeType: string | undefined | null,
	defaultExt = '.bin'
): string {
	if (!mimeType) return defaultExt;
	return MIME_TO_EXT[mimeType] ?? defaultExt;
}

export async function fetchBlobFromObjectURL(
	url: string
): Promise<Blob | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(`Failed to fetch blob from ${url}`);
			return null;
		}
		return await response.blob();
	} catch (error: unknown) {
		console.error(`Error fetching blob from ${url}:`, error);
		return null;
	}
}

export function timestampForFilename(date: Date = new Date()): string {
	return date
		.toISOString()
		.replace(/:/g, '')
		.replace(/\..+/, '')
		.replace('T', '_');
}

export function triggerBrowserDownload(
	blobOrString: Blob | string,
	filename: string,
	mimeType?: string
): void {
	const blob =
		typeof blobOrString === 'string'
			? new Blob([blobOrString], {
					type: mimeType ?? 'text/plain;charset=utf-8'
			  })
			: blobOrString;
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	window.setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

export function mimeToMarkdownLang(
	mimeType: string | undefined | null
): string {
	if (!mimeType) return '';
	if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml')
		return 'html';
	if (mimeType === 'text/css') return 'css';
	if (mimeType === 'application/javascript') return 'js';
	if (mimeType === 'application/json' || mimeType.includes('+json'))
		return 'json';
	if (mimeType === 'application/xml' || mimeType.includes('+xml'))
		return 'xml';
	if (mimeType === 'text/markdown') return 'markdown';
	if (mimeType === 'text/csv') return 'csv';
	if (mimeType.startsWith('text/')) return '';
	return '';
}
