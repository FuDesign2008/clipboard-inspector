export type FileInfo = {
	name: string;
	size: number;
	type: string;
	url: string;
};

export type TypeEntry = {
	type: string;
	data: string | FileInfo | null;
};

export type ItemEntry = {
	kind: string;
	type: string;
	as_string_or_file: string | FileInfo | null;
};

export type DataTransferEntry = {
	type: 'DataTransfer';
	types: TypeEntry[];
	items: ItemEntry[] | null;
	files: (FileInfo | null)[] | null;
};

export type ClipboardItemEntry = {
	type: 'ClipboardItem';
	types: TypeEntry[];
	items?: undefined;
	files?: undefined;
};

export type ClipboardEntry = DataTransferEntry | ClipboardItemEntry;

export type DownloadState = 'idle' | 'loading' | 'success';

export type MdnUrlsEntry = {
	ctr: {
		url: string;
		label: (label: string | undefined) => string;
	};
	getData: {
		url: string;
		label: string;
	};
};
