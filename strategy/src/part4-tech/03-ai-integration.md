# 4.3 AI/ML 集成机会

浏览器端的机器学习生态在 2026 年已经相当成熟。WebGPU 提供了接近原生的 GPU 计算能力，WebNN 让浏览器直接调用硬件 AI 加速单元，Transformers.js 把 Hugging Face 的模型生态搬到了前端。更重要的是，Chrome 开始内置 AI API，某些场景下甚至不需要下载模型。

这一章梳理浏览器端 ML 技术栈的现状，评估每个 AI 功能的可行性，给出优先级排序。

## 浏览器端 ML 技术栈（2026）

### WebGPU

WebGPU 是 WebGL 的继任者，但定位不仅仅是图形渲染。它的计算着色器（compute shader）能力使浏览器能够执行通用 GPU 计算，包括机器学习推理。

实际性能表现：在推理任务上，WebGPU 比 WASM 快 3 到 10 倍（取决于模型结构和 GPU 性能）。对于需要实时响应的剪贴板工具来说，这个性能差异意味着 OCR 和文本分类可以在用户感知的延迟内完成。

### WebNN

WebNN（Web Neural Network API）是专门为神经网络推理设计的浏览器 API。它不自己执行计算，而是将任务调度到最合适的硬件上：NPU（如果有）优先，然后是 GPU，最后回退到 CPU。

这意味着同一份代码在不同设备上会自动选择最优的执行路径。在搭载 NPU 的新款笔记本上，推理速度可以比纯 CPU 执行快 10 倍以上，同时功耗更低。

### Transformers.js

Transformers.js 是 Hugging Face 维护的浏览器端 ML 库。它提供了 100 多个预训练模型，覆盖嵌入、分类、OCR、语音转录等任务。模型会自动下载并缓存在浏览器中，后续使用不需要重复下载。

关键能力与 Clipboard Inspector 相关的：

- **文本嵌入**：将文本转为向量，用于语义搜索
- **文本分类**：自动判断文本类型（代码、自然语言、JSON 等）
- **OCR**：从图片中提取文字
- **零样本分类**：不需要训练数据即可分类

### 内置浏览器 AI API

Chrome/Edge 正在逐步内置 AI 功能，这些 API 不需要下载任何模型：

| API | 功能 | 状态 |
|-----|------|------|
| Summarizer API | 文本摘要 | Chrome 138+ |
| Writer API | 文本生成/改写 | 实验性 |
| Translator API | 翻译 | 实验性 |
| Language Detector API | 语言检测 | Chrome 138+ |

这些 API 的模型随浏览器分发，大小在几十到几百 MB 之间，但由浏览器管理下载和缓存，对开发者透明。对于 Clipboard Inspector 来说，Summarizer API 可以直接用于"摘要剪贴板内容"功能。

## 推荐 AI 功能矩阵

| 功能 | 技术 | 可行性 | 优先级 |
|------|------|--------|--------|
| OCR 图片文字提取 | Transformers.js (TrOCR) 或 Tesseract.js | 立即可做 | High |
| 文本分类（代码/URL/email/JSON） | 正则 + 轻量模型 | 立即可做 | High |
| 密钥/Token 检测 | 正则模式 | 立即可做，零 ML | Critical |
| 内容摘要 | 内置 Summarizer API / Transformers.js | Chrome-only 或重型下载 | Medium |
| 语义搜索剪贴板历史 | Transformers.js 嵌入 + 余弦相似度 | 可行，50-200MB 模型 | Medium |
| 图片内容描述 | Transformers.js (BLIP/ViT) | 大型模型下载 | Low |

下面逐项分析。

### 密钥/Token 检测（Critical 优先级）

这是不需要任何 ML 技术就能实现的高价值功能。通过正则表达式匹配已知的密钥模式，可以在零依赖、零下载的情况下检测剪贴板中的敏感信息。

```typescript
interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
  description: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'AWS Access Key ID',
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: 'critical',
    description: 'AWS 访问密钥 ID'
  },
  {
    name: 'AWS Secret Access Key',
    pattern: /[A-Za-z0-9/+=]{40}/,
    severity: 'critical',
    description: 'AWS 秘密访问密钥'
  },
  // ... 更多模式
];
```

支持的密钥模式：

| 模式 | 正则 | 示例前缀 |
|------|------|----------|
| AWS Access Key ID | `AKIA[0-9A-Z]{16}` | `AKIA...` |
| AWS Secret Access Key | `[A-Za-z0-9/+=]{40}` | 40 字符 Base64 |
| GitHub Token | `gh(p\|o\|u\|s)_[A-Za-z0-9_]{36}` | `ghp_`, `gho_`, `ghu_`, `ghs_` |
| JWT | `eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+` | `eyJ...` |
| Bearer Token | `Bearer\s+[A-Za-z0-9\-._~+/]+=*` | `Bearer ...` |
| Private Key | `-----BEGIN (RSA\|EC\|DSA\|OPENSSH) PRIVATE KEY-----` | `-----BEGIN...` |
| Slack Token | `xox(b\|p\|a\|r)-[A-Za-z0-9-]+` | `xoxb-`, `xoxp-` |
| Stripe Key | `sk_(live\|test)_[A-Za-z0-9]+` | `sk_live_`, `sk_test_` |
| Generic API Key | 多种启发式模式 | 各种格式 |

这个功能的价值在于：开发者经常无意中把密钥复制到剪贴板（从 .env 文件、配置页面、终端输出等），一个即时警告可以避免严重的安全事故。而且它完全不需要 ML 模型，零下载，即时生效。

### 文本分类（High 优先级）

判断剪贴板文本的内容类型（代码、URL、email、JSON、HTML、Base64、Markdown 等）可以靠规则完成大部分工作，不需要 ML。

分类策略采用分层规则匹配：

```
1. 先检查结构化格式（JSON, XML, HTML, YAML）
2. 再检查编码格式（Base64, URL-encoded）
3. 然后检查协议/标识（URL, email, IP, JWT）
4. 最后检查编程语言关键字（代码检测）
5. 兜底：纯文本
```

这个分层方案能在毫秒级完成分类，准确率对常见格式可以达到 95% 以上。对于 Clipboard Inspector 来说，自动分类意味着用户粘贴内容后，界面可以自动切换到最合适的查看模式（JSON 格式化、HTML 预览、代码高亮等）。

### OCR 文字提取（High 优先级）

从剪贴板图片中提取文字有两种可行方案：

**方案 A：Tesseract.js**。纯 WASM 实现，无需 GPU。模型大小约 2-4MB（单个语言）。识别速度中等，英文文本可以在 1-3 秒内完成。优势是兼容性极好，任何现代浏览器都能运行。

**方案 B：Transformers.js + TrOCR**。基于 Transformer 架构的 OCR 模型。模型较大（约 300MB），但识别精度更高，特别是对手写体和复杂排版。需要 WebGPU 才能获得可接受的推理速度。

推荐先实现方案 A（Tesseract.js），它更轻量、兼容性更好，能满足大多数场景。方案 B 作为后续增强选项。

### 内容摘要（Medium 优先级）

两种实现路径：

**路径 1：Summarizer API**。Chrome 内置，零模型下载。但仅 Chrome/Edge 可用，需要做降级处理。

**路径 2：Transformers.js**。跨浏览器，但需要下载摘要模型（约 100-300MB）。首次使用等待时间长。

对于 MVP 阶段，可以先支持 Summarizer API（Chrome-only），同时显示提示："摘要功能在其他浏览器中暂不可用"。这符合渐进增强的原则，不阻塞核心功能。

### 语义搜索（Medium 优先级）

语义搜索需要将每条剪贴板历史转为向量（embedding），然后在搜索时计算查询向量与历史向量的余弦相似度。

技术上是可行的。Transformers.js 提供了文本嵌入模型（如 `all-MiniLM-L6-v2`，约 30MB），可以在浏览器中运行。主要挑战是：

- 每条历史记录都要计算并存储向量，内存占用随历史增长
- 首次加载模型需要下载 30-80MB
- 需要某种持久化方案（IndexedDB）来避免每次重新计算

这个功能适合放在桌面端（Tauri）中实现，因为桌面端有更好的计算和存储资源。

### 图片内容描述（Low 优先级）

使用 BLIP 或 ViT 模型对剪贴板图片生成文字描述。模型大小在 300MB 以上，推理时间较长（即使有 WebGPU），对大多数用户的使用场景也不够强。暂时放在低优先级。

## 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| WebGPU 浏览器支持不全 | ML 模型性能受限 | 降级到 WASM，降低模型大小 |
| 模型下载耗时 | 用户流失 | 后台预加载、缓存、进度提示 |
| 浏览器内置 AI API 碎片化 | 功能不一致 | 特性检测 + 优雅降级 |
| WASM 内存限制 | 大图片处理失败 | 分块处理、限制输入大小 |

## 技术结论

AI 功能不需要一步到位。推荐的实施顺序：

1. **先做零 ML 功能**：密钥检测（纯正则）、内容分类（规则引擎）。这两个功能立即可做，零下载，价值明确。
2. **再做轻量 ML**：OCR（Tesseract.js，2-4MB）。有明确用户场景（截图中的文字），下载成本可控。
3. **然后做中量 ML**：语义搜索（嵌入模型，30-80MB）。等剪贴板历史功能积累足够数据后才有意义。
4. **最后考虑重量 ML**：图片描述、内容摘要。等用户基础足够大、桌面端可用时再评估。

这种渐进式策略确保每一步都有用户验证，不会在无人使用的功能上浪费开发资源。
