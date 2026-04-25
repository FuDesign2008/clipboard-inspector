---
title: "剪贴板数据格式全解析：MIME Type 是如何工作的？"
description: "从 MIME type 到操作系统原生格式，再到浏览器 ClipboardItem API，一文讲透剪贴板数据在不同平台之间的格式表示和转换过程。"
keywords: "MIME type, 剪贴板格式, text/html, image/png, DataTransfer, ClipboardItem, NSPasteboard, OLE"
date: "2026-04-25"
author: "FuDesign2008"
---

# 剪贴板数据格式全解析：MIME Type 是如何工作的？

## 复制一个链接，剪贴板里到底存了什么？

你在浏览器里选中一个链接，按下 Ctrl+C。直觉告诉你剪贴板里就是那个 URL 字符串。但实际情况要丰富得多。打开任何一款剪贴板查看工具（比如这个项目本身），你会发现剪贴板里同时躺着好几份数据：纯文本、HTML 片段、甚至一个 URI 列表。

这不是巧合，而是剪贴板协议的核心设计。操作系统在每次复制时，会尽可能把内容转换成多种格式同时写入剪贴板。粘贴的时候，接收方从这些格式里挑一个自己最擅长的来消费。

而串联这一切的概念，就是 MIME type。

## 什么是 MIME Type？

MIME（Multipurpose Internet Mail Extensions）最初是为电子邮件设计的，用来告诉邮件客户端附件是什么类型。后来这个机制被 HTTP 借走了（`Content-Type` 头），又被 HTML 借走了（`<input accept>`），最后连剪贴板也用上了它。

一个 MIME type 由两部分组成：类型和子类型，中间用斜杠分隔。比如 `text/plain` 表示纯文本，`image/png` 表示 PNG 图片。有时候还会带参数，比如 `text/html; charset=utf-8`。

在剪贴板的语境下，MIME type 扮演的是"标签"的角色。剪贴板是一个键值存储，键是 MIME type，值是对应的二进制数据。一个剪贴板快照里可以有多个键值对，它们描述的是同一份内容的不同表示。

### 剪贴板里常见的 MIME Type

**text/plain** 是最基础的。几乎所有复制操作都会附带一份纯文本。记事本、终端、地址栏，这些只能处理纯文本的场景都依赖它。当你在代码编辑器里粘贴时，编辑器通常也会优先选择 `text/plain`，因为你不希望粘贴进来一堆 HTML 标签。

**text/html** 携带的是带格式的 HTML 内容。从网页复制一段文字，剪贴板里就会有一份 HTML 版本，保留加粗、链接、列表等格式信息。Word、Google Docs、富文本编辑器会优先读取这个格式。

**text/rtf** 是 RTF（Rich Text Format），一种古老的富文本标记语言。它不像 HTML 那样灵活，但在 Windows 生态里根深蒂固。从 Word 或 Outlook 复制内容时，剪贴板里通常会有一份 RTF 数据。

**image/png** 和 **image/jpeg** 用于图片。截图工具、图像编辑器会把图片数据直接写入剪贴板。浏览器在处理粘贴事件时，可以从 DataTransfer 或 ClipboardItem 中读取到这些二进制数据。

**Files** 严格来说不是 MIME type，但在拖拽场景中，`DataTransfer.files` 会包含用户拖入的文件对象。每个文件有自己的 `type` 属性（比如 `application/pdf`），文件名和二进制内容都可以读取。

## 操作系统层面的剪贴板

MIME type 是 Web 世界的通用语言，但操作系统有自己的一套。

### Windows：OLE 与剪贴板格式

Windows 的剪贴板基于 OLE（Object Linking and Embedding）机制。系统预定义了一组剪贴板格式 ID，比如 `CF_TEXT`（1）对应纯文本，`CF_BITMAP`（2）对应位图，`CF_HDROP`（15）对应文件列表。

对于 HTML 内容，Windows 有一个特殊的 `HTML Format`（注册 ID 不同于标准格式）。它的数据不是裸 HTML，而是一个带版本号和偏移量的容器格式：

```
Version:1.0
StartHTML:0000000105
EndHTML:0000000350
StartFragment:0000000140
EndFragment:0000000315
<html>...<body>...<!--StartFragment-->...<!--EndFragment-->...</body></html>
```

偏移量字段告诉消费者 HTML 的哪一部分是实际内容（Fragment），哪一部分是上下文。这个格式在 Windows 应用之间交换 HTML 内容时广泛使用。

对于图片，Windows 使用 `CF_DIB`（Device Independent Bitmap）格式存储位图数据。它的结构是 BITMAPINFOHEADER 加像素数据，和 PNG 的压缩格式完全不同。

### macOS：NSPasteboard 与 UTType

macOS 的剪贴板底层是 NSPasteboard。和 Windows 的数字 ID 不同，macOS 使用字符串标识符，叫做 UTType（Uniform Type Identifier）。

常见的映射关系：

| UTType | 对应 MIME type | 说明 |
|--------|---------------|------|
| `public.utf8-plain-text` | text/plain | 纯文本 |
| `public.html` | text/html | HTML 内容 |
| `public.png` | image/png | PNG 图片 |
| `public.tiff` | image/tiff | TIFF 图片（macOS 截图默认格式） |
| `public.rtf` | text/rtf | 富文本 |
| `public.url` | text/uri-list | URL |

macOS 截图工具默认输出的是 TIFF 格式，这点经常让开发者困惑。当你在 Mac 上截图然后粘贴到网页时，浏览器需要把 `public.tiff` 转换成 `image/png` 才能在 `<img>` 标签中使用。

### Linux：X11 Selections 与 Wayland

Linux 的 X11 窗口系统用"选区"（selection）来实现剪贴板。有三种选区：PRIMARY（鼠标选中即复制，中键粘贴）、SECONDARY（很少用）、CLIPBOARD（Ctrl+C/Ctrl+V）。

X11 使用 atom（一个整数 ID）来标识数据类型，但本质上也是字符串。`UTF8_STRING` 对应纯文本，`text/html` 对应 HTML，`image/png` 对应 PNG 图片。

Wayland 的协议设计更现代，提供了 `wl_data_device_manager` 接口，但基本思路相同：客户端在数据提供方注册支持的 MIME type，消费者选择一个自己能处理的类型请求数据。

一个有趣的细节：X11 的剪贴板数据是按需传输的。复制时只是声明"我能提供以下格式"，真正粘贴时才建立进程间通信传输数据。这意味着如果复制源程序已经退出，你就粘贴不回来了。Wayland 攨持了持久化存储来缓解这个问题。

## 浏览器层面的剪贴板

浏览器是连接操作系统剪贴板和 Web 应用的桥梁，它需要做大量翻译工作。

### DataTransfer API

`DataTransfer` 最早是为拖拽（Drag and Drop）设计的，后来也被用在 `paste` 和 `copy` 事件中。它提供了两个关键接口：

```javascript
// 读取粘贴事件中的所有格式
element.addEventListener('paste', (event) => {
  const transfer = event.clipboardData;

  // 查看所有可用的 MIME type
  console.log(transfer.types);
  // 可能输出: ['text/plain', 'text/html', 'Files']

  // 按类型读取文本数据
  const html = transfer.getData('text/html');
  const text = transfer.getData('text/plain');

  // 读取文件
  if (transfer.files.length > 0) {
    const file = transfer.files[0];
    console.log(file.name, file.type, file.size);
  }
});
```

`DataTransfer` 的 `types` 属性返回一个字符串数组，列出当前剪贴板快照中所有可用的 MIME type。`getData()` 方法用于读取文本类型的数据。文件类型的数据需要通过 `files` 属性访问。

需要注意的是，`getData()` 只能读取文本类数据。如果你对 `image/png` 调用 `getData()`，会得到空字符串。图片数据只能通过 `files` 属性获取。

### ClipboardItem API

现代的 Async Clipboard API 引入了 `ClipboardItem`，它提供了更规范的多格式支持：

```javascript
// 读取剪贴板（需要用户授权）
const items = await navigator.clipboard.read();
for (const item of items) {
  console.log('可用类型:', item.types);

  if (item.types.includes('image/png')) {
    const blob = await item.getType('image/png');
    const url = URL.createObjectURL(blob);
    // 显示图片
  }

  if (item.types.includes('text/html')) {
    const blob = await item.getType('text/html');
    const html = await blob.text();
    // 处理 HTML
  }
}

// 写入剪贴板（支持多种格式）
await navigator.clipboard.write([
  new ClipboardItem({
    'text/plain': new Blob(['Hello'], { type: 'text/plain' }),
    'text/html': new Blob(['<b>Hello</b>'], { type: 'text/html' }),
  })
]);
```

`ClipboardItem` 的 `types` 属性返回 `readonly string[]`，`getType()` 返回对应 MIME type 的 `Blob` 对象。这意味着无论是文本还是二进制数据，都可以用统一的方式读取。

### 浏览器支持度差异

这里需要坦诚地说，浏览器之间的差异不小。

Chrome 对 Async Clipboard API 的支持最好，可以读写 `text/plain`、`text/html`、`image/png` 等格式。Firefox 只支持 `text/plain` 的异步读取，图片和 HTML 需要回退到 `paste` 事件的 `DataTransfer`。Safari 的支持介于两者之间，近年来进步很大，但仍然有一些边界情况。

写入剪贴板时，Chrome 要求 `ClipboardItem` 的所有值都是 `Blob`，且类型必须完全匹配。Safari 曾要求值是 `Promise<Blob>`（现已统一为 `Blob`）。这些不一致意味着你往往需要写兼容代码。

## 跨平台复制时发生了什么？

当你在 Mac 的 Chrome 里复制一段富文本，然后切换到 Windows 的 Word 里粘贴，中间经历了一系列格式转换。

首先，Chrome 调用操作系统的剪贴板 API，把内容以多种格式写入 NSPasteboard：`public.utf8-plain-text`、`public.html`，可能还有 `public.rtf`。如果剪贴板管理工具（如 Maccy、CopyQ）在运行，它还会额外抓取一份快照。

当你在 Windows 的 Word 里粘贴时，Word 会检查 Windows 剪贴板中可用的格式。如果跨平台同步工具（如 iCloud 剪贴板、Universal Clipboard）在工作，它会在后台把 Mac 的剪贴板数据转换成 Windows 格式。`public.html` 被转成 `HTML Format`，`public.utf8-plain-text` 被转成 `CF_TEXT`。

**哪些格式会丢失？** 图片格式最容易出问题。macOS 截图生成的是 TIFF，Windows 期望的是 DIB 或 PNG。如果中间的同步工具不做转换，图片数据就会丢失。RTF 格式在跨平台时也经常丢失，因为 Linux 和 macOS 对 RTF 的支持不如 Windows 普遍。自定义格式（比如 Photoshop 复制时写入的私有格式）几乎不可能跨平台。

## 开发者如何正确处理多种格式？

处理剪贴板数据的关键原则是：永远不要假设只有一种格式，永远做好降级准备。

### 优先级策略

接收粘贴数据时，按优先级从高到低尝试：

```javascript
function handlePaste(event) {
  const transfer = event.clipboardData;
  event.preventDefault();

  // 第一优先级：HTML（保留格式）
  const html = transfer.getData('text/html');
  if (html) {
    insertRichContent(html);
    return;
  }

  // 第二优先级：纯文本
  const text = transfer.getData('text/plain');
  if (text) {
    // 检测是否为 URL，自动转换
    if (/^https?:\/\//.test(text.trim())) {
      insertLink(text.trim());
    } else {
      insertPlainText(text);
    }
    return;
  }

  // 第三优先级：图片文件
  const files = Array.from(transfer.files);
  const image = files.find(f => f.type.startsWith('image/'));
  if (image) {
    uploadAndInsertImage(image);
    return;
  }
}
```

### 降级处理

写入剪贴板时，至少提供两种格式：

```javascript
async function copyRichContent(htmlContent, plainTextFallback) {
  // 优先使用现代 API
  if (navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainTextFallback], { type: 'text/plain' }),
        })
      ]);
      return;
    } catch {
      // Clipboard API 可能不支持某些 MIME type
    }
  }

  // 降级到 execCommand
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy');
  document.body.removeChild(container);
}
```

这段代码先尝试现代 API 同时写入 HTML 和纯文本。如果浏览器不支持（比如 Firefox 不支持通过 `ClipboardItem` 写入 HTML），就降级到 `execCommand`。降级方案利用了浏览器原生选中并复制的机制，虽然代码不够优雅，但胜在兼容性好。

## 总结

剪贴板的数据格式本质上是一个多表示的键值存储。MIME type 是 Web 层面的通用语言，但每个操作系统都有自己的原生格式：Windows 用数字 ID 和 `HTML Format` 容器，macOS 用 UTType 字符串，Linux 用 X11 atom。

浏览器夹在中间，承担了格式翻译的工作。`DataTransfer` 和 `ClipboardItem` 两套 API 提供了不同的访问方式，前者基于事件，后者基于异步 Promise。

对于开发者来说，需要记住三件事。剪贴板里永远不止一种格式，要按优先级读取。写入时至少提供 `text/plain` 和一种富格式作为兜底。跨平台场景下，只依赖 `text/plain` 和 `image/png` 这两种普遍支持的格式，其他格式随时可能丢失。

理解了这些，你在处理粘贴、拖拽、剪贴板读写时就不会被各种格式问题搞得焦头烂额了。
