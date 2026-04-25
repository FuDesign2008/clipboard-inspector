# Twitter/X 现成内容 — 可直接复制发布

## 线程1：工具介绍（发布日首选）

**Tweet 1/5**
刚刚发布了 Clipboard Inspector — 一个帮你查看剪贴板里到底有什么的开发者工具。

不是管理器，是检查器。你粘贴的内容可能包含 HTML、图片、文件，而不仅仅是纯文本。

https://fudesign2008.github.io/clipboard-inspector/

**Tweet 2/5**
常见场景：从 Word 复制一段文字到 Markdown 编辑器。

你以为复制的是纯文本？实际上剪贴板里有 text/html、text/rtf、text/plain 三种格式。

Clipboard Inspector 让你看到全部。

**Tweet 3/5**
两个导出功能：
- Markdown：生成结构化报告，直接贴给 AI 助手诊断
- ZIP：完整存档所有剪贴板数据，方便 bug 报告

都是客户端处理，数据不会离开你的浏览器。

**Tweet 4/5**
开源，MIT 协议，零成本使用。

GitHub: https://github.com/FuDesign2008/clipboard-inspector

欢迎试用、反馈、提 PR。

**Tweet 5/5**
下一步计划：
- 浏览器扩展（不用打开网页就能检查）
- 更多导出格式（JSON、XML）
- 剪贴板历史记录

想要哪个功能？评论告诉我。

---

## 线程2：剪贴板安全（教育类）

**Tweet 1/4**
你知道吗？网站可以通过 JavaScript 读取你的剪贴板。

不是钓鱼，不是恶意软件。一个普通的网页，在用户按下 Ctrl+V 时，就能获取剪贴板内容。

**Tweet 2/4**
浏览器剪贴板 API 的能力：
- readText() — 读取纯文本
- read() — 读取所有格式（图片、HTML、文件）
- 需要用户交互触发（paste 事件或手动调用）

**Tweet 3/4**
这意味着什么？

如果你刚复制了密码、API key、或敏感链接，然后打开一个不可信的网站并按下粘贴...

那个网站可能知道你复制了什么。

**Tweet 4/4**
如何保护自己：
1. 粘贴前确认目标网站可信
2. 使用密码管理器的自动填充（不经过剪贴板）
3. 用 Clipboard Inspector 检查网站请求了什么权限

工具：https://fudesign2008.github.io/clipboard-inspector/

---

## 线程3：独立开发者故事（Build in Public）

**Tweet 1/4**
作为一个独立开发者，我做了一个没人要求我做的工具。

不是因为市场调查，是因为我自己每天都在遇到这个问题。

**Tweet 2/4**
问题：复制粘贴时，格式总是不对。

从 Word 到 Markdown，从网页到编辑器，从 Excel 到表格...

每次都要手动清理格式，浪费时间。

**Tweet 3/4**
现有工具的问题：
- 剪贴板管理器：帮我保存历史，但不告诉我数据格式
- 调试工具：能看 HTTP 请求，但看不了剪贴板

所以我做了一个专门"检查"剪贴板的工具。

**Tweet 4/4**
3 周开发，零预算，一个人。

现在每天有几十个开发者在使用。

这就是独立开发的意义：解决自己的问题，顺便帮助别人。

https://github.com/FuDesign2008/clipboard-inspector

---

## 线程4：技术教程（Clipboard API）

**Tweet 1/5**
现代浏览器 Clipboard API 速查：

navigator.clipboard.readText()
- 返回 Promise<string>
- 读取纯文本
- 需要用户授权

**Tweet 2/5**
navigator.clipboard.read()
- 返回 Promise<ClipboardItem[]>
- 读取所有格式
- 可以拿到图片 Blob

**Tweet 3/5**
navigator.clipboard.writeText(string)
- 写入纯文本
- 不需要权限
- 最安全的写入方式

**Tweet 4/5**
navigator.clipboard.write(ClipboardItem[])
- 写入多种格式
- 可以同时写入 text/plain 和 text/html
- 复制时保留格式

**Tweet 5/5**
兼容性：
- Chrome 66+ (readText/writeText)
- Chrome 104+ (read/write 全格式)
- Firefox 125+ (部分支持)
- Safari 16.4+ (部分支持)

完整指南：https://fudesign2008.github.io/clipboard-inspector/blog/03-clipboard-api-guide.md

---

## 线程5：对比类（竞争分析）

**Tweet 1/4**
开发者剪贴板工具对比：

Clipboard Inspector vs Maccy vs CopyQ

**Tweet 2/4**
Clipboard Inspector
- Web 工具，无需安装
- 专注"检查"而非"管理"
- 导出 Markdown/ZIP
- 免费开源

**Tweet 3/4**
Maccy
- macOS 原生应用
- 剪贴板历史管理
- 快捷键呼出
- 开源免费

**Tweet 4/4**
CopyQ
- 跨平台
- 脚本扩展
- 标签和搜索
- 开源免费

选择建议：
- 要检查数据格式 → Clipboard Inspector
- 要管理历史 → Maccy/CopyQ
- 都要？可以一起用

---

## 单条推文（日常发布）

**Tweet A**
剪贴板里可能同时存在：
- text/plain
- text/html
- text/rtf
- image/png
- Files

但你粘贴时，应用通常只读取其中一种。

知道有哪些格式，才能理解为什么粘贴结果不一致。

**Tweet B**
调试 paste 问题的最佳实践：
1. 用 Clipboard Inspector 查看原始数据
2. 确认应用读取了哪种 MIME type
3. 对比期望格式和实际格式
4. 定位问题源头

比 console.log 更高效。

**Tweet C**
Clipboard Inspector 的 Markdown 导出功能，设计用来直接贴给 ChatGPT/Claude：

"帮我看看这个数据格式有什么问题？"

粘贴 → 得到分析 → 修复

减少来回沟通成本。

**Tweet D**
本周更新：
- 新着陆页上线
- Privacy Policy / ToS 添加
- GitHub Discussions 启用
- 7 篇博客文章发布

全部开源，全部免费。

https://github.com/FuDesign2008/clipboard-inspector

**Tweet E**
独立开发第 30 天数据：
- GitHub stars: [待填写]
- 网站访问: [待填写]
- 博客阅读: [待填写]

没有付费广告，全靠内容营销和口碑。

Build in public 是真的有用。

---

## 发布建议

**最佳发布时间（开发者受众）：**
- 工作日：上午 9-10 点，下午 2-3 点
- 周末：上午 10-11 点

**频率：**
- 线程内容：每周 1-2 条
- 单条推文：每天 1 条
- 回复互动：即时回复

**Hashtags：**
- #buildinpublic
- #indiehackers
- #devtools
- #javascript
- #webdev
- #clipboard
- #opensource

**互动策略：**
- 每条推文末尾提一个问题
- 回复每一条评论
- 引用转发用户的正面反馈
- 每周分享数据更新
