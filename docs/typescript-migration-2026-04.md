# TypeScript 迁移说明（2026-04）

## 背景

本次迁移将 `clipboard-inspector` 从 JavaScript/JSX 全量迁移到 TypeScript/TSX，采用「一步到位严格版」策略，保留 esbuild 构建链，不破坏 `gh-pages -d .` 部署假设。

## 设计决策

### 1. 构建器选择：保留 esbuild

esbuild 0.17 原生支持 `.ts` / `.tsx`（自动剥离类型，但不做类型检查）。因此：

- 构建链零改动，产物 `index.js` 仍在根目录，GitHub Pages 部署路径不变
- 类型检查通过 `tsc --noEmit` 作为独立关卡，在 `build` 脚本里前置执行

这是最小侵入、收益最大的方案，避免了更换 Vite / webpack 带来的配置大改造和部署链条破坏。

### 2. tsconfig 严格度：全严格

```json
{
	"strict": true,
	"noUncheckedIndexedAccess": true,
	"exactOptionalPropertyTypes": true,
	"noImplicitOverride": true,
	"noFallthroughCasesInSwitch": true,
	"noImplicitReturns": true,
	"useUnknownInCatchVariables": true,
	"verbatimModuleSyntax": true,
	"isolatedModules": true,
	"moduleResolution": "bundler",
	"target": "ES2022",
	"lib": ["ES2022", "DOM", "DOM.Iterable"],
	"jsx": "react"
}
```

- **`moduleResolution: "bundler"`** 是 TS 5.0+ 推荐配合 esbuild/Vite 的最新做法，允许省略扩展名与 package.json 的 `exports` 字段支持
- **`isolatedModules`** 确保每个文件可独立编译，与 esbuild 的单文件转换模型一致
- **`verbatimModuleSyntax`** 强制区分 `import type` 与运行时 `import`，避免打包时出现空的副作用 import

### 3. 类型模型：判别联合（Discriminated Union）

`src/types.ts` 把 `ClipboardEntry` 定义为 `DataTransferEntry | ClipboardItemEntry`，用 `type` 字段做判别：

```ts
export type DataTransferEntry = {
	type: 'DataTransfer';
	types: TypeEntry[];
	items: ItemEntry[] | null;
	files: (FileInfo | null)[] | null;
};

export type ClipboardItemEntry = {
	type: 'ClipboardItem';
	types: TypeEntry[];
	items?: undefined; // 用 `?: undefined` 让 exactOptionalPropertyTypes 下的交叉访问更顺
	files?: undefined;
};

export type ClipboardEntry = DataTransferEntry | ClipboardItemEntry;
```

消费侧（如 `ClipboardInspector.tsx`、`zip.ts`、`markdown.ts`）通过 `'items' in render_data` / `'files' in render_data` 做类型收窄，不会误访问不存在的字段。

### 4. React 类型：锁定 `@types/react@^18.3`

项目运行时是 `react@18.2.0`。`@types/react@19` 对 `ReactNode` 的签名做了破坏性收紧，会导致 JSX 报错。方案固定 `^18.3.12` 与 `^18.3.1`，匹配运行时版本。

### 5. 关键改造点

| 文件                         | 关键改造                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types.ts`               | 新增：集中声明 6 个领域类型                                                                                                                                              |
| `src/mdn-urls.ts`            | `MDN_URLS` 用 `Readonly<Record<ClipboardEntry['type'], MdnUrlsEntry>>`，形状受约束                                                                                       |
| `src/extract-data.ts`        | 返回 `Promise<ClipboardEntry \| undefined>`；`new Promise<string>(...)` 显式泛型；file_info 参数类型扩宽到 `File \| Blob \| null`                                        |
| `src/download/utils.ts`      | `triggerBrowserDownload(blobOrString: Blob \| string, ...)` 联合参数，内部用 `typeof === 'string'` narrow                                                                |
| `src/download/zip.ts`        | `zip.folder()` 返回 `JSZip \| null`，每处加非空守卫；`ItemManifestEntry` / `FileManifestEntry` 联合类型描述成功/失败分支                                                 |
| `src/download/markdown.ts`   | 全部 helper 加返回值类型；消费侧用 `'items' in entry` 收窄；`FileInfo` 类型显式导入                                                                                      |
| `src/ClipboardInspector.tsx` | 显式 `ClipboardInspectorProps` 接口；`useState<DownloadState>`；event handler 参数类型（`React.MouseEvent`、`React.FocusEvent`）；`window.setTimeout` 避免 Node 类型污染 |
| `src/index.tsx`              | `document.getElementById('app')` 加运行时守卫；`RenderInput` 联合描述所有入参；类型谓词 `(entry): entry is ClipboardEntry` 过滤 undefined                                |

### 6. 严格模式带来的代码质量改进

- `noUncheckedIndexedAccess` 开启后，`MDN_URLS[render_data.type]` 返回 `MdnUrlsEntry \| undefined`，强制在 UI 层加 `if (!URLS) return null` 守卫
- `exactOptionalPropertyTypes` 阻止对可选字段赋 `undefined`，发现了原 JSX 里 `'<em>Undefined</em>'` 这种字面量字符串作为 JSX 分支值的可疑写法，修正为条件渲染
- `useUnknownInCatchVariables` 把 `catch (error)` 变成 `catch (error: unknown)`，避免对未知类型做未检查的属性访问

## 构建/部署约定

```bash
npm install          # 安装（首次或依赖更新）
npm run typecheck    # tsc --noEmit 独立类型检查
npm run build        # typecheck + esbuild 打包
npm run deploy       # build + gh-pages -d .
npm start            # esbuild servedir 启动 dev server（自动重编译）
```

`build` 脚本前置了 `typecheck`，确保类型错误会阻断发布。

## 向后兼容性

- 部署产物 `index.js` 路径不变 → `index.html` 与 `gh-pages` 流程零改动
- 所有既有功能（Markdown 下载、ZIP 下载、粘贴/拖拽检查）保持不变
- 单元测试等价性：14/14 Markdown 测试用例全部通过

## 遗留 / 后续建议

- [ ] 可选：引入 ESLint + typescript-eslint 做额外 lint（本次未做，保持最小改动）
- [ ] 可选：把 Markdown 单元测试从临时脚本升级到 Vitest（若未来功能扩张再做）
- [ ] 可选：将 `npm run typecheck` 接入 pre-commit `.git-hooks`（本次未做，避免提交变慢）

## 变更文件清单

| 类型        | 文件                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| 新增        | `tsconfig.json`、`src/types.ts`、`docs/typescript-migration-2026-04.md` |
| 重命名+改写 | `src/index.jsx` → `src/index.tsx`                                       |
| 重命名+改写 | `src/ClipboardInspector.jsx` → `src/ClipboardInspector.tsx`             |
| 重命名+改写 | `src/mdn-urls.js` → `src/mdn-urls.ts`                                   |
| 重命名+改写 | `src/extract-data.js` → `src/extract-data.ts`                           |
| 重命名+改写 | `src/download/utils.js` → `src/download/utils.ts`                       |
| 重命名+改写 | `src/download/zip.js` → `src/download/zip.ts`                           |
| 重命名+改写 | `src/download/markdown.js` → `src/download/markdown.ts`                 |
| 修改        | `package.json`（入口、scripts、devDeps）                                |
| 修改        | `.gitignore`（`*.tsbuildinfo`）                                         |
| 修改        | `README.md`（目录结构与 typecheck 说明）                                |
