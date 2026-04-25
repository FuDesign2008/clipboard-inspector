# Browser Clipboard API 完全指南：从复制粘贴到自动化

> 想在网页里实现一键复制？读取用户剪贴板内容？监听复制粘贴事件并拦截处理？现代浏览器提供的 Clipboard API 让这一切变得简单。这篇教程会带你从零开始，彻底搞懂浏览器剪贴板操作的所有细节。

## 现代浏览器剪贴板 API 能做什么？

先说一个真实的场景。你在做一个在线代码编辑器，用户选了一段代码，点一下按钮就复制到剪贴板。或者你在做一个 Markdown 编辑器，用户粘贴图片时自动上传并插入链接。再或者，你在做一个数据管理平台，用户从 Excel 复制表格数据，粘贴进来直接变成可编辑的表格行。

这些功能都依赖浏览器提供的剪贴板能力。具体来说，你可以：

- **写入文本或富内容到剪贴板**，比如复制代码片段、复制格式化内容
- **读取剪贴板内容**，包括纯文本和图片
- **监听和拦截复制、剪切、粘贴事件**，自定义剪贴板行为
- **通过 DataTransfer 处理复杂数据类型**，实现跨应用的数据交换

听起来很不错。但剪贴板操作涉及用户隐私，浏览器对此有严格的安全限制。下面我们一步步来。

## 两套 API：Legacy vs Modern

浏览器处理剪贴板操作有两套方案，它们的差异很大。

### Legacy：document.execCommand

这是老方案，通过 `document.execCommand('copy')` 和 `document.execCommand('paste')` 来操作剪贴板。

```javascript
// 旧方案：复制文本
function copyText(text) {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}
```

这个方案的问题很明显：需要操作 DOM，必须创建临时元素，代码繁琐，而且 `execCommand` 已经被 W3C 标记为废弃。`paste` 命令在大多数浏览器里干脆就不支持。

### Modern：Navigator Clipboard API

新方案使用 `navigator.clipboard` 对象，基于 Promise，写法简洁，支持读写，还能处理图片等富内容。

```javascript
// 新方案：复制文本
async function copyText(text) {
  await navigator.clipboard.writeText(text);
}
```

两行代码搞定，不需要操作 DOM，不需要创建临时元素。本文后续所有内容都围绕这套 Modern API 展开。

## 读取剪贴板

### 读取纯文本：readText()

`navigator.clipboard.readText()` 返回一个 Promise，resolve 的值就是剪贴板里的纯文本内容。

```javascript
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('剪贴板内容：', text);
    return text;
  } catch (err) {
    console.error('读取失败：', err);
  }
}
```

调用很简单，但有几个要注意的点：

1. 页面必须处于焦点状态（focused）
2. 调用必须由用户操作触发，比如点击按钮，不能在页面加载时自动调用
3. 浏览器会弹出权限提示，用户可以拒绝

### 读取富内容：read()

`navigator.clipboard.read()` 可以读取剪贴板中的多种 MIME 类型数据，返回一个 `ClipboardItem` 数组。

```javascript
async function readClipboard() {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      // 检查是否有图片类型
      if (item.types.includes('image/png')) {
        const blob = await item.getType('image/png');
        const url = URL.createObjectURL(blob);
        console.log('图片地址：', url);
      }
      // 检查是否有文本
      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain');
        const text = await blob.text();
        console.log('文本内容：', text);
      }
    }
  } catch (err) {
    console.error('读取失败：', err);
  }
}
```

每个 `ClipboardItem` 有一个 `types` 属性，列出当前剪贴板条目支持的所有 MIME 类型。通过 `getType(mimeType)` 可以拿到对应类型的 `Blob` 对象。

## 写入剪贴板

### 写入纯文本：writeText()

这是最常用的操作，比如"点击复制"按钮。

```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败：', err);
    // fallback 到 execCommand
    fallbackCopy(text);
  }
}

// 兼容性 fallback
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
```

建议始终保留 fallback。`writeText` 在一些旧浏览器上不支持，用 `execCommand` 兜底能保证基本功能可用。

### 写入富内容：write()

`navigator.clipboard.write()` 可以写入多种类型的数据，比如同时写入 HTML 和纯文本。

```javascript
async function copyRichContent() {
  try {
    const textBlob = new Blob(['Hello World'], { type: 'text/plain' });
    const htmlBlob = new Blob(['<b>Hello World</b>'], { type: 'text/html' });

    const item = new ClipboardItem({
      'text/plain': textBlob,
      'text/html': htmlBlob,
    });

    await navigator.clipboard.write([item]);
    console.log('富内容已写入剪贴板');
  } catch (err) {
    console.error('写入失败：', err);
  }
}
```

注意 `ClipboardItem` 的构造函数接收一个对象，key 是 MIME 类型，value 是 `Blob`。如果你想写入图片：

```javascript
async function copyImage(canvas) {
  try {
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/png')
    );
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
  } catch (err) {
    console.error('复制图片失败：', err);
  }
}
```

## 权限和安全限制

剪贴板操作涉及敏感数据，浏览器有一套安全机制来保护用户。

### Permissions API

你可以用 Permissions API 提前查询剪贴板权限状态：

```javascript
async function checkClipboardPermission() {
  const result = await navigator.permissions.query({
    name: 'clipboard-read',
  });
  // result.state: 'granted' | 'denied' | 'prompt'
  console.log('剪贴板读取权限：', result.state);
  return result.state;
}
```

### 核心安全规则

| 规则 | 说明 |
|------|------|
| 必须由用户手势触发 | 读写操作必须在 click、keydown 等用户事件的回调中执行 |
| 页面必须处于活动状态 | 后台标签页无法访问剪贴板 |
| 需要 HTTPS | `navigator.clipboard` 只在安全上下文（HTTPS 或 localhost）中可用 |
| 读取需要授权 | `read()` 和 `readText()` 会触发浏览器权限弹窗 |
| 写入通常无需授权 | `writeText()` 在大多数浏览器中无需额外权限 |
| 跨域图片受限 | 如果剪贴板中的图片来自跨域资源，读取可能被拦截 |

一个常见的坑是：你在 `setTimeout` 里调用 `clipboard.writeText`，哪怕延迟只有 100ms，浏览器也会认为是非用户手势而拒绝操作。解决这个问题可以用 `UserActivation` API 检查：

```javascript
document.querySelector('#copy-btn').addEventListener('click', async () => {
  if (!navigator.userActivation.isActive) {
    console.warn('非用户激活状态，操作可能被拒绝');
    return;
  }
  await navigator.clipboard.writeText('some text');
});
```

### 监听剪贴板事件

除了主动读写，你还可以监听 `copy`、`cut`、`paste` 三个事件，拦截并自定义剪贴板行为。

```javascript
document.addEventListener('copy', (e) => {
  // 阻止默认复制行为
  e.preventDefault();
  // 写入自定义内容
  e.clipboardData.setData('text/plain', '这是自定义复制内容');
  e.clipboardData.setData('text/html', '<i>自定义HTML</i>');
});

document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      console.log('粘贴了图片：', file.name, file.size);
    }
    if (item.type === 'text/plain') {
      item.getAsString((text) => {
        console.log('粘贴了文本：', text);
      });
    }
  }
});
```

这里用的是 `DataTransfer` 对象（`e.clipboardData`），它和 `navigator.clipboard` 是不同的接口。`DataTransfer` 在事件处理中使用，`navigator.clipboard` 用于主动操作。两者配合使用能覆盖几乎所有剪贴板交互场景。

## 兼容性

| 特性 | Chrome | Firefox | Safari |
|------|--------|---------|--------|
| `navigator.clipboard` | 66+ | 63+ | 13.1+ |
| `writeText()` | 66+ | 63+ | 13.1+ |
| `readText()` | 66+ | 63+ | 13.1+ |
| `read()` (富内容) | 76+ | 不支持 | 13.1+ |
| `write()` (富内容) | 76+ | 不支持 | 13.1+ |
| `ClipboardItem` | 76+ | 不支持 | 13.1+ |
| `clipboardchange` 事件 | 不支持 | 不支持 | 不支持 |

Firefox 对富内容读写的支持比较有限。如果你的用户群中 Firefox 占比较高，建议对富内容功能做降级处理，或者依赖 `paste` 事件中的 `DataTransfer` 作为替代。

## 实战：构建一个简单的剪贴板工具

把前面学到的知识串起来，我们做一个实用的小工具：一个支持文本复制和剪贴板内容预览的页面。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>剪贴板工具</title>
  <style>
    body { font-family: sans-serif; max-width: 640px; margin: 40px auto; }
    textarea { width: 100%; height: 120px; resize: vertical; }
    button { padding: 8px 20px; margin: 8px 4px; cursor: pointer; }
    #preview { border: 1px solid #ccc; padding: 16px; min-height: 60px; margin-top: 16px; }
  </style>
</head>
<body>
  <h2>剪贴板工具</h2>

  <textarea id="input" placeholder="输入要复制的内容..."></textarea>
  <div>
    <button id="copy-btn">复制到剪贴板</button>
    <button id="paste-btn">从剪贴板粘贴</button>
  </div>

  <h3>剪贴板内容预览</h3>
  <div id="preview">（等待操作...）</div>

  <script>
    const input = document.getElementById('input');
    const preview = document.getElementById('preview');
    const copyBtn = document.getElementById('copy-btn');
    const pasteBtn = document.getElementById('paste-btn');

    // 复制功能
    copyBtn.addEventListener('click', async () => {
      const text = input.value;
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        preview.textContent = '已复制: ' + text;
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        preview.textContent = '已复制(fallback): ' + text;
      }
    });

    // 粘贴功能
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        input.value = text;
        preview.textContent = '已粘贴: ' + text;
      } catch {
        preview.textContent = '读取剪贴板失败，请检查权限设置';
      }
    });

    // 监听全局粘贴事件
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          const url = URL.createObjectURL(file);
          preview.innerHTML = `<img src="${url}" style="max-width:100%">`;
        }
      }
    });
  </script>
</body>
</html>
```

这段代码涵盖了三个核心操作：通过 `writeText` 写入剪贴板，通过 `readText` 读取剪贴板，以及通过 `paste` 事件处理图片粘贴。还包含了 `execCommand` 的 fallback 方案，确保在旧浏览器上也能工作。

## 总结

浏览器剪贴板 API 经过几年的发展，已经相当成熟。核心要点如下：

- 优先使用 `navigator.clipboard`（Async Clipboard API），它基于 Promise，代码简洁
- `writeText()` 适合大多数复制场景，兼容性好
- `read()` 和 `write()` 支持富内容，但 Firefox 支持不完整
- 所有操作必须在用户手势中触发，且需要 HTTPS 环境
- `copy/cut/paste` 事件配合 `DataTransfer` 可以拦截和自定义剪贴板行为
- 始终保留 `execCommand` fallback，应对兼容性问题

如果你对剪贴板操作有更多需求，比如监听剪贴板变化、跨标签页同步剪贴板内容，可以关注 `Clipboard API` 规范的后续更新。目前这些高级特性还在草案阶段，尚未有浏览器完整实现。
