# Clipboard Inspector

[![CI](https://github.com/FuDesign2008/clipboard-inspector/actions/workflows/ci.yml/badge.svg)](https://github.com/FuDesign2008/clipboard-inspector/actions/workflows/ci.yml)

A tool to help you explore the kinds of data available when you paste something on a web page, or drop something onto it:

[https://evercoder.github.io/clipboard-inspector/](https://evercoder.github.io/clipboard-inspector/) (upstream)

## Features

-   Inspect clipboard contents from `paste`, drag-and-drop, and the Async Clipboard API
-   Preview text, images, and other binary payloads
-   **Download as Markdown** — a single `.md` file that is easy to paste into an AI assistant for diagnosis
-   **Download as ZIP** — a structured archive containing text, binary files, and manifests, suitable for bug reports and offline analysis

## Project layout

```
clipboard-inspector/
├── src/                        # TypeScript source (edit here)
│   ├── index.tsx               # App entry point: render + event bindings
│   ├── ClipboardInspector.tsx  # Main React component
│   ├── extract-data.ts         # Clipboard data extraction (DataTransfer / ClipboardItem)
│   ├── mdn-urls.ts             # MDN reference URLs used in the UI
│   ├── types.ts                # Shared domain types (ClipboardEntry, FileInfo, ...)
│   └── download/
│       ├── utils.ts            # Shared helpers (MIME, filenames, download trigger)
│       ├── markdown.ts         # Markdown export
│       └── zip.ts              # ZIP export (JSZip)
├── tsconfig.json               # TypeScript config (strict, bundler-resolved)
├── index.html                  # GitHub Pages entry (loads ./index.js)
├── style.css                   # Styles
├── package.json
└── README.md
```

> The only build artifact, `index.js`, is generated from `src/` via esbuild
> and is **not** checked into version control. GitHub Pages is published
> automatically from `.github/workflows/deploy.yml` (which runs `npm run build`
> and uploads `index.html` + `index.js` + `style.css` as a Pages artifact).

## Getting started

The project requires Node and npm to run locally. After cloning the repo, run `npm install` in the project folder to install all dependencies.

A few scripts are available:

-   `npm run start` — start a local dev server with esbuild (auto-rebuilds on save)
-   `npm run typecheck` — run `tsc --noEmit` against the strict `tsconfig.json`
-   `npm run lint` / `npm run lint:fix` — ESLint 9 (flat config) + typescript-eslint + react + react-hooks, with style rules deferred to Prettier
-   `npm run test` / `npm run test:run` — Vitest (unit tests for pure functions, `src/**/*.test.ts`)
-   `npm run build` — type-check → lint → bundle `src/index.tsx` → `index.js`

Deployment is fully automated: every push to `main` triggers
`.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.

## TypeScript

The project is written in strict TypeScript:

-   `strict: true`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
-   `moduleResolution: "bundler"` — pairs with esbuild, no `.ts` extensions in imports
-   esbuild strips types at build time; `tsc --noEmit` enforces type correctness separately
-   React 18 types are pinned to `@types/react@^18.3` / `@types/react-dom@^18.3` to match the runtime

## Quality gates

CI (`.github/workflows/ci.yml`) runs on every push and PR to `main`, executing:

```
typecheck → lint → test → build
```

A separate `.github/workflows/deploy.yml` builds and publishes to GitHub
Pages on every push to `main` (via `actions/upload-pages-artifact` +
`actions/deploy-pages`), so the `index.js` bundle never needs to live in
version control.

Locally, the `build` script enforces `typecheck` and `lint` before emitting
`index.js`. Vitest covers the pure Markdown serialization layer
(`src/download/markdown.ts`, 13 specs including fence expansion, table
escaping, and byte formatting). Component tests are intentionally out of
scope for now — the UI is kept thin.

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
