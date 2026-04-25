# C. 术语表

本书涉及大量专业术语。下表按字母顺序列出所有关键术语，附有英文原文和简明定义。

| 术语 | 英文 | 定义 |
|------|------|------|
| ARPU | Average Revenue Per User | 每用户平均收入。总付费收入除以付费用户数，衡量单个用户创造的收入。 |
| ARR | Annual Recurring Revenue | 年度经常性收入。按年计算的订阅收入总额，是 SaaS 企业的核心财务指标。 |
| Async Clipboard API | Async Clipboard API | 现代异步剪贴板读写 API。基于 Promise 设计，支持读写文本和富媒体数据，是 W3C Clipboard API 规范的一部分。 |
| BSL | Business Source License | 商业源码许可证。允许查看和非商业使用源码，商业使用需要购买许可。MariaDB、Chronograf 等项目采用此协议。 |
| clipboardchange | clipboardchange event | 剪贴板内容变化时触发的事件。Chrome 142+ 支持，是持续监听剪贴板变化的基础。 |
| ClipboardItem | ClipboardItem | Async Clipboard API 中表示剪贴板内容项的接口。每个 ClipboardItem 包含一个或多个 MIME 类型的数据。 |
| CAC | Customer Acquisition Cost | 客户获取成本。获取一个付费用户的平均营销和销售支出。 |
| DataTransfer | DataTransfer API | 浏览器中用于拖放（drag-and-drop）和粘贴（paste）事件的数据传输接口。携带 MIME 类型列表和对应数据。 |
| JWT | JSON Web Token | JSON Web 令牌。一种紧凑的、URL 安全的身份验证令牌格式，广泛用于 SSO 和 API 认证。 |
| LTV | Life Time Value | 客户生命周期价值。一个付费用户在整个订阅期间贡献的总收入。 |
| MCP | Model Context Protocol | 模型上下文协议。Anthropic 推出的开放协议，用于 AI 工具（如 Claude Code、Cursor）与外部数据源的集成。 |
| MIME 类型 | MIME Type | 多用途互联网邮件扩展类型（Multipurpose Internet Mail Extensions）。标识数据格式的标准，如 text/plain、image/png、text/html。在剪贴板上下文中用于标识粘贴数据的格式。 |
| MRR | Monthly Recurring Revenue | 月度经常性收入。按月计算的订阅收入总额。 |
| NDR | Net Dollar Retention | 净金额保留率。衡量现有客户在续费、升级、降级后的收入保留比例。NDR > 100% 意味着现有客户的收入在增长。 |
| OCR | Optical Character Recognition | 光学字符识别。将图像中的文字转换为可编辑文本的技术。在剪贴板工具中用于提取图片中的文字内容。 |
| PLG | Product-Led Growth | 产品驱动增长。以产品本身作为获客、转化和扩展的主要驱动力，而非依赖销售团队。 |
| RICE | RICE Scoring | 优先级评分法。计算公式：Reach x Impact x Confidence / Effort。用于量化功能优先级。 |
| RPM | Revenue Per Mille | 每千次页面展示的广告收入。衡量广告变现效率的指标。 |
| SAM | Serviceable Addressable Market | 可服务可寻址市场。企业当前能力可以覆盖的市场规模，是 TAM 的子集。 |
| SLA | Service Level Agreement | 服务等级协议。服务提供商对可用性、响应时间等指标的正式承诺。 |
| SLO | Service Level Objective | 服务等级目标。SLA 中定义的具体量化目标，如 99.9% 可用性。 |
| SOM | Serviceable Obtainable Market | 可获得可寻址市场。企业在竞争环境中实际可以获取的市场份额，是 SAM 的子集。 |
| SSO | Single Sign-On | 单点登录。用户使用一组凭据即可访问多个应用系统的认证机制。 |
| TAM | Total Addressable Market | 总可寻址市场。产品或服务理论上可以覆盖的全部市场规模。 |
| Tauri | Tauri | 基于 Rust 的跨平台桌面应用框架。使用 Web 技术（HTML/CSS/JS）构建前端，Rust 处理后端逻辑，生成体积小、性能高的原生应用。 |
| Transformers.js | Transformers.js | 浏览器端机器学习推理库。基于 ONNX Runtime，支持在浏览器中运行文本分类、命名实体识别、图像识别等模型，无需服务器端支持。 |
| WAU | Weekly Active Users | 周活跃用户。一周内至少使用一次产品的独立用户数。 |
| WebGPU | WebGPU | Web 端 GPU 计算 API。是 WebGL 的后继者，支持通用 GPU 计算和渲染，可用于加速浏览器端 ML 推理。 |
