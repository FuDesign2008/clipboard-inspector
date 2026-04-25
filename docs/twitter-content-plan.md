# Clipboard Inspector Twitter/X Build in Public Content Plan

## Overview

30-day content calendar for promoting Clipboard Inspector on Twitter/X. Target audience: frontend developers, tool builders, indie hackers. Language: Chinese with English hashtags. Tone: technical, honest, no corporate jargon.

## Links

- GitHub: https://github.com/FuDesign2008/clipboard-inspector
- Live tool: https://fudesign2008.github.io/clipboard-inspector/

---

## Week 1: Introduction and Setup

**Day 1** - Launch announcement

> 今天发布 Clipboard Inspector, 一个帮你检查剪贴板里到底有什么数据的开发者工具。粘贴或拖拽任何内容,工具会把所有 MIME 类型、文本、图片、二进制数据全部展示出来。开源免费,MIT 协议。
>
> 试用: https://fudesign2008.github.io/clipboard-inspector/
> 源码: https://github.com/FuDesign2008/clipboard-inspector
>
> #buildinpublic #devtools #opensource

**Day 2** - Clipboard data format surprise

> 一个有趣的事实: 你从 Word 里复制一段文字,剪贴板里不只有纯文本。实际包含的数据有 text/plain, text/html, text/rtf, 甚至还有 image/png (截图预览)。大多数开发者根本不知道这些。
>
> 用 Clipboard Inspector 粘贴一下就能看到全部内容。
>
> #javascript #clipboard #devtools

**Day 3** - Why I built this

> 为什么做这个工具? 因为调试剪贴板相关 bug 太痛苦了。console.log 看到的只是 [object DataTransfer],你不知道浏览器到底拿到了什么 MIME 类型,哪些数据是空的,哪些有内容。所以做了一个直接把所有数据可视化的页面,拖拽或粘贴就能用。
>
> #buildinpublic #indiehackers

**Day 4** - Screenshot post

> [附截图: 工具界面展示从 Word 复制的内容,左侧列出 MIME 类型,右侧展示具体数据]
>
> 这是从 VS Code 复制一段代码后粘贴到 Clipboard Inspector 的结果。你能看到 text/plain, text/html, 还有 VS Code 自定义的 application/vnd.code.copy-metadata。
>
> 每个开发者浏览器里都应该收藏一个这样的工具。
>
> #devtools #webdev

**Day 5** - Educational fact

> 你的剪贴板可以同时包含这些格式: 纯文本, HTML, 图片, 文件列表, 自定义 MIME 数据。浏览器 paste 事件拿到的 DataTransfer 对象里有全部信息,但大多数教程只教你读 text/plain。
>
> Clipboard Inspector 帮你看到全貌。
>
> #javascript #webdev #clipboard

**Day 6** - User insight

> 之前把 Clipboard Inspector 分享给几个朋友,有人说直接用来检查用户的 bug report 了。让用户粘贴到这个页面,导出 Markdown 或 ZIP,发给开发者排查。比截图清楚得多。
>
> 如果你也有剪贴板相关的需求,试试看: https://fudesign2008.github.io/clipboard-inspector/
>
> #buildinpublic #devtools

**Day 7** - Week 1 summary

> 第一周总结:
> 发布了 Clipboard Inspector, 一个剪贴板数据检查工具。GitHub 开源,在线即用。这周主要在宣传核心功能: 查看 MIME 类型, 导出 Markdown/ZIP。
>
> 目前数据: X 个 star, Y 次页面访问。(下周更新)
>
> 接下来一周会分享更多 Clipboard API 的技术细节。有什么想了解的? 评论区告诉我。
>
> #buildinpublic #indiehackers

---

## Week 2: Educational Content

**Day 8** - Clipboard API security

> Clipboard API 安全限制,很多开发者搞不清楚:
>
> 1. 异步 Clipboard API (navigator.clipboard.read) 需要用户授权,而且只在 HTTPS 页面可用
> 2. paste 事件里的 DataTransfer 是只读的,网站不能偷偷读你的剪贴板
> 3. 拖拽 (drop) 事件和粘贴类似,数据只能由用户主动触发
>
> 所以放心用 Clipboard Inspector, 它不会在你不知情的时候读取任何东西。
>
> #javascript #webdev #security

**Day 9** - Code snippet

> 用 JavaScript 读取剪贴板数据,最简单的方式:
>
> document.addEventListener('paste', (e) => {
>   const dt = e.clipboardData;
>   for (const type of dt.types) {
>     console.log(type, dt.getData(type));
>   }
> });
>
> 但这只看得到文本类型。图片和文件需要用 dt.files 或 dt.items[i].getAsString()。Clipboard Inspector 帮你处理了所有这些边界情况。
>
> #javascript #coding

**Day 10** - Privacy angle

> 剪贴板里的隐私风险: 如果你从邮件、聊天记录、文档里复制内容,剪贴板可能同时包含 HTML 格式、原文链接、作者信息、修改历史等元数据。粘贴到不支持富文本的地方没问题,但粘贴到支持多种格式的应用,这些隐藏数据就可能泄露。
>
> 用 Clipboard Inspector 检查一下你刚复制的内容,你会惊讶的。
>
> #privacy #webdev

**Day 11** - Browser compatibility

> Clipboard API 浏览器兼容性速查:
>
> paste 事件 DataTransfer: 全浏览器支持
> navigator.clipboard.read(): Chrome, Edge, Safari 支持, Firefox 默认关闭
> ClipboardItem / clipboard.write(): Chrome, Edge, Safari 支持
> drag-and-drop DataTransfer: 全浏览器支持
>
> Clipboard Inspector 优先用 paste/drop 事件,兼容性最好。Async Clipboard API 作为补充。
>
> #javascript #webdev #compatibility

**Day 12** - How I use it for debugging

> 我自己用 Clipboard Inspector 的场景:
>
> 1. 调试富文本编辑器的粘贴行为,看看到底传入了什么格式
> 2. 检查拖拽上传的文件类型是否正确
> 3. 排查跨平台剪贴板数据不一致的问题 (Windows vs Mac)
> 4. 导出 Markdown 直接丢给 AI 分析
>
> 你的场景是什么?
>
> #devtools #buildinpublic

**Day 13** - Blog post share

> 写了一篇关于 Clipboard Inspector 的技术博客,讲了项目架构,TypeScript 严格模式的配置,以及为什么选择 esbuild 而不是 Vite。
>
> [链接]
>
> 如果你也在做开源小工具,这些技术选型的思路可能对你有用。
>
> #buildinpublic #opensource #typescript

**Day 14** - Community question

> 问个问题: 你在剪贴板里发现过最奇怪的数据格式是什么?
>
> 我自己的发现: Chrome 复制标签页会得到 text/plain (URL), text/html (带链接的 HTML), 还有 application/vnd.chromium.url-adaptive-paste。最后一个是什么鬼?
>
> 评论区分享你的发现。
>
> #javascript #devtools

---

## Week 3: Growth and Engagement

**Day 15** - Transparent stats

> 两周数据更新:
>
> GitHub stars: X
> 页面访问: Y
> 主要流量来源: Z
>
> 数字不大,但这是一个很垂直的工具,本来受众就小。关键是有人真的在用,还提了 feature request。这比 star 数量重要。
>
> #buildinpublic #indiehackers

**Day 16** - Feature highlight: Markdown export

> Clipboard Inspector 的 Markdown 导出功能:
>
> 粘贴内容后点击 "Download as Markdown",会生成一个结构化的 .md 文件。包含时间戳,所有 MIME 类型,文本内容用代码块展示,二进制数据用描述表格。直接粘贴到 ChatGPT 或 Claude 的对话框里,让 AI 帮你分析剪贴板数据。
>
> 试试看: https://fudesign2008.github.io/clipboard-inspector/
>
> #devtools #buildinpublic

**Day 17** - Social proof

> 开发者怎么说:
>
> [用户A]: "终于有个工具能直接看到剪贴板的原始数据了,调试粘贴功能省了很多时间"
> [用户B]: "Markdown 导出直接喂给 AI 这个设计太聪明了"
>
> 如果你也觉得有用,给个 star: https://github.com/FuDesign2008/clipboard-inspector
>
> #buildinpublic #devtools

**Day 18** - Feature request poll

> 下一步做什么? 投个票:
>
> 1. 剪贴板历史记录 (用 IndexedDB 存储)
> 2. 对比两次粘贴的差异
> 3. 自定义 MIME 类型过滤
> 4. 浏览器扩展版本
>
> 评论区告诉我选哪个,或者提你自己的需求。
>
> #buildinpublic #devtools #indiehackers

**Day 19** - Open source contribution

> 今天处理了一个社区提交的 issue: [描述]。从 issue 到 PR 到合并花了 X 小时。开源项目的维护不只是写代码,沟通和文档同样花时间。
>
> 欢迎给 Clipboard Inspector 提 PR: https://github.com/FuDesign2008/clipboard-inspector
>
> #opensource #buildinpublic

**Day 20** - Honest reflection

> Build in public 说实话的部分:
>
> 好的方面: 工具有人用,收到正面反馈,技术上有挑战也有成长。
>
> 难的部分: 推广很难,开发者工具市场小,内容创作每周要花 3-4 小时,不确定能不能持续。
>
> 但还是会继续做。如果你也在做独立项目,你的感受是什么?
>
> #buildinpublic #indiehackers

**Day 21** - Blog thread

> 开一个 thread, 讲讲 Clipboard Inspector 从 fork 到发布的过程:
>
> 1/ 起因是 upstream 项目停止维护了,但我还需要这个工具
> 2/ 加了 TypeScript 严格模式,重写了构建流程
> 3/ 新增 Markdown 和 ZIP 导出
> 4/ 配了 GitHub Actions CI/CD,推送到 main 自动部署
>
> 详细版博客: [链接]
>
> #buildinpublic #opensource

---

## Week 4: Momentum and Conversion

**Day 22** - Month 1 recap

> 一个月了,总结一下:
>
> 做了什么: 发布工具,写了技术博客,坚持每天发推
> 数据: X stars, Y 月访问, Z 个 feature request
> 学到了什么: 开发者社区对实用工具的接受度比想象中高;内容营销需要耐心;透明比包装更有用
>
> 下个月计划: [预告]
>
> #buildinpublic #indiehackers

**Day 23** - Roadmap teaser

> 接下来想做的功能:
>
> 1. 剪贴板对比模式: 两次粘贴并排看差异
> 2. 自定义解析规则: 用户定义如何处理特定 MIME 类型
> 3. PWA 离线支持
> 4. 可能的浏览器扩展版本
>
> 你最想要哪个? 优先做票数最高的。
>
> #buildinpublic #devtools

**Day 24** - Use case story

> 一个真实的使用场景:
>
> 用户反馈他们的富文本编辑器在 Mac Safari 上粘贴格式错误,Windows Chrome 正常。用 Clipboard Inspector 分别在两个平台上粘贴同一段内容,导出 Markdown 对比,发现 Safari 的 text/html 里多了额外的 span 标签。定位问题只花了 10 分钟。
>
> 这就是做这个工具的意义。
>
> #devtools #buildinpublic

**Day 25** - Friendly comparison

> 剪贴板检查工具对比:
>
> Clipboard Inspector: 浏览器直接用,支持拖拽和粘贴,导出 Markdown/ZIP,开源免费
>
> 其他方案: 浏览器 DevTools (需要看 console,不直观), 专门的桌面应用 (需要安装)
>
> 不踩别人,各有所长。如果你只是想快速看看剪贴板里有什么,浏览器打开一个页面最方便。
>
> #devtools #javascript

**Day 26** - Technical deep dive thread

> Thread: Clipboard Inspector 技术实现细节
>
> 1/ 数据提取: paste 事件的 DataTransfer vs Async Clipboard API 的 ClipboardItem,两种数据结构完全不同,需要统一抽象
>
> 2/ Markdown 生成: 处理代码块嵌套的 fence 扩展问题 (反引号数量要递增),表格内管道符转义
>
> 3/ ZIP 打包: 用 JSZip 在浏览器端生成,大文件的流式处理避免内存溢出
>
> 4/ TypeScript 严格模式: exactOptionalPropertyTypes 和 noUncheckedIndexedAccess 真的能提前发现 bug
>
> #javascript #typescript #buildinpublic

**Day 27** - Star goal

> 目前 X 个 GitHub star。目标是 100 个。
>
> 如果你在调试剪贴板相关的问题时用过这个工具,或者觉得它有用,帮忙点个 star。对独立开发者来说,这是最好的鼓励。
>
> https://github.com/FuDesign2008/clipboard-inspector
>
> 也欢迎转发这条推文,让更多开发者看到。
>
> #buildinpublic #opensource

**Day 28** - Thank you and preview

> 感谢所有关注、star、提 issue、转发的人。一个月前这个项目还是个没人知道的 fork,现在有一小群开发者在用。
>
> 下个月计划: 继续分享技术内容,开始做社区投票选出的新功能,可能写几篇深度教程。
>
> 有问题随时评论区或 GitHub Discussions 见。
>
> #buildinpublic #indiehackers #devtools

---

## Hashtag Strategy

Core hashtags, use 3-5 per tweet:

- `#buildinpublic` - build in public 社区,曝光度最高
- `#indiehackers` - 独立开发者社区
- `#devtools` - 开发者工具
- `#javascript` - 技术受众
- `#clipboard` - 精准但受众小,偶尔用
- `#opensource` - 开源相关推文必加
- `#typescript` - 技术推文用
- `#webdev` - 前端开发者受众

Rotation: 不要每条推文都用同样的组合。技术内容加 #javascript #typescript,项目进展加 #buildinpublic #indiehackers,开源相关加 #opensource。

---

## Best Posting Times

面向开发者受众 (考虑时区分布: 中国 + 北美 + 欧洲):

- 工作日早上 9:00-10:00 (北京时间) - 中国开发者开始工作
- 工作日晚上 20:00-21:00 (北京时间) - 北美开发者开始工作
- 周末上午 10:00-11:00 (北京时间) - 休闲浏览时间

建议: 固定一个时间,培养粉丝的阅读习惯。如果主要面向中文开发者,优先北京时间的早上和晚上。

---

## Engagement Rules

1. 每条评论都回复,哪怕只是一个 emoji 反应
2. 多问问题,少做陈述。推文结尾用问句比陈述句互动率高
3. 数字要真实,不要夸大。10 个 star 就写 10 个,别写"增长迅速"
4. 转发和评论别人的技术内容,建立关系,不要只发自己的
5. 遇到批评直接回应,不要删评论
6. 每天花 15 分钟互动: 回复别人的推文,参与技术讨论

---

## Content Formats

- **纯文字推文**: 适合分享数据、经验、反思。占 40%
- **截图推文**: 工具界面、代码片段、浏览器兼容性图表。占 30%
- **投票**: 功能优先级、使用场景调查。占 10%
- **Thread**: 技术深度解析、项目回顾。每周 1 个,占 20%
- **转推 + 评论**: 别人的剪贴板/前端相关推文,加上自己的见解

---

## Tone Guidelines

- 用"我"不用"我们",这是个人项目
- 数字直接说,不包装
- 技术细节讲清楚,不要概括成一句话
- 承认问题和不完美,不要假装一切顺利
- 说人话,不说"赋能"、"闭环"、"抓手"
- 短句为主,长句拆成多条
