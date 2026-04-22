export async function extractData(data) {
	if (!data) {
		return undefined;
	}

	const file_info = file =>
		file
			? {
					name: file.name,
					size: file.size,
					type: file.type,
					url: URL.createObjectURL(file)
			  }
			: null;

	if (data instanceof DataTransfer) {
		return {
			type: 'DataTransfer',
			types: Array.from(data.types).map(type => ({
				type,
				data: data.getData(type)
			})),
			items: data.items
				? await Promise.all(
						Array.from(data.items).map(async item => ({
							kind: item.kind,
							type: item.type,
							as_string_or_file:
								item.kind === 'string'
									? await new Promise(r =>
											item.getAsString(r)
									  )
									: file_info(item.getAsFile())
						}))
				  )
				: null,
			files: data.files ? Array.from(data.files).map(file_info) : null
		};
	}

	if (data instanceof ClipboardItem) {
		return {
			type: 'ClipboardItem',
			types: await Promise.all(
				Array.from(data.types).map(async type => {
					const blob = await data.getType(type);
					return {
						type: type,
						data: blob.type.match(/(^text\/)|(image\/svg\+xml$)/)
							? await blob.text()
							: file_info(blob)
					};
				})
			)
		};
	}
	return undefined;
}
