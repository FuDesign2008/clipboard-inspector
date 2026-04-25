---
title: "你的剪贴板里到底有什么？一文看懂剪贴板数据格式"
description: "深入理解剪贴板数据格式、MIME type、DataTransfer API 和 ClipboardItem。面向开发者的剪贴板技术指南，附实战案例和代码示例。"
keywords: "剪贴板数据格式, clipboard data formats, 剪贴板内容查看, MIME type, DataTransfer, ClipboardItem"
date: "2026-04-25"
author: "FuDesign2008"
---

# 你的剪贴板里到底有什么？一文看懂剪贴板数据格式

## 你复制粘贴时，到底发生了什么？

Ctrl+C，Ctrl+V。这个动作你每天可能重复几十次。但你有没有想过，当你从 Word 里复制一段文字粘贴到浏览器，浏览器是怎么知道该保留加粗和斜体的？当你从 Figma 复制一张图片粘贴到 Slack，Slack 又是怎么拿到那张 PNG 的？

答案藏在剪贴板的数据格式里。剪贴板从来不是一块只装纯文本的临时缓冲区，它更像一个多格式的集装箱。每次复制，操作系统会把同一份内容以多种 MIME 类型同时存进去。粘贴的时候，接收方从这些格式里挑一个自己能处理的来用。

理解这个机制，对前端开发者来说不是什么可选项。做富文本编辑器、实现拖拽上传、处理跨应用粘贴，这些都绕不开剪贴板数据格式。这篇文章会从头讲清楚这件事。

## 剪贴板不是只有文本

MIME type（媒体类型）是理解剪贴板的关键概念。你在 HTTP 请求的 `Content-Type` 头里见过它，在 `<input accept="image/*">` 里见过它。剪贴板也在用它。

当你复制内容时，操作系统不会只存一份纯文本。它会尝试把内容转换成多种格式同时保存。比如从浏览器复制一段带格式的文字，剪贴板里可能同时包含：

- `text/plain`：纯文本版本
- `text/html`：带 HTML 标签的版本
- `text/uri-list`：如果选中了链接，会有这个格式

这不是浏览器在自作主张。这是剪贴板协议的设计：提供多种表示，让粘贴端自己选择最合适的一种。

这种设计带来了灵活性。记事本只需要 `text/plain`，Word 可以消费 `text/html`，而一个代码编辑器可能两者都能处理但优先选择纯文本。各取所需，互不干扰。

## 常见数据格式一览

让我们把剪贴板里最常见的几种 MIME 类型过一遍。

### text/plain

最基础的格式。几乎所有复制操作都会附带一份纯文本。没有格式，没有样式，就是字符。它是兜底选项：如果接收方不认识其他任何格式，至少能显示纯文本。

### text/html

从浏览器、富文本编辑器、办公软件复制内容时，通常会同时存入 HTML 格式。这段 HTML 可能包含行内样式、class 名、甚至完整的文档结构。

下面这段就是从浏览器复制一行加粗文字后，剪贴板里 `text/html` 的真实内容：

```html
<meta charset='utf-8'>
<b>加粗文字</b>
```

注意那个 `<meta charset>` 标签。不同应用往剪贴板写 HTML 时格式各异，Chrome 会加这个 meta 标签，Word 写出来的则是包含大量 XML 命名空间的庞大 HTML 片段。

### image/png

复制图片或截图时出现。二进制数据，直接就是一张 PNG 图。有些应用还会同时提供 `image/jpeg` 或 `image/gif`。

### application/x-custom-data

很多桌面应用会往剪贴板写入私有格式。比如 Visual Studio Code 会写 `application/vnd.code.copy`，Figma 有自己的格式，Excel 会写 `application/xml` 和一堆 Office 特有的类型。这些私有格式的存在，是为了在同系列应用之间粘贴时保留更多语义信息。

### Files

拖拽文件到浏览器时，`DataTransfer` 对象的 `.files` 属性会包含文件列表。每个文件有 `name`、`type`（MIME）、`size` 和 `lastModified`。这不是通过 MIME type 字符串传递的，而是通过 `File` 对象。

## 如何查看剪贴板里的全部数据

问题来了：操作系统自带的粘贴功能只会给你"最佳匹配"，不会让你看到剪贴板里到底存了几种格式。作为开发者，你需要一个能看到完整数据的工具。

[Clipboard Inspector](https://fudesign2008.github.io/clipboard-inspector/) 就是干这个的。它是一个在线工具，打开页面后，直接 Ctrl+V 粘贴（或者拖拽文件进去），就能看到剪贴板里的全部数据格式。

它会把每种 MIME type 列出来，展示对应的内容。文本类格式直接显示文字，HTML 格式会同时显示源码和渲染结果，图片格式会显示预览，二进制文件会显示文件名和大小。

如果你需要把数据带离浏览器做进一步分析，它还支持导出为 Markdown 文件或 ZIP 压缩包。Markdown 导出适合直接丢给 AI 助手做诊断，ZIP 导出保留了原始二进制数据，适合提交 bug report。

## 实际案例：从 Word 复制到浏览器

来做一个实验。在 Microsoft Word 里选中一段带有加粗、斜体、超链接的文字，复制，然后用 Clipboard Inspector 查看剪贴板内容。

你会发现剪贴板里同时存在以下格式（不同版本的 Word 可能略有差异）：

| 格式 | 内容概述 |
|---|---|
| `text/plain` | 纯文本，所有格式信息丢失 |
| `text/html` | 包含样式和链接的 HTML 片段，体积可能很大 |
| `text/rtf` | RTF 格式，保留大部分排版信息 |
| `application/xml` | Word 的 XML 表示 |
| `application/vnd.openxmlformats-officedocument...` | Office Open XML 格式 |

`text/plain` 只有几十个字节的纯文本。`text/html` 可能是几 KB 的 HTML，里面混杂着 Word 特有的 XML 命名空间声明和 mso 样式。`application/xml` 又是一套完全不同的表示。

这就解释了为什么从 Word 粘贴到不同地方效果不一样。粘贴到记事本，只有纯文本。粘贴到 Gmail，会保留基本格式但可能丢失部分样式。粘贴到 Word 自己，格式完整保留，因为它能读懂那些私有格式。

对前端开发者来说，这里有一个常见的坑：用户从 Word 复制内容粘贴到你的富文本编辑器，你拿到的是那段充满 mso 样式的 HTML。如果你不做清理，这些样式会污染你的页面。这就是为什么 Tiptap、Slate 等编辑器框架都有专门的 paste handler 来处理 Word HTML。

## 开发者视角：DataTransfer API 和 ClipboardItem

现在从用户视角切换到代码视角。浏览器里跟剪贴板打交道的 API 有两套，适用于不同场景。

### paste 和 drop 事件中的 DataTransfer

当用户在你的页面里粘贴或拖拽时，事件回调会给你一个 `DataTransfer` 对象。它是只读的，你只能读，不能写。

```javascript
document.addEventListener('paste', (event) => {
  const dt = event.clipboardData; // 这是一个 DataTransfer 对象

  // 查看所有可用的 MIME 类型
  console.log(dt.types); // ['text/plain', 'text/html', ...]

  // 读取特定格式的文本数据
  const html = dt.getData('text/html');
  const plain = dt.getData('text/plain');

  // 如果粘贴了文件
  const files = dt.files;
  for (let i = 0; i < files.length; i++) {
    console.log(files[i].name, files[i].type, files[i].size);
  }
});
```

几个要点：

- `dt.types` 是一个 `DOMStringList`，不是普通数组，不能直接 `.map()`。用 `Array.from()` 转一下，或者用 `for...of` 遍历。
- `dt.getData()` 只对文本格式有效。如果是二进制数据（比如图片），你需要通过 `dt.items` 的 `getAsFile()` 方法获取。
- `dt.files` 只包含通过文件操作进入剪贴板的文件对象，不是所有二进制数据都会出现在这里。

通过 `DataTransferItem` 可以更精细地访问数据：

```javascript
document.addEventListener('paste', (event) => {
  const dt = event.clipboardData;

  for (const item of dt.items) {
    if (item.kind === 'string') {
      item.getAsString((str) => {
        console.log(item.type, str);
      });
    } else if (item.kind === 'file') {
      const file = item.getAsFile();
      console.log(item.type, file);
    }
  }
});
```

### Async Clipboard API 和 ClipboardItem

如果你需要主动读取或写入剪贴板（不是在事件回调里），用 Async Clipboard API。它基于 `ClipboardItem`，而不是 `DataTransfer`。

```javascript
// 读取剪贴板
try {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    for (const type of item.types) {
      const blob = await item.getType(type);
      console.log(type, blob.size);
    }
  }
} catch (err) {
  // 读取被拒绝，可能是用户没有授权
  console.error(err);
}

// 写入剪贴板
const textBlob = new Blob(['Hello'], { type: 'text/plain' });
const htmlBlob = new Blob(['<b>Hello</b>'], { type: 'text/html' });

await navigator.clipboard.write([
  new ClipboardItem({
    'text/plain': textBlob,
    'text/html': htmlBlob,
  }),
]);
```

两套 API 的核心区别：

- `DataTransfer` 是事件驱动的，被动接收数据，只在 paste/drop 事件的回调里可用。
- `ClipboardItem` 是主动式的，可以随时读写，但需要用户授权（`clipboard-read` / `clipboard-write` 权限）。
- `DataTransfer` 的 `getData()` 返回字符串，`ClipboardItem` 的 `getType()` 返回 `Blob`。

写代码时注意兼容性。Async Clipboard API 在 Firefox 里的支持是部分实现的，`clipboard.read()` 截至 2026 年初仍然只在安全上下文（HTTPS）下可用，且某些浏览器要求显式的权限请求。

## 总结

剪贴板是一个多格式容器，每次复制操作可能同时存储多种 MIME 类型的数据。理解这一点，是处理富文本粘贴、拖拽上传、跨应用数据交换的基础。

记住这几个关键点：

1. 复制不是只存文本，而是存多种格式的表示。
2. `text/plain` 是兜底格式，几乎总是存在。
3. `text/html` 是富文本跨应用传递的主力格式，但来源不同质量差异很大。
4. 图片和文件通过二进制格式或 `File` 对象传递。
5. `DataTransfer` 用于事件回调，`ClipboardItem` 用于主动读写，两套 API 不能混用。

下次遇到粘贴行为不符合预期的情况，别猜。用 [Clipboard Inspector](https://fudesign2008.github.io/clipboard-inspector/) 粘贴一下，看清楚剪贴板里到底有什么数据格式，问题通常就清楚了。
