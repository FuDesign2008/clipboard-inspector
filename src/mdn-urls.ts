import type { MdnUrlsEntry, ClipboardEntry } from './types';

export const MDN_BASE = `https://developer.mozilla.org/en-US/docs/Web/API`;

export const MDN_URLS: Readonly<Record<ClipboardEntry['type'], MdnUrlsEntry>> =
	{
		DataTransfer: {
			ctr: {
				url: 'DataTransfer',
				label: label => `event.${label ?? 'data'}`
			},
			getData: {
				url: 'DataTransfer/getData',
				label: 'getData(type)'
			}
		},
		ClipboardItem: {
			ctr: {
				url: 'ClipboardItem',
				label: () => 'ClipboardItem'
			},
			getData: {
				url: 'ClipboardItem/getType',
				label: 'getType(type)'
			}
		}
	};
