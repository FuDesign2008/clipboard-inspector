---
title: "剪贴板安全：网站是如何读取你剪贴板内容的？"
date: 2026-04-25
tags: [剪贴板安全, clipboard security, 剪贴板劫持, clipboard hijacking, 浏览器安全, 前端安全]
description: "深入分析浏览器剪贴板 API 的安全机制，演示剪贴板劫持攻击场景，并提供开发者可落地的检测与防范方案。"
keywords: "剪贴板安全, clipboard security, 剪贴板劫持, clipboard hijacking, 浏览器安全, Clipboard API, 剪贴板读取"
---

# 剪贴板安全：网站是如何读取你剪贴板内容的？

## 你刚复制了密码，打开一个网站，它知道吗？

场景很常见：你从密码管理器里复制了一串密码，切到浏览器打开一个新标签页。几秒之内，剪贴板里躺着的就是你的邮箱口令、银行密码或者 API Key。

问题来了：那个新打开的网页，能不能偷偷读到你的剪贴板？

答案是：**看情况，但比你以为的更容易**。

这不是危言耸听。浏览器的剪贴板 API 经历了多次迭代，从早期的 `document.execCommand('paste')` 到如今的 Clipboard API，权限边界一直在变。理解这些边界，是每个开发者的必修课。

---

## 浏览器剪贴板 API 的能力范围

现代浏览器提供了两套剪贴板操作接口。

### 旧方案：`document.execCommand`

```javascript
// 已废弃，但在某些浏览器中仍然可用
document.execCommand('copy');  // 复制选中内容
document.execCommand('paste'); // 粘贴（多数浏览器已拦截）
```

这套 API 设计粗糙，安全模型模糊。`execCommand('copy')` 通常能静默执行，而 `execCommand('paste')` 在主流浏览器中已被拦截。但它的存在说明了一件事：浏览器很早就暴露了剪贴板操作能力。

### 新方案：Clipboard API

```javascript
// 读取剪贴板
const text = await navigator.clipboard.readText();

// 读取富内容（图片、HTML 等）
const items = await navigator.clipboard.read();

// 写入剪贴板
await navigator.clipboard.writeText('hello');
```

Clipboard API 是目前的标准方案。它承诺了两件事：

1. **必须由用户手势触发**。不能在页面加载时偷偷调用，必须绑定到点击、按键等用户主动操作上。
2. **需要权限授权**。`clipboard-read` 权限需要用户明确同意，浏览器会弹出权限提示。

听起来很安全。但实际执行中，有几个容易被忽视的缝隙。

---

## 权限模型：什么时候网站可以读取剪贴板？

浏览器的剪贴板权限模型大致遵循以下规则：

### 读取（read）

| 条件 | 行为 |
|------|------|
| 没有用户手势 | 直接拒绝，Promise reject |
| 有用户手势 + 首次请求 | 弹出权限提示框 |
| 用户点击「允许」 | 后续调用不再提示，直接返回数据 |
| 用户点击「拒绝」 | 后续调用直接拒绝 |
| HTTPS + 已授权 | 静默读取 |

关键问题出在最后一行。**一旦用户点击了「允许」，该域名下的后续所有读取请求都不会再弹窗**。这意味着：

- 用户在一个有剪贴板功能的在线文档上点了「允许」
- 同域名下的其他页面可以静默读取剪贴板
- 如果这个域名有 XSS 漏洞，攻击者拿到的不只是页面数据，还有剪贴板内容

### 写入（write）

写入的门槛低得多。`writeText` 在多数浏览器中只需要用户手势，不需要额外权限授权。这让 **剪贴板劫持** 变得非常容易。

---

## 攻击场景：剪贴板劫持演示

剪贴板劫持（clipboard hijacking）是一种攻击手法：用户以为自己复制了 A，实际剪贴板里被悄悄替换成了 B。

最常见的场景是加密货币地址替换：

```javascript
// 用户选中了一个比特币地址，准备 Ctrl+C 复制
// 恶意网站的隐藏脚本监听 copy 事件
document.addEventListener('copy', function(e) {
  // 用户复制的是：1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
  // 被替换成攻击者的地址：
  e.clipboardData.setData('text/plain', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
  e.preventDefault();
});
```

用户不会察觉任何异常。复制操作看起来一切正常，粘贴时才发现地址不对，但很多人根本不会检查粘贴内容。

更隐蔽的变体是 **延迟替换**：

```javascript
// 不拦截 copy 事件，而是监听用户复制后的操作
document.addEventListener('copy', function() {
  // 等用户松开按键后，静默覆盖剪贴板
  setTimeout(() => {
    navigator.clipboard.writeText('malicious-content-replaced');
  }, 100);
});
```

这类攻击不需要读取权限，只需要写入能力。而写入，几乎所有现代浏览器都放行了。

---

## 如何检测和防范

知道了攻击手段，接下来是怎么防。对开发者来说，检测和防护要分层来做。

### 检测：你的网站有没有被注入剪贴板监听？

如果你维护的是一个复杂的前端应用，想知道页面中是否有脚本在监听剪贴板事件，可以用 [Clipboard Inspector](https://github.com/fuyg/clipboard-inspector) 进行检测。

Clipboard Inspector 的核心思路很简单：

1. 注册你自己的 `copy`/`paste`/`cut` 事件监听器
2. 执行一次剪贴板操作
3. 检查 `event.defaultPrevented` 是否为 `true`，以及 `clipboardData` 是否被篡改

它的使用方式也很直接，在你的页面中引入后，它会生成一份报告，列出所有对剪贴板事件的拦截和修改行为。对于排查第三方脚本（广告 SDK、统计分析工具）是否有越权的剪贴板操作，非常实用。

### 防护：开发者侧

```javascript
// 1. 在关键输入框上阻止 paste 事件的默认行为，自己做校验
passwordInput.addEventListener('paste', function(e) {
  e.preventDefault();
  const pastedText = e.clipboardData.getData('text/plain');
  // 校验逻辑
  if (isValidInput(pastedText)) {
    this.value = pastedText;
  }
});

// 2. 监听 copy 事件，确保不被篡改
document.addEventListener('copy', function(e) {
  // 如果有其他脚本调用了 preventDefault，记录下来
  setTimeout(() => {
    if (e.defaultPrevented) {
      console.warn('剪贴板操作被拦截，可能存在恶意脚本');
      // 上报异常
    }
  }, 0);
}, true); // 使用捕获阶段，优先级更高
```

---

## 最佳实践

### 对普通用户

1. **不要随意授予剪贴板权限**。浏览器弹出权限请求时，看清来源域名，不确定就拒绝。
2. **复制敏感信息后尽快粘贴并清空**。密码、Token 这类内容不要在剪贴板里停留太久。
3. **粘贴后检查内容**。尤其是加密货币地址、银行账号，粘贴后和复制源对比一下。
4. **使用 HTTPS 网站**。Clipboard API 在非 HTTPS 环境下行为不一致，部分浏览器直接禁用。

### 对开发者

1. **最小权限原则**。你的应用如果只需要写入，就不要申请读取权限。
2. **用户手势绑定**。所有剪贴板操作必须绑在明确的用户交互上，不要搞"聪明"的自动化。
3. **审计第三方脚本**。广告 SDK、统计代码是剪贴板劫持的高发区域。用检测工具定期扫描。
4. **权限策略（Permissions Policy）**。通过 HTTP Header 限制子 frame 的剪贴板访问：

```
Permissions-Policy: clipboard-read=(), clipboard-write=(self)
```

这行配置能阻止同页面中嵌入的第三方 iframe 读写剪贴板。

5. **CSP 策略**。严格的 Content Security Policy 能降低 XSS 导致的剪贴板数据泄露风险。

---

## 总结

剪贴板是操作系统级别共享资源，它的安全边界天然模糊。浏览器通过权限模型和用户手势约束做了基本防护，但缝隙仍在：

- 权限一旦授予，后续读取不再提示
- 写入几乎无门槛，劫持攻击成本低
- 第三方脚本是最大的不可控变量

作为开发者，了解这些边界不是为了制造恐慌，而是为了在设计和开发中做出正确的安全决策。对普通用户而言，养成粘贴后检查内容的习惯，比任何技术手段都管用。

如果你对剪贴板安全检测有兴趣，可以试试 [Clipboard Inspector](https://github.com/fuyg/clipboard-inspector)，一个轻量的剪贴板行为检测工具。
