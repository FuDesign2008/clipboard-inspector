# Browser Extension

A browser extension version of Clipboard Inspector for quick clipboard checks without opening the website.

## Features

- Read clipboard contents directly from browser toolbar
- View MIME types and data previews
- Quick access to web version and GitHub

## Installation (Development)

### Chrome / Edge

1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `extension/manifest.json`

## Permissions

- `clipboardRead` — Read clipboard contents
- `clipboardWrite` — Future: write to clipboard
- `activeTab` — Current tab access

## Notes

The extension uses the `navigator.clipboard.read()` API which requires:
- HTTPS context
- User interaction (button click)
- Browser permission grant

Some browsers may not support reading all clipboard formats via extension.

## Future Features

- [ ] Export to Markdown/ZIP
- [ ] Clipboard history
- [ ] Keyboard shortcut
- [ ] Context menu integration
