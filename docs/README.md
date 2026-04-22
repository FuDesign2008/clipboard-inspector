# 设计与重构记录

本目录收录每一轮对 `clipboard-inspector` 做重大改造时的设计说明与决策依据。新记录按"年-月-主题"命名，旧记录保持不动；目的是：

- 把每次"为什么这么做"写下来，便于未来回看
- 减少 PR description 被 GitHub 折叠后追溯成本
- 给下一个贡献者一条清晰的演进轨迹

## 时间线

| 日期    | 主题                                                                  | 文档                                                                 | 对应 PR     |
| ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------- |
| 2026-04 | `src/` 目录化 + Markdown / ZIP 导出                                   | [refactor-2026-04.md](./refactor-2026-04.md)                         | #1          |
| 2026-04 | TypeScript 一步到位严格化迁移                                         | [typescript-migration-2026-04.md](./typescript-migration-2026-04.md) | #2          |
| 2026-04 | 工具链 & CI 建设：ESLint 9 / Vitest / GitHub Actions / Pages 自动部署 | _(见 #3 commit message)_                                             | #3          |
| 2026-04 | 下载按钮风格与项目 Neo-Brutalism 基线统一                             | _(见 #4 commit message)_                                             | #4          |
| 2026-04 | 工程改进一揽子（Pages→Actions 部署、依赖升级、lint-staged 等 6 类）   | [improvement-backlog-2026-04.md](./improvement-backlog-2026-04.md)   | _(current)_ |

## 约定

- **命名**: `<主题>-<YYYY-MM>.md`；若同月多份，可加 `-NN` 后缀
- **风格**: 中文正文；技术术语保留原文；表格呈现决策矩阵（方案 × 利弊）
- **不做的事**:
    - 不复制 PR 的 diff（PR / commit 自带）
    - 不做状态记录（这不是 CHANGELOG）
    - 不删除旧文档（即便决策被推翻，也保留作为历史）
