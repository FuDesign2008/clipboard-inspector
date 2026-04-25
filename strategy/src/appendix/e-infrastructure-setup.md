# E. 基础设施搭建指南

本文档是附录 D 检查清单中"基础设施"部分的详细操作指南，涵盖三项 P0/P1 级别任务：PostHog 分析集成、Better Stack 可用性监控、以及 CI/CD 管线验证。

---

## 1. PostHog 分析集成

### 1.1 为什么选 PostHog

| 维度 | PostHog 免费版 | Google Analytics | Plausible |
|---|---|---|---|
| 月事件量 | 100 万 | 无限 | 1 万（$9/月起） |
| Session Replay | ✅ 含 | ❌ | ❌ |
| Error Tracking | ✅ 含 | ❌ | ❌ |
| 开源自托管 | ✅ 可选 | ❌ | ✅ 但需付费 |
| 数据所有权 | 完全自有 | Google 享有 | 完全自有 |

PostHog 免费版同时提供分析、错误追踪和 Session Replay，对一人公司的早期阶段是最佳选择。

### 1.2 注册步骤

1. 访问 [https://posthog.com/](https://posthog.com/)，点击 **Get started free**
2. 使用 GitHub 账号 SSO 登录（省去密码管理）
3. 登录后进入 **Project Settings → API Keys**
4. 记录两个值：
   - **Project API Key**（格式 `phc_xxxxxxxx`）
   - **API Host**（默认 `https://us.i.posthog.com`，EU 区域为 `https://eu.i.posthog.com`）

### 1.3 代码变更（index.html）

> ⚠️ **当前 index.html 第 46-48 行已包含占位 PostHog 代码，API Key 为 `phc_YOUR_PROJECT_API_KEY`。** 以下是需要替换的完整代码。

将 index.html 中第 45-48 行的 `<script>` 块替换为以下内容：

```html
<!-- PostHog Analytics: pageviews + session replay + error tracking -->
<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.full.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getSurveys getActiveMatchingSurveys captureException".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_REPLACE_WITH_YOUR_API_KEY', {
        api_host: 'https://us.i.posthog.com',
        capture_pageview: true,          // 自动追踪页面访问
        capture_pageleave: true,         // 追踪用户离开
        autocapture: true,               // 自动追踪按钮/链接点击
        disable_session_recording: false, // 启用 Session Replay
        persistence: 'localStorage+cookie',
        loaded: function(posthog) {
            console.log('PostHog loaded, distinct_id:', posthog.get_distinct_id());
        }
    });
</script>
```

**关键参数说明：**

| 参数 | 值 | 说明 |
|---|---|---|
| `api_host` | `https://us.i.posthog.com` | 注册时选择 US 或 EU 区域 |
| `array.full.js` | 使用 `.full.js` 而非 `.js` | `.full.js` 包含 Session Replay 录制功能 |
| `capture_pageview` | `true` | 自动追踪每次页面加载 |
| `capture_pageleave` | `true` | 记录用户何时离开，计算停留时长 |
| `autocapture` | `true` | 自动追踪 `<button>` 和 `<a>` 点击事件 |
| `disable_session_recording` | `false` | 启用 Session Replay（免费版包含） |
| `crossOrigin` | `"anonymous"` | 确保 CDN 缓存友好 |

### 1.4 替换后 index.html 完整结构参考

```html
    <!-- 在 </body> 前，已有的 <script src="./index.js"> 之后 -->
    <script type="text/javascript" src="./index.js"></script>
    <!-- PostHog Analytics -->
    <script>
        !function(t,e){...}(document,window.posthog||[]);
        posthog.init('phc_你的真实API_KEY', { ... });
    </script>
</body>
</html>
```

### 1.5 自定义事件追踪（可选）

PostHog 初始化后，可在业务代码中追踪自定义事件。例如在 `src/index.tsx` 或 `src/ClipboardInspector.tsx` 中：

```typescript
// 追踪粘贴事件
declare global {
    interface Window {
        posthog?: {
            capture: (event: string, properties?: Record<string, unknown>) => void;
        };
    }
}

// 当用户粘贴内容时
window.posthog?.capture('clipboard_paste', {
    mime_types: entries.map(e => e.type),
    entry_count: entries.length,
    has_files: entries.some(e => e.kind === 'file'),
});

// 当用户导出时
window.posthog?.capture('export_download', {
    format: 'markdown', // or 'zip'
    entry_count: entries.length,
});
```

### 1.6 验证集成

1. 本地启动：`npm run start`
2. 打开浏览器开发者工具 → Network 标签
3. 筛选 `posthog` 或 `i.posthog.com`
4. 确认有 `e`（event）请求发送到 PostHog 服务器
5. 登录 PostHog 控制台 → **Activity → Live events**，确认事件已到达

---

## 2. Better Stack 可用性监控

### 2.1 为什么选 Better Stack

| 维度 | Better Stack 免费版 | UptimeRobot 免费版 | Pingdom |
|---|---|---|---|
| 监控数量 | 10 个 | 50 个 | 1 个 |
| 检查频率 | 3 分钟 | 5 分钟 | 1 分钟 |
| 状态页面 | ✅ 含 | ✅ 含 | ❌ |
| 告警渠道 | Email + Slack + 90+ | Email | Email |
| 团队成员 | 1 人 | 无限制 | 1 人 |

Better Stack 免费版提供 3 分钟检查间隔和精美状态页面，对静态站点监控完全足够。

### 2.2 注册步骤

1. 访问 [https://betterstack.com/](https://betterstack.com/)，点击 **Sign up free**
2. 使用 GitHub 账号登录
3. 进入 **Uptime → Monitors** 面板

### 2.3 创建监控

**Step 1: 基本设置**

| 字段 | 值 |
|---|---|
| URL to monitor | `https://fudesign2008.github.io/clipboard-inspector/` |
| Monitor name | `Clipboard Inspector Production` |
| Monitor type | `HTTP(s)` （默认） |

**Step 2: 检查条件**

| 字段 | 值 |
|---|---|
| Check frequency | **3 minutes**（免费版最短间隔） |
| Expected status code | `200` |
| Request method | `HEAD`（更快，无需下载完整页面） |
| SSL certificate check | ✅ 启用 |
| Follow redirects | ✅ 启用 |

**Step 3: 告警设置**

| 字段 | 值 |
|---|---|
| Escalation | 选择你的邮箱（默认） |
| Additional channels | 可选：Slack webhook、Discord webhook 等 |

**Step 4: 高级设置（可选）**

| 字段 | 值 |
|---|---|
| Regions | 至少选择 2 个区域（如 `US East` + `Europe`） |
| Response time threshold | `5000ms`（静态页面应 < 3s） |
| Confirmation attempts | `2`（连续 2 次失败才触发告警，避免误报） |

**Step 5: 点击 Create monitor**

### 2.4 配置状态页面

1. 进入 **Uptime → Status pages**
2. 点击 **Create status page**
3. 配置：

| 字段 | 值 |
|---|---|
| Status page name | `Clipboard Inspector Status` |
| URL slug | `clipboard-inspector`（最终 URL: `https://clipboard-inspector.statuspage.io`） |
| Monitor | 选择刚创建的 `Clipboard Inspector Production` |

4. 记录状态页面 URL，可添加到项目 README 或网站 footer

### 2.5 验证监控

1. 在 Better Stack 控制台查看首次检查结果
2. 确认状态为 **UP**（绿色）
3. 可手动测试：临时将 URL 改为不存在的路径，确认告警邮件能收到

---

## 3. CI/CD 管线验证

### 3.1 当前管线结构

项目已有完整的 CI/CD 配置，包含两个 workflow 文件：

```
.github/workflows/
├── ci-cd.yml      ← 主管线：verify → deploy
└── codeql.yml     ← 安全扫描：CodeQL 分析
```

### 3.2 ci-cd.yml 管线详情

**触发条件：**
- `push` 到 `main` 分支
- `pull_request` 目标为 `main`
- 手动触发（`workflow_dispatch`）

**并发控制：**
- 同一分支/PR 的重复运行自动取消（`cancel-in-progress: true`）

**Job 1: `verify`**（所有触发条件都执行）

```
┌─────────────────────────────────────────┐
│  Checkout (actions/checkout@v4)          │
│       ↓                                  │
│  Setup Node.js 20.x (actions/setup-node)│
│       ↓                                  │
│  npm ci                                  │
│       ↓                                  │
│  npm run typecheck     ← TypeScript 严格模式检查
│       ↓                                  │
│  npm run lint          ← ESLint 9 flat config
│       ↓                                  │
│  npm run test:run      ← Vitest 单元测试
│       ↓                                  │
│  npm run build         ← esbuild 打包
│       ↓                                  │
│  Upload artifact (index.html + index.js + style.css)
└─────────────────────────────────────────┘
```

**Job 2: `deploy`**（仅在 push to main 时执行）

```
┌─────────────────────────────────────────┐
│  depends: verify (必须全部通过)           │
│  condition: push to main                 │
│       ↓                                  │
│  Download build artifact → _site/        │
│       ↓                                  │
│  Upload Pages artifact                   │
│       ↓                                  │
│  Deploy to GitHub Pages (deploy-pages@v4)│
└─────────────────────────────────────────┘
```

### 3.3 codeql.yml 管线详情

**触发条件：**
- `push` 到 `main`
- `pull_request` 到 `main`
- 每周一 06:21 UTC 定时扫描

**功能：** 使用 GitHub CodeQL 进行 `javascript-typescript` 语言的安全和代码质量分析（`security-and-quality` 查询套件）。

### 3.4 管线评估

| 检查项 | 状态 | 说明 |
|---|---|---|
| typecheck → lint → test → build 顺序 | ✅ 已配置 | 严格按序执行 |
| 部署前置条件 | ✅ 已配置 | `needs: verify` + main 分支检查 |
| 并发控制 | ✅ 已配置 | 同一 PR 不重复运行 |
| 制品管理 | ✅ 已配置 | build artifact 保留 1 天 |
| 安全扫描 | ✅ 已配置 | CodeQL 周扫描 |
| Pages 部署权限 | ✅ 已配置 | `pages: write` + `id-token: write` |
| 缓存优化 | ✅ 已配置 | `cache: npm` |

**结论：CI/CD 管线完整且配置合理，无需修改。** 唯一可优化项是在验证 job 中缓存 esbuild 产物以加速 PR 检查，但当前项目构建速度极快（静态站点），优化收益可以忽略。

---

## 4. 操作清单

按执行顺序排列：

- [ ] **Step 1** 注册 PostHog → 获取 API Key（10 分钟）
- [ ] **Step 2** 替换 index.html 中 `phc_YOUR_PROJECT_API_KEY` 为真实 Key（2 分钟）
- [ ] **Step 3** 本地验证 PostHog 事件发送（5 分钟）
- [ ] **Step 4** 提交代码，触发 CI/CD 自动部署（等待 ~3 分钟）
- [ ] **Step 5** 注册 Better Stack → 创建监控（10 分钟）
- [ ] **Step 6** 配置状态页面，记录 URL（5 分钟）
- [ ] **Step 7** 验证 Better Stack 首次检查成功（2 分钟）
- [ ] **Step 8** 将 PostHog API Key 迁移到 GitHub Secrets（可选，但推荐）

**总耗时：约 35 分钟。全部免费。**

---

## 5. 安全注意事项

### 5.1 PostHog API Key 安全

PostHog 的 Project API Key 是**公开 key**，设计上可暴露在前端代码中（类比 Google Analytics 的 tracking ID）。它只能发送事件，不能读取数据。但建议：

1. **不要将 API Key 硬编码在版本控制中** — 使用环境变量或构建时注入
2. 在 PostHog 控制台设置 **Allowed domains**，限制 Key 只能在你的域名上使用
3. 对于纯静态站点（GitHub Pages），由于没有构建步骤注入环境变量，硬编码是可接受的折中

### 5.2 敏感 Key 管理

如果未来需要管理更多密钥（LemonSqueezy、自定义域名等），建议：

1. 使用 GitHub Secrets 存储所有密钥
2. 在 CI/CD 中通过 sed 或 envsubst 替换占位符
3. 或迁移到 Cloudflare Pages，它原生支持构建时环境变量注入

---

## 参考链接

- [PostHog 文档 - JavaScript 安装](https://posthog.com/docs/libraries/js)
- [PostHog 文档 - Session Replay](https://posthog.com/docs/session-replay)
- [PostHog JS 源码](https://github.com/posthog/posthog-js)
- [Better Stack 文档 - 创建监控](https://betterstack.com/docs/uptime/monitoring-start/)
- [Better Stack 文档 - 检查频率](https://betterstack.com/docs/uptime/check-frequency)
- [Better Stack API 文档](https://betterstack.com/docs/uptime/api/create-a-new-monitor)
