import type { ClipboardEntry, FileInfo, ItemEntry, TypeEntry } from './types';

function file_info(file: File | Blob | null): FileInfo | null {
	if (!file) return null;
	const asFile = file as File;
	return {
		name: typeof asFile.name === 'string' ? asFile.name : '',
		size: file.size,
		type: file.type,
		url: URL.createObjectURL(file)
	};
}

export async function extractData(
	data: DataTransfer | ClipboardItem | null | undefined
): Promise<ClipboardEntry | undefined> {
	if (!data) {
		return undefined;
	}

	if (data instanceof DataTransfer) {
		const types: TypeEntry[] = Array.from(data.types).map(type => ({
			type,
			data: data.getData(type)
		}));

		const items: ItemEntry[] = await Promise.all(
			Array.from(data.items).map<Promise<ItemEntry>>(async item => ({
				kind: item.kind,
				type: item.type,
				as_string_or_file:
					item.kind === 'string'
						? await new Promise<string>(resolve => {
								item.getAsString(resolve);
							})
						: file_info(item.getAsFile())
			}))
		);

		const files: (FileInfo | null)[] = Array.from(data.files).map(f =>
			file_info(f)
		);

		return {
			type: 'DataTransfer',
			types,
			items,
			files
		};
	}

	if (data instanceof ClipboardItem) {
		const types: TypeEntry[] = await Promise.all(
			Array.from(data.types).map<Promise<TypeEntry>>(async type => {
				const blob = await data.getType(type);
				const isText = /(^text\/)|(image\/svg\+xml$)/.exec(blob.type);
				return {
					type,
					data: isText ? await blob.text() : file_info(blob)
				};
			})
		);
		return {
			type: 'ClipboardItem',
			types
		};
	}

	return undefined;
}
