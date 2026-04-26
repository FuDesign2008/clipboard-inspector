export type Lang = 'en' | 'zh';

const en: Record<string, string> = {
	'app.introTitle': 'To get started, either:',
	'app.pasteClipboard': 'Paste using the Clipboard API',
	'app.clipboardApiNote':
		'if your browser supports the Asynchronous Clipboard API',
	'app.pasteWith': 'Paste with the',
	'app.keyboardOr': 'keyboard shortcut or',
	'app.pasteInHere': 'paste in here',
	'app.noKeyboard': "if you don't have a keyboard",
	'app.dropSomething': 'Drop something on the page',

	'app.goBack': '← Go back',
	'app.downloadMd': 'Download as Markdown',
	'app.buildingMd': 'Building Markdown...',
	'app.downloaded': 'Downloaded!',
	'app.downloadMdTitle':
		'Download as a single Markdown file, ready to paste into an AI chat',
	'app.downloadZip': 'Download as ZIP',
	'app.generatingZip': 'Generating ZIP...',
	'app.downloadZipTitle':
		'Download everything (text + binary files) as a ZIP archive',

	'app.contains': 'contains:',
	'app.typesCount': '{count} type(s) available',
	'app.itemsCount': '{count} item(s) available',
	'app.filesCount': '{count} file(s) available',
	'app.copyAsText': 'Copy as plain text',
	'app.emptyString': 'Empty string',
	'app.notAvailable': 'N/A',

	'app.zipError': 'Failed to generate ZIP file. See console for details.',
	'app.mdError': 'Failed to generate Markdown file. See console for details.',

	'app.colName': 'Name',
	'app.colSize': 'Size',
	'app.colType': 'Type'
};

const zh: Record<string, string> = {
	'app.introTitle': '开始使用，可以选择以下方式：',
	'app.pasteClipboard': '使用剪贴板 API 粘贴',
	'app.clipboardApiNote': '（需要浏览器支持异步剪贴板 API）',
	'app.pasteWith': '使用',
	'app.keyboardOr': '键盘快捷键粘贴，或者',
	'app.pasteInHere': '在此处粘贴',
	'app.noKeyboard': '（如果没有键盘）',
	'app.dropSomething': '将内容拖放到页面上',

	'app.goBack': '← 返回',
	'app.downloadMd': '下载为 Markdown',
	'app.buildingMd': '正在生成 Markdown...',
	'app.downloaded': '已下载！',
	'app.downloadMdTitle': '下载为单个 Markdown 文件，可直接粘贴到 AI 对话中',
	'app.downloadZip': '下载为 ZIP',
	'app.generatingZip': '正在生成 ZIP...',
	'app.downloadZipTitle': '将所有内容（文本 + 二进制文件）下载为 ZIP 压缩包',

	'app.contains': '包含：',
	'app.typesCount': '{count} 个可用类型',
	'app.itemsCount': '{count} 个可用项目',
	'app.filesCount': '{count} 个可用文件',
	'app.copyAsText': '复制为纯文本',
	'app.emptyString': '空字符串',
	'app.notAvailable': '不适用',

	'app.zipError': '生成 ZIP 文件失败，详情请查看控制台。',
	'app.mdError': '生成 Markdown 文件失败，详情请查看控制台。',

	'app.colName': '名称',
	'app.colSize': '大小',
	'app.colType': '类型'
};

export const translations = { en, zh };
