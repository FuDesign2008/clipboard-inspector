# Clipboard Inspector — Product Hunt Launch Kit

> 发布日期待定。本文档是可执行的行动清单，不是参考手册。

---

## 一、Product Hunt 发布内容

### Tagline（60 字符以内）

```
Inspect what's really on your clipboard
```

### Description（260 字符以内）

```
Clipboard Inspector is a free, open-source web tool that reveals every MIME type hiding in your clipboard — paste, drag-and-drop, or Async Clipboard API. Preview text, images, and files, then export to Markdown or ZIP. Built for developers, QA engineers, and security researchers.
```

### Maker Comment（首条评论）

大家好，我是这个项目的维护者。

Clipboard Inspector 最初由 @evercoder 开发，我在使用中发现它对调试剪贴板相关问题非常有用，但缺少导出功能。于是我 fork 了项目，加入了 Markdown 导出（方便粘贴到 AI 对话中分析）和 ZIP 导出（方便归档和提交 bug report），同时将整个代码库迁移到 strict TypeScript，搭建了 CI/CD 自动部署。

这个工具解决的问题很小众但很实际：当你从 Word、Excel、浏览器或设计工具里复制内容时，剪贴板里到底藏了多少种 MIME 类型？每种类型的内容是什么？这些信息对调试 paste 相关的 bug 至关重要，但浏览器原生没有直观的查看方式。

项目完全免费、开源，不需要注册，打开浏览器就能用。接下来计划支持剪贴板历史记录对比、更多文件格式的预览。欢迎在 GitHub 提 issue 和 PR。

GitHub: https://github.com/FuDesign2008/clipboard-inspector
在线使用: https://fudesign2008.github.io/clipboard-inspector/

---

## 二、发布日时间线

所有时间以 PST 为准。Product Hunt 的一个 "day" 从 00:01 PST 开始，到 23:59 PST 结束。发布时间越早，积累 upvote 的时间窗口越长。

| 时间 | 动作 |
|------|------|
| 00:01 PST | 提交到 Product Hunt，确认 tagline、description、gallery 图片无误 |
| 00:30 PST | 发布 Maker Comment |
| 00:45 PST | 在 Twitter/X 发 thread，LinkedIn 发帖，Reddit 发帖（r/webdev, r/javascript） |
| 01:00 PST | 开始逐条回复 Product Hunt 上的评论（评论互动对排名影响很大） |
| 01:00 ~ 05:00 PST | 每 30 分钟检查一次新评论并回复 |
| 08:00 PST | 发 Hacker News "Show HN" 帖子 |
| 12:00 PST | 发一条 Twitter/X 更新，附当前排名截图 |
| 18:00 PST | 第二轮集中回复评论 |
| 22:00 PST | 发布感谢帖："感谢支持，以下是今天的数据..." |
| 23:59 PST | 发布日结束 |

---

## 三、视觉素材清单

### Gallery 图片

Product Hunt 要求至少一张 gallery 图片，建议准备 3~5 张。规格要求：

- 格式：PNG 或 JPG
- 尺寸：2400x1600 或 1600x1200
- 比例：3:2

建议的图片内容：

1. **首图（必须）**：工具界面全屏截图，配合大字标题 "See what's hiding in your clipboard"
2. **功能对比图**：左侧显示普通粘贴结果（只有纯文本），右侧显示 Clipboard Inspector 解析出的多种 MIME 类型
3. **导出功能展示**：分别展示 Markdown 导出结果和 ZIP 文件结构
4. **使用场景**：从 Word/Excel/浏览器复制后，Inspector 中显示的数据对比

### GIF 演示

建议制作 1~2 个 GIF，时长控制在 10~15 秒：

- **GIF 1**：从 Word 复制一段带格式文本 -> 粘贴到 Clipboard Inspector -> 展示多种 MIME 类型 -> 点击 Markdown 导出
- **GIF 2**：拖拽一个图片文件到 Inspector -> 展示文件信息和预览 -> 点击 ZIP 导出

文件大小控制在 5MB 以内，分辨率 1200x800。

### Logo

使用项目现有的 favicon 或 logo，确保在 Product Hunt 的小尺寸缩略图（120x120）下清晰可辨。背景用纯色，不要透明底。

---

## 四、评论回复模板

### 收到好评

```
Thanks! Glad you find it useful. Curious — what's the most surprising MIME type 
you've discovered on your clipboard?
```

### 收到功能建议

```
Good idea. I've noted it down. If you're interested, contributions are welcome 
on GitHub — the codebase is TypeScript + React, kept intentionally small.
```

### 收到技术问题

直接回答，不要绕弯子。如果问题涉及浏览器 API 细节，附上 MDN 链接。示例：

```
Great question. The Async Clipboard API requires a secure context (HTTPS) and 
user activation. You can read more here: 
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
```

### 收到批评或负面反馈

```
Fair point. [承认具体问题]. I'm actively working on [改进方向]. 
If you have specific suggestions, feel free to open an issue on GitHub.
```

不要辩解，不要过度解释。承认问题，说明计划，邀请参与。

### 收到与其他工具的比较

```
[工具名] is great for [它的优势]. Clipboard Inspector focuses on [我们的差异点] 
— specifically the ability to export clipboard data as Markdown or ZIP for 
further analysis and bug reporting.
```

---

## 五、分发渠道

### Twitter/X Thread

```
1/ I just launched Clipboard Inspector on @ProductHunt!

A free, open-source tool that shows you every MIME type hiding in your clipboard.

Paste anything — text, images, files — and see exactly what data your browser receives.

[截图]

2/ Why I built this:

When you copy from Word, Excel, or a browser, your clipboard carries way more 
than just text. There's HTML, RTF, images, custom MIME types...

But browsers don't show you this. Clipboard Inspector does.

[GIF 演示]

3/ Two export modes:

- Markdown: one .md file, ready to paste into an AI chat for diagnosis
- ZIP: structured archive with metadata, useful for bug reports

4/ Tech details:

- Strict TypeScript, React 18, esbuild
- CI/CD auto-deploy to GitHub Pages
- Fully open source: github.com/FuDesign2008/clipboard-inspector

5/ Try it free (no signup):
https://fudesign2008.github.io/clipboard-inspector/

If you work with clipboard/paste/drag-drop features, this saves hours of debugging.

Would love your feedback!
```

### Reddit

适合发布的 subreddits：

| Subreddit | 帖子标题建议 | 注意事项 |
|-----------|-------------|---------|
| r/webdev | "I built a tool to inspect every MIME type in your clipboard" | 不要直接推销，分享解决问题的思路 |
| r/javascript | "Open-source clipboard inspector with Markdown/ZIP export" | 附上技术实现细节 |
| r/buildinpublic | "Launched my open-source clipboard tool on Product Hunt today" | 分享开发过程和数据 |

Reddit 帖子不要用营销语气。以 "I made..." 开头，分享技术细节和为什么做这个工具。每个 subreddit 的帖子和回复要有所不同，不要复制粘贴。

### Hacker News

标题格式：`Show HN: Clipboard Inspector – See every MIME type in your clipboard`

HN 用户看重技术深度。帖子正文不要超过 2~3 句，把关键信息放在首条评论：

```
I forked and enhanced an open-source clipboard inspection tool. Key additions:
- Markdown export (for pasting into AI chats)
- ZIP export (for archiving and bug reports)
- Strict TypeScript, CI/CD auto-deploy

The tool runs entirely in the browser, no server-side processing. 
Useful if you debug paste/drag-drop features or investigate clipboard-related security issues.

Source: https://github.com/FuDesign2008/clipboard-inspector
Demo: https://fudesign2008.github.io/clipboard-inspector/
```

### 其他渠道

- **Indie Hackers**: 发帖分享从 fork 到增强的完整过程
- **LinkedIn**: 如果你的网络中有前端工程师，发一篇关于 "调试剪贴板问题" 的技术短文
- **Dev.to / Hashnode**: 交叉发布技术博文

---

## 六、发布日 Checklist

### 发布前一周

- [ ] 准备好 3~5 张 gallery 图片（PNG, 2400x1600）
- [ ] 制作 1~2 个 GIF 演示
- [ ] 写好 Product Hunt description 和 Maker Comment
- [ ] 写好 Twitter/X thread 草稿
- [ ] 写好 Reddit 帖子（每个 subreddit 一版）
- [ ] 写好 Hacker News "Show HN" 帖子和首条评论
- [ ] 确认网站在线且功能正常（在 Chrome, Firefox, Safari 上测试）
- [ ] 通知 5~10 个朋友/同事，请他们在发布日支持和评论
- [ ] 准备 GitHub Release（如果有的话）

### 发布当天

- [ ] 00:01 PST 提交到 Product Hunt
- [ ] 发布 Maker Comment
- [ ] 在所有渠道同步发布（Twitter/X, Reddit, HN）
- [ ] 前 4 小时每 30 分钟检查并回复 Product Hunt 评论
- [ ] 12:00 PST 发中期更新推文
- [ ] 持续回复评论到当天结束
- [ ] 22:00 PST 发感谢帖

### 发布后一周

- [ ] 汇总 Product Hunt 数据（upvotes, comments, 排名）
- [ ] 汇总 GitHub 数据（stars 新增, traffic）
- [ ] 汇总网站访问数据
- [ ] 回复所有未回复的评论
- [ ] 根据反馈更新 roadmap
- [ ] 在 Twitter/X 发 "1 week after launch" 总结帖

---

## 七、目标与指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| Product Hunt upvotes | 50 | 首次发布，现实目标 |
| Product Hunt comments | 20 | 评论质量比数量重要 |
| Product Hunt 日排名 | Top 20 | 当天产品数量通常 30~50 个 |
| GitHub stars 增量 | +30 | 发布后 7 天累计 |
| 网站访问量 | 1000 | 发布后 7 天累计 |
| HN points | 30+ | 能出现在第二页 |

---

## 八、风险与应对

### 没人投票

提前联系 5~10 个人，确保他们在发布当天能 early upvote 和留评论。这不是作弊，是正常的发布策略。Product Hunt 的算法重视 early momentum，前几小时的互动量决定了一天的排名走势。

### 收到负面评论

不要慌。认真读评论，区分合理的批评和无意义的喷子。对合理的批评直接承认不足，说明改进计划。一条被认真回复的差评，比十条 "Cool product!" 更有说服力。

### 网站挂了或功能异常

发布前在 Chrome、Firefox、Safari 上完整测试一遍。准备好回滚方案：如果当天出了问题，可以在 Product Hunt 评论中说明情况，附上 GitHub repo 链接作为备用。由于是静态站，挂掉的概率很低，但要确认 GitHub Pages 配额没有超限。

### 被质疑 "这只是个 fork"

实话实说。明确说明上游项目的贡献，同时讲清楚增强的部分（Markdown/ZIP 导出、TypeScript 迁移、CI/CD）。开源项目 fork 后增强是完全正常的做法。Maker Comment 中已经包含了这个说明。

### 与上游项目的关系

在评论中主动提及并感谢原作者 @evercoder。如果可能，提前通知原作者，甚至邀请他们作为 collaborator。这种透明度会赢得社区的尊重。
