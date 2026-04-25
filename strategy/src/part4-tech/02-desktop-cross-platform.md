# 4.2 桌面端与跨平台技术路径

Web 端的 Clipboard API 受到浏览器安全沙箱的限制，很多底层能力（自定义 MIME 类型、实时监听、系统级剪贴板历史）都无法实现。当产品需要突破这些限制时，桌面应用是自然的技术延伸。

这一章对比 Electron 和 Tauri 两条桌面端路径，梳理操作系统级别的剪贴板 API 能力，并给出推荐方案。

## Electron vs Tauri 对比

| 维度 | Electron | Tauri v2 |
|------|----------|----------|
| 包体积 | ~300MB | ~6MB |
| 内存占用 | 高（Chromium 进程开销） | 低 |
| 剪贴板 API | 完整（`availableFormats`, `readBuffer` 等） | 通过 plugin-clipboard-manager |
| 系统访问 | 完整 Node.js | Rust FFI |
| 更新机制 | 内置 autoUpdater | 需额外配置 |
| 生态成熟度 | 非常成熟（VS Code, Slack, Discord） | 快速增长中 |
| 开发语言 | JavaScript/TypeScript | Rust + Web 前端 |
| 进程模型 | 多进程（主进程 + 渲染进程） | 单进程 + WebView |
| 跨平台 | Windows, macOS, Linux | Windows, macOS, Linux, iOS, Android |
| 原生菜单/托盘 | 完整支持 | 支持 |
| 打包工具 | electron-builder / electron-forge | 内置 |
| 社区规模 | 120k+ GitHub Stars | 85k+ GitHub Stars |

### 关键差异解读

**包体积**是两者最显眼的差距。Electron 应用自带完整的 Chromium 渲染引擎和 Node.js 运行时，最小包体积也在 300MB 左右。Tauri 使用操作系统自带的 WebView（Windows 上的 WebView2，macOS 上的 WKWebView），加上 Rust 编译后的原生二进制，包体积极小。对于剪贴板工具这种常驻后台的应用，6MB 的包体积差异会直接影响用户的安装意愿。

**内存占用**同样重要。剪贴板工具通常需要常驻后台运行，Electron 的 Chromium 进程即使空闲状态下也会占用 100MB+ 内存。Tauri 使用系统 WebView，内存占用可控得多。

**剪贴板 API**方面，Electron 提供了更完整的底层访问。`clipboard.availableFormats()` 可以列出所有注册的格式，`clipboard.readBuffer(format)` 可以读取任意格式的原始二进制数据。Tauri 通过社区插件 `plugin-clipboard-manager` 提供类似能力，功能覆盖面在快速赶上。

### 成功案例

已有多个剪贴板工具选择了 Tauri：

- **AlgerClipboard**：基于 Tauri 的跨平台剪贴板管理器，支持历史记录、快捷键、多种格式预览
- **Beetroot**：Tauri 构建的剪贴板工具，专注于代码片段管理

这些案例证明 Tauri 完全能胜任剪贴板工具的开发需求。

## 推荐路径：Tauri v2

基于以下理由，推荐 Tauri v2 作为桌面端技术方案：

### 优势分析

**1. 体量与性能**

剪贴板工具需要用户愿意常驻运行。300MB 的 Electron 应用会让很多用户犹豫，6MB 的 Tauri 应用则几乎无感。启动速度上 Tauri 也明显更快，冷启动通常在 1 秒以内。

**2. Rust 的安全性**

剪贴板内容经常包含敏感信息（密码、Token、个人信息）。Rust 的内存安全保证减少了数据泄露的风险。相比 Electron 中 JavaScript 的动态类型，Rust 的类型系统在处理二进制剪贴板数据时更可靠。

**3. 原生剪贴板 API 访问**

Tauri 通过 Rust 直接调用操作系统 API，不存在浏览器的安全沙箱限制。可以自由读取所有格式的剪贴板数据，包括自定义 MIME 类型和专有格式。

### 可用的社区插件

`clipboard-next` 是 Tauri 生态中功能最完善的剪贴板插件：

| 功能 | API |
|------|-----|
| 文本读写 | `readText()` / `writeText()` |
| HTML 读写 | `readHtml()` / `writeHtml()` |
| RTF 读写 | `readRtf()` / `writeRtf()` |
| 图片读写 | `readImage()` / `writeImage()` |
| 文件读写 | `readFiles()` / `writeFiles()` |
| 变更监听 | `startWatch()` / `onClipboardChange()` |
| 内容检测 | `hasText()` / `hasHtml()` / `hasImage()` / `hasFiles()` |

这套 API 覆盖了剪贴板工具最核心的需求。`onClipboardChange()` 回调可以实现 Web 端 `clipboardchange` 事件的功能，且在所有操作系统上都可用。

## 操作系统级剪贴板 API

理解底层 API 有助于评估功能的跨平台可行性和差异。

### macOS: NSPasteboard

macOS 的 `NSPasteboard` 是设计最优雅的剪贴板 API：

- **多 Pasteboard**：系统维护多个 pasteboard，最常用的是通用 pasteboard（`NSGeneralPboard`）。还有查找 pasteboard（搜索框共享）、拖拽 pasteboard 等
- **自定义类型**：通过 `UTType` 系统支持任意自定义数据类型
- **changeCount**：通过 `changeCount` 属性检测剪贴板内容变化，不需要轮询
- **延迟渲染**：数据提供者可以在粘贴时才生成实际内容（`promiseDataProvider`）

```rust
// Rust 通过 cocoa 绑定访问 NSPasteboard
use cocoa::appkit::NSPasteboard;
let pb = unsafe { NSPasteboard::generalPasteboard(nil) };
let change_count = unsafe { pb.changeCount() };
```

### Windows: Win32 Clipboard API

Windows 的剪贴板 API 历史悠久，功能完整：

- **注册格式**：通过 `RegisterClipboardFormat` 注册自定义格式，格式 ID 范围从 `0xC000` 到 `0xFFFF`
- **延迟渲染**：`SetClipboardData` 传入 `NULL`，在 `WM_RENDERFORMAT` 消息中按需提供数据
- **剪贴板链**：`SetClipboardViewer` 或 `AddClipboardFormatListener` 监听变化
- **剪贴板历史**：Windows 10+ 内置剪贴板历史（Win+V），第三方应用可以通过 API 访问

```rust
// Windows 剪贴板监听
AddClipboardFormatListener(hwnd);
// 处理 WM_CLIPBOARDUPDATE 消息
```

### Linux X11: XA_CLIPBOARD

X11 的剪贴板机制基于选择（selection）协议：

- **XA_CLIPBOARD**：X11 使用 `XA_CLIPBOARD` 原子作为主剪贴板（不同于 XA_PRIMARY，即鼠标选中即复制的那个）
- **targets 协商**：粘贴方请求 `TARGETS`，复制方返回支持的格式列表
- **incr 协议**：大数据通过 `INCR`（incremental）协议分块传输
- **剪贴板管理器**：需要 `clipboard-manager` 守护进程来持久化剪贴板内容

X11 的剪贴板机制比较复杂，但灵活性极高。理论上可以传输任意类型的数据。

### Linux Wayland: wl_data_device_manager

Wayland 协议更现代也更简单：

- **wl_data_device_manager**：管理数据传输的全局接口
- **wl_data_offer**：表示一个数据传输提议，包含可用的 MIME 类型
- **安全模型**：Wayland 更严格，客户端无法窥探其他客户端的剪贴板内容（除非获得焦点）

Wayland 的安全模型对剪贴板工具有一定限制。后台监听剪贴板变化在 Wayland 下需要特殊处理（如通过 xdg-desktop-portal）。

### 跨平台差异总结

| 能力 | macOS | Windows | Linux X11 | Linux Wayland |
|------|-------|---------|-----------|---------------|
| 自定义格式 | 完整 | 完整 | 完整 | 完整 |
| 变更检测 | changeCount | WM_CLIPBOARDUPDATE | XFixes 事件 | 有限 |
| 后台监听 | 可以 | 可以 | 可以 | 受限 |
| 多格式同时读取 | 可以 | 可以 | 可以 | 可以 |
| 延迟渲染 | 原生支持 | 原生支持 | 通过管理器 | 协议支持 |

## 技术结论

桌面端选择 Tauri v2 的理由很充分：轻量、安全、Rust 原生 API 访问、社区插件成熟。Web 端积累的 React 组件和业务逻辑可以直接复用，Rust 层负责系统级剪贴板操作。

不过桌面端不是第一步。Web 端先验证核心假设（开发者是否真的需要这个工具），确认后再投入桌面端的开发。Tauri 的一个好处是前端代码可以几乎原封不动地搬过来，Web 端的工作不会浪费。
