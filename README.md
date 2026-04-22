# Clipboard Inspector

A tool to help you explore the kinds of data available when you paste something on a web page, or drop something onto it:

[https://evercoder.github.io/clipboard-inspector/](https://evercoder.github.io/clipboard-inspector/)

## Features

-   Inspect clipboard contents from `paste`, drag-and-drop, and the Async Clipboard API
-   Preview text, images, and other binary payloads
-   **Download as Markdown** — a single `.md` file that is easy to paste into an AI assistant for diagnosis
-   **Download as ZIP** — a structured archive containing text, binary files, and manifests, suitable for bug reports and offline analysis

## Project layout

```
clipboard-inspector/
├── src/                        # Source code (edit here)
│   ├── index.jsx               # App entry point: render + event bindings
│   ├── ClipboardInspector.jsx  # Main React component
│   ├── extract-data.js         # Clipboard data extraction (DataTransfer / ClipboardItem)
│   ├── mdn-urls.js             # MDN reference URLs used in the UI
│   └── download/
│       ├── utils.js            # Shared helpers (MIME, filenames, download trigger)
│       ├── markdown.js         # Markdown export
│       └── zip.js              # ZIP export (JSZip)
├── index.html                  # GitHub Pages entry (loads ./index.js)
├── index.js                    # Build artifact, generated from src/ via esbuild
├── style.css                   # Styles
├── package.json
└── README.md
```

> `index.js` is a committed build artifact so that GitHub Pages (which serves the repo root)
> can load it directly. Do not edit it by hand — run `npm run build` instead.

## Getting started

The project requires Node and npm to run locally. After cloning the repo, run `npm install` in the project folder to install all dependencies.

A few scripts are available:

-   `npm run start` starts a local server on [127.0.0.1:8000](http://127.0.0.1:8000/)
-   `npm run build` bundles `src/index.jsx` into `index.js`
-   `npm run deploy` builds the project and pushes to the `gh-pages` Git branch, where GitHub Pages is set up to run

## Exports

### Markdown export

A single `.md` file with:

-   Header (timestamp, source kind, counts)
-   One section per clipboard entry (`DataTransfer` / `ClipboardItem`)
-   Tables for `.types` / `.items` / `.files`
-   Text payloads rendered in fenced code blocks with a language hint inferred from the MIME type
-   Binary payloads described by `name`, `type`, and human-readable size

This format is designed to be pasted directly into a chat with an AI assistant.

### ZIP export

A structured archive:

```
clipboard-data-<timestamp>.zip
├── README.txt
├── metadata.json
└── data-<n>/
    ├── types/      # one file per MIME type
    ├── items/      # string items + files, with manifest.json
    └── files/      # dropped/pasted files, with manifest.json
```

Binary payloads are preserved as-is, which makes the archive useful for sharing
reproducible bug reports.
