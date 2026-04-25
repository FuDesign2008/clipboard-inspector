# GitHub Discussions 启用指南

## 概述

GitHub Discussions 是免费的社区论坛功能，适合开发者工具的用户支持、功能请求和知识分享。

## 启用步骤

### 1. 开启 Discussions

1. 访问仓库主页：`https://github.com/FuDesign2008/clipboard-inspector`
2. 点击 Settings → General → Discussions
3. 勾选 "Enable discussions"
4. 选择一个 Discussion Category（选择 "Announcements" 或创建新分类）

### 2. 创建分类

建议创建以下分类：

| 分类 | 用途 | 颜色 |
|---|---|---|
| **功能请求** | 新功能建议和投票 | #a2eeef |
| **Bug 报告** | 问题报告和追踪 | #d73a4a |
| **使用帮助** | 如何使用工具 | #0e8a16 |
| **Show & Tell** | 用户分享使用场景 | #fbca04 |
| **开发讨论** | 技术实现细节 | #5319e7 |

### 3. 配置欢迎帖子

开启后，GitHub 会自动创建一个欢迎帖子。编辑它以包含：
- 项目简介
- 行为准则链接
- 如何提交 Bug 报告的模板
- 功能请求模板

### 4. 在 README 中添加链接

在 README.md 中添加讨论区入口：

```markdown
## 社区

- [GitHub Discussions](https://github.com/FuDesign2008/clipboard-inspector/discussions) — 提问、分享和讨论
```

### 5. 设置通知

1. 访问 Discussions 页面
2. 点击 "Watch" 按钮
3. 选择 "All Activity" 以接收所有讨论通知

## 与 Issue 的区别

| | GitHub Issues | GitHub Discussions |
|---|---|---|
| 用途 | Bug 追踪、任务管理 | 社区交流、Q&A |
| 关闭状态 | 有（resolved/closed） | 无（持续对话） |
| 投票 | 无 | 有（upvote/downvote） |
| 标记答案 | 无 | 有（Marked as answer） |

**建议分工**：
- Bug → Issues
- 功能请求 → Discussions（可投票）
- 使用问题 → Discussions（可标记答案）
- 技术讨论 → Discussions

## 成本

GitHub Discussions 对所有公共仓库**完全免费**。
