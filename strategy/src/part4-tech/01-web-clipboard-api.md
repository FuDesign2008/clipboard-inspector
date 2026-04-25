# 4.1 Web Clipboard API 能力矩阵

Web Clipboard API 是 Clipboard Inspector 的技术基石。这一章从实际测试数据和规范文档出发，梳理当前浏览器对剪贴板操作的支持情况，分析即将到来的新特性，以及安全模型带来的限制。

## Async Clipboard API 浏览器支持矩阵

Async Clipboard API（异步剪贴板 API）是现代 Web 端读写剪贴板的标准接口。它允许开发者在没有用户交互事件（如 click 或 keydown）的情况下，通过 Promise 异步读写剪贴板。下表整理了各主流浏览器的支持版本：

| 方法 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| `writeText()` | 66+ | 63+ | 13.1+ | 79+ |
| `readText()` | 66+ | 125+ | 13.1+ | 79+ |
| `write()` | 76+ | 125+ | 13.1+ | 79+ |
| `read()` | 76+ | 125+ | 13.1+ | 79+ |
| `read({unsanitized})` | 142+ | - | - | 142+ |
| `ClipboardItem.supports()` | 142+ | - | - | 142+ |
| `clipboardchange` 事件 | 142+ | - | - | 142+ |

几点关键观察：

**Firefox 的追赶**。Firefox 从 125 版本开始全面支持 `read()` 和 `write()` 方法，这标志着 Async Clipboard API 终于在三大浏览器引擎中获得了基本一致的支持。在此之前，Firefox 仅支持 `writeText()` 和 `readText()` 两个文本方法。

**新特性集中在 Chromium**。`read({unsanitized})`、`ClipboardItem.supports()` 和 `clipboardchange` 事件目前仅 Chrome/Edge 142+ 支持。这些是 Clipboard Inspector 未来功能（如剪贴板历史、原始 HTML 检查）的技术前提。

**Baseline 状态**。根据 Web Platform Tests 的定义，Async Clipboard API 的核心方法（`read()`, `write()`, `readText()`, `writeText()`）在 2024 年 6 月达到了 "Baseline Newly Available" 状态，即所有主流浏览器都支持了。按照惯例，预计 2026 年 12 月将达到 "Baseline Widely Available"，意味着这些 API 已经稳定可用超过 30 个月。

## 关键新特性详解

### clipboardchange 事件

这是对 Clipboard Inspector 意义最大的一个新特性。

在 `clipboardchange` 事件出现之前，Web 应用无法主动感知剪贴板内容的变化。唯一的方式是轮询（通过定时器反复调用 `read()`），但这既低效又受权限限制。

`clipboardchange` 事件在剪贴板内容被任何应用（包括系统其他应用）修改时触发。这为以下功能打开了大门：

```javascript
// 基础用法
navigator.clipboard.addEventListener('clipboardchange', async () => {
  const items = await navigator.clipboard.read();
  // 记录到剪贴板历史
  addToHistory(items);
});
```

实际意义：这是 Web 端剪贴板历史功能的基础。没有这个事件，剪贴板历史在 Web 端几乎不可能实现。目前仅 Chrome/Edge 142+ 支持，Firefox 和 Safari 尚未宣布支持计划。

### ClipboardUnsanitizedFormats

浏览器在读取 HTML 格式的剪贴板内容时，默认会进行"消毒"（sanitization），移除 `<script>` 标签、事件处理器等潜在危险内容。对于调试工具来说，这恰恰是我们要看到的东西。

Chrome 142+ 引入了 `ClipboardUnsanitizedFormats`，允许指定读取时不做消毒的格式：

```javascript
const items = await navigator.clipboard.read({
  unsanitized: ['text/html']
});
```

这对 Clipboard Inspector 来说至关重要。开发者需要看到剪贴板中 HTML 的原始内容，包括所有标签和属性，才能准确调试。消毒后的 HTML 会丢失关键调试信息。

### PresentationStyle

`PresentationStyle` 是一个提示性属性，告诉粘贴目标应用如何渲染剪贴板内容。它有三个值：`unspecified`、`inline` 和 `attachment`。虽然目前浏览器支持有限，但这个特性预示着剪贴板 API 正在向更丰富的粘贴语义发展。

### ClipboardItem.supports() 静态方法

这个方法允许在运行时检测浏览器是否支持特定的 MIME 类型：

```javascript
if (ClipboardItem.supports('image/svg+xml')) {
  // 可以安全地读写 SVG
}
```

对于 Clipboard Inspector，这意味着可以根据用户当前浏览器动态调整功能面板，避免在调用不支持的 API 时出错。

## DataTransfer API 的补充能力

Async Clipboard API 并不是 Web 端访问剪贴板的唯一途径。在 `paste` 和 `drop` 事件中，`DataTransfer` 对象提供了更强大的剪贴板数据访问能力。

### 为什么 DataTransfer 更强大

| 能力 | Async Clipboard API | DataTransfer API |
|------|---------------------|------------------|
| 触发条件 | 任意时刻（需权限） | 仅在 paste/drop 事件中 |
| MIME 类型范围 | 仅标准类型 | 所有类型，包括自定义 |
| 自定义/专有格式 | 不支持 | 支持 |
| 文件访问 | 有限 | 完整 |
| 权限模型 | Permissions API | 瞬态用户激活 |

DataTransfer 的核心优势在于它能暴露所有 MIME 类型，包括应用自定义的专有格式。例如，当从 VS Code 复制代码时，剪贴板中除了 `text/plain`，还可能包含 `vscode-editor-data` 等自定义格式。这些信息对调试剪贴板交互的开发者来说极其宝贵。

### 三层 MIME 类型体系

剪贴板数据通常以多层 MIME 类型共存的形式存在，每一层服务于不同的粘贴场景：

| 层级 | MIME 类型 | 用途 |
|------|-----------|------|
| 纯文本 | `text/plain` | 所有粘贴场景的兜底 |
| 富文本 | `text/html` | 保留格式信息 |
| 图片 | `image/png` | 截图、图片复制 |
| 链接 | `text/uri-list` | URL 信息 |
| 文件 | `Files` | 文件拖放/复制 |

当用户从浏览器复制一段文字时，剪贴板可能同时包含 `text/plain`（纯文本）和 `text/html`（带格式的 HTML）。粘贴目标应用会根据自身需求选择最合适的格式。Clipboard Inspector 的核心价值之一就是让开发者看到这些并存的格式层。

### 跨浏览器差异

DataTransfer API 在不同浏览器中的行为存在微妙但重要的差异：

- **Chrome**：`e.clipboardData.types` 返回所有可用 MIME 类型，包括自定义格式
- **Firefox**：对自定义格式的暴露更加保守，部分格式可能不出现
- **Safari**：对 `text/html` 的处理有独特逻辑，可能会重新包装 HTML 内容

这些差异正是前端开发者需要 Clipboard Inspector 的原因之一。一个在 Chrome 中正常工作的粘贴功能，在 Safari 中可能因为格式差异而失败。

## 安全与权限模型

剪贴板包含敏感信息（密码、Token、个人信息），浏览器对其访问有严格的安全限制。理解这些限制对产品功能设计至关重要。

### Chromium 的权限模型

Chromium 系浏览器（Chrome、Edge）要求 `clipboard-read` 权限才能使用 `navigator.clipboard.read()`：

```javascript
// 需要用户授予 clipboard-read 权限
const permission = await navigator.permissions.query({
  name: 'clipboard-read'
});
```

首次调用时，浏览器会弹出权限提示。用户拒绝后，后续调用会直接失败。这意味着 Clipboard Inspector 需要在首次使用时引导用户授权。

### Firefox 的瞬态激活模型

Firefox 不使用 Permissions API，而是依赖"瞬态用户激活"（transient user activation）。剪贴板读取操作必须发生在用户交互（点击、按键等）的回调中，且激活状态有短暂的时效窗口。

```javascript
// 必须在用户交互回调中
button.addEventListener('click', async () => {
  // 这里 readText() 可以正常工作
  const text = await navigator.clipboard.readText();
});
```

如果用户点击后过了一段时间才调用 `read()`，操作会被拒绝。这对 Clipboard Inspector 的 UI 设计有直接影响：粘贴按钮需要在点击后立即触发读取。

### Safari 的粘贴上下文菜单

Safari 采取了最保守的策略。它不使用权限提示，而是在用户触发粘贴操作时显示一个临时的"粘贴"上下文菜单。用户必须在这个菜单中确认粘贴，才能完成读取。这是 iOS Safari 的标准行为，也体现在桌面 Safari 中。

### 安全模型对产品设计的影响

三种不同的安全模型意味着：

1. **不能假设静默读取**。所有剪贴板读取都需要用户主动触发。
2. **需要做降级处理**。在权限被拒绝或 API 不可用时，提供 paste 事件作为备选。
3. **用户引导很关键**。需要在 UI 中清晰地解释为什么需要权限、如何授权。

Clipboard Inspector 目前同时支持 Async Clipboard API 和 paste 事件两种方式读取剪贴板。这种双路径设计确保了在不同浏览器中都能正常工作，也为未来的功能扩展打下了基础。

## 技术结论

Web Clipboard API 正处在一个快速成熟的阶段。核心方法已经 Baseline Newly Available，新特性（clipboardchange、unsanitized formats）正在 Chromium 中逐步落地。对于 Clipboard Inspector 来说：

- **现在能做的**：多格式检查、paste/drag-drop 数据捕获、导出功能、跨浏览器差异展示
- **近期可做的**：剪贴板历史（等 clipboardchange 更广泛支持）、原始 HTML 检查
- **需要等待的**：完整的自定义 MIME 类型支持、跨浏览器一致的新特性支持

技术窗口正在打开。2024 年 6 月 Baseline 以来，API 支持度持续提升。现在是构建基于这些 API 的开发者工具的好时机。
