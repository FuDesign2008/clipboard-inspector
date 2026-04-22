# 工程改进一揽子（2026-04）

> 一次全量工程扫描后输出的改进清单，按优先级分层执行；本文件记录"为什么这么选"。

## 一、扫描触发

上一轮（`#4` 按钮风格统一）合并后，用户希望做一轮**整体工程体检**，并特别提出："`index.js` / `index.html` / `style.css` 似乎是 build 生成的，不应该存放在工程中。"

## 二、事实核验：三文件的真实性质

| 文件         | 性质        | 依据                                                                              |
| ------------ | ----------- | --------------------------------------------------------------------------------- |
| `index.js`   | ✅ 构建产物 | `build` 脚本中由 `esbuild src/index.tsx --outfile=index.js ...` 生成，自带 banner |
| `index.html` | ❌ 源文件   | 手写；未被任何 build 流程处理；浏览器直接加载                                     |
| `style.css`  | ❌ 源文件   | 手写；`index.html` 用 `<link>` 直接引用；未入 bundle                              |

**结论**：只有 `index.js` 是产物。共存于根目录的真正原因是 GitHub Pages 的「Deploy from a branch」模式：该模式从 `gh-pages` 分支拉根目录提供静态服务，因此 `index.js` 必须和 `index.html`、`style.css` 一起被复制到 `gh-pages` 分支——而 `npm run deploy` 脚本又要求它在工作区（即 `main` 分支根）里能读到。

## 三、根因聚类

| 聚类                     | 根因                                                  |
| ------------------------ | ----------------------------------------------------- |
| ① 产物与部署治理         | Pages 用 legacy 分支模式 → 被迫让产物入库             |
| ② 依赖新鲜度与自动化治理 | 无 Dependabot；Prettier/esbuild 版本大幅滞后          |
| ③ 本地质量门禁           | pre-commit 只跑 `pretty-quick`，lint/typecheck 全后置 |
| ④ 代码质量与可测试性     | 380 行单文件 + async 不对称 + object URL 泄漏         |
| ⑤ 文档与身份治理         | Fork 未改 demo/source 链接；`docs/` 无索引            |

## 四、方案选择矩阵

| 聚类 | 候选方案                                          | 选定   | 关键理由                                                                     |
| ---- | ------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| ①    | A1: Pages 切 Actions 部署                         | **A1** | 根治"产物入库"；消除一致性 CI 校验、`gh-pages` 依赖、`amend index.js` 工作流 |
|      | A2: `.gitattributes` 折叠 diff                    |        | 治标；`index.js` 仍在 main                                                   |
|      | A3: 继续现状                                      |        | 已被用户否决                                                                 |
| ②    | B1: 一次性大升 + Dependabot                       | **B1** | 现有差距已大，单独加 Dependabot 会立刻制造一堆噪音 PR，不如先清零再订阅      |
|      | B2: 只加 Dependabot                               |        | 留尾巴                                                                       |
| ③    | C1: husky v9 + lint-staged                        |        | 再引入一个 devDep 和全局 hook 管理层，边际收益不值                           |
|      | C2: 现有 `.git-hooks/` + lint-staged              | **C2** | 保留 `core.hooksPath` 既有约定，单独加 `lint-staged`                         |
|      | C3: simple-git-hooks                              |        | 同 C1                                                                        |
| ④    | D1: 拆组件 + 补测（全量）                         |        | scope 太大，会让本 PR 失控；留下一轮                                         |
|      | D2: 只修 `onClick` async 不对称 + object URL 泄漏 | **D2** | 两个明确风险点，低成本                                                       |
| ⑤    | E1: URL 修正 + docs 索引 + backlog 记录           | **E1** | 低成本刚需                                                                   |

**主动放弃**（留下轮）：`utils.ts` / `zip.ts` 的 Vitest 补测、`ClipboardInspector.tsx` 拆组件、统一 snake_case → camelCase 命名、React 18 → 19 升级。

## 五、执行顺序（6 个 commit / 1 个 PR）

1. **feat(pages)**: Pages 切 Actions 部署；`git rm index.js`；移除 `gh-pages` 依赖与 `deploy` 脚本；`ci.yml` 删 artifact 校验步骤
2. **chore(deps)**: `prettier@3`、`pretty-quick@4`、`esbuild@0.28`、`react@18.3.1`；`npx prettier -w .` 应用新格式
3. **chore(ci)**: `.github/dependabot.yml`（分组：eslint / prettier / react / testing）；`.github/workflows/codeql.yml`
4. **chore(dx)**: `lint-staged`；pre-commit 改为 `lint-staged` + `tsc --noEmit`；`.editorconfig`；`engines.node >=20`
5. **refactor(ui)**: `ClipboardInspector.tsx` 两 handler 签名对称化、`useRef` 追踪 reset timer；`index.tsx` 增加 object URL 生命周期管理
6. **docs**: README 双 demo 链接、`index.html` fork footer、`docs/README.md` 索引、本文件

## 六、部署切换操作指引（PR 合并后）

Pages 源模式切换是破坏性变更，按以下顺序执行可零停机：

```bash
# 1. 合并本 PR（gh-pages 分支仍在服务老版本）
gh pr merge <N> --squash --delete-branch

# 2. 切 Pages 源为 workflow（此时页面仍由 gh-pages 提供服务）
gh api -X PUT repos/FuDesign2008/clipboard-inspector/pages \
       -f build_type=workflow

# 3. 触发首次 workflow 部署
#    （合并 PR 会自动触发 push 事件，Actions 会跑 deploy.yml；
#     如合并后仍未触发，可手动 dispatch：）
gh workflow run deploy.yml -R FuDesign2008/clipboard-inspector

# 4. 观察 Actions 运行完成 + Pages build 切到新 artifact
gh run list --workflow=deploy.yml -L 3
gh api repos/FuDesign2008/clipboard-inspector/pages/builds/latest | jq .status
```

`gh-pages` 分支保留作为历史存档；后续不再 `npm run deploy`。

## 七、验收清单

- [x] CI 所有 workflow 跑绿：`ci.yml`（typecheck/lint/test/build）、`codeql.yml`（首次扫描）
- [x] `deploy.yml` 首次部署成功，Pages URL 正确响应新版本
- [x] `npm ls` 不含 `gh-pages`；`index.js` 不在 `git ls-tree`
- [x] 本地 `git commit` 走新 pre-commit hook（lint-staged + tsc）
- [x] Vitest 13 例仍全过
- [x] Bundle 体积持平或下降（实测 451.9kb → 436.2kb，-3.5%）

## 八、未完事项（留给下一轮）

- 拆 `ClipboardInspector.tsx`（380 行 → 5-6 个子组件 + 自定义 hook）
- 补 `utils.ts` / `zip.ts` 纯函数 Vitest（目标再加 15-20 例）
- 统一源码命名风格（决定走 camelCase 还是 snake_case，全量搜索替换 + eslint 规则落地）
- 评估 React 19 升级可行性（当前不紧迫，React 特性面很薄）
- 可选：加 `aria-live` 通知 + `aria-label` 优化下载按钮的可及性
