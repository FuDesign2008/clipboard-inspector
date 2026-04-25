# 7.1 托管平台对比与选型

Clipboard Inspector 是一个纯静态的 Web 应用（index.html + index.js + style.css），不需要服务器端渲染或数据库。这类应用的托管选择看似简单，但不同平台在免费层额度、CDN 覆盖、构建流程和扩展能力上差异显著。选错平台不会导致项目失败，但会在后续的功能迭代中制造不必要的摩擦。

## 当前状态

项目目前部署在 GitHub Pages 上，通过 `.github/workflows/deploy.yml` 实现 main 分支推送后自动构建和发布。这个方案的运行成本为零，对当前阶段完全够用。

| 指标 | 当前值 | 备注 |
|------|--------|------|
| 托管平台 | GitHub Pages | 免费 |
| 月度流量 | 未知（未接入分析） | 预计 < 1 GB/mo |
| 构建产物 | 3 个静态文件 | index.html, index.js, style.css |
| 自定义域名 | 未启用 | 使用 .github.io 子域 |
| HTTPS | 自动 | Let's Encrypt |
| 停机时间 | 未监控 | GitHub Pages SLA 无官方承诺 |

> GitHub Pages 官方文档：https://docs.github.com/en/pages

## 主流平台免费层对比

以下数据基于各平台 2026 年 4 月的公开定价页面。免费层的限制直接影响项目能承载的用户规模和功能扩展空间。

| 特性 | GitHub Pages | Cloudflare Pages | Netlify | Vercel Hobby |
|------|-------------|-----------------|---------|-------------|
| 费用 | $0 | $0 | $0 | $0 |
| 带宽限制 | 100 GB/月（软限制） | 无限制 | ~15 GB 实际可用 | 100 GB/月 |
| 构建次数/月 | 无限制 | 500 次 | ~20 次生产部署 | 6,000 分钟 |
| 自定义域名 | 免费 | 免费 | 免费 | 免费 |
| SSL 证书 | 自动（Let's Encrypt） | 自动（Cloudflare） | 自动（Let's Encrypt） | 自动（Let's Encrypt） |
| CDN 节点 | GitHub CDN（Fastly） | 300+ 位置 | 内置 CDN | 100+ 位置（Vercel Edge） |
| SPA 路由 | 需要 404.html hack | 自动 | _redirects 配置 | 自动 |
| 预览部署 | 不支持 | 支持 | 支持（0 credits） | 支持 |
| Serverless 函数 | 不支持 | 支持（Workers） | 支持（Functions） | 支持（Serverless Functions） |
| 构建时间限制 | 10 分钟 | 20 分钟 | 15 分钟 | 10 分钟 |
| 团队协作 | GitHub 原生 | 通过 Cloudflare Teams | Netlify Teams | Vercel Teams（Hobby 有限） |

> 数据来源：GitHub Pages 文档（https://docs.github.com/en/pages），Cloudflare Pages 文档（https://developers.cloudflare.com/pages/），Netlify 计费说明（https://docs.netlify.com/manage/accounts-and-billing/billing/），Vercel 定价页（https://vercel.com/docs/plans/hobby）

## 关键维度深入分析

### 带宽与流量上限

带宽是最容易触碰的免费层天花板。一旦某个功能在社交媒体上被传播，流量可能在几小时内翻几倍。

GitHub Pages 的 100 GB/月是软限制，意味着超量后不会立即断线，但可能收到 GitHub 的通知。对于纯静态站点，100 GB 大约能支撑 50 万次页面访问（按每次访问传输 ~200 KB 计算），在项目早期绰绰有余。

Cloudflare Pages 的无限制带宽是压倒性优势。Cloudflare 的商业模式建立在"吸引流量到我们的网络"之上，对静态站点几乎不计成本。这意味着即使遇到流量峰值也不用担心账单。

Netlify 的免费层带宽曾是 100 GB/月，但近两年持续收缩。目前的"构建时间 300 分钟/月"限制间接约束了带宽，因为频繁构建会消耗配额。实际可用带宽大约在 10-15 GB/月。

Vercel Hobby 层提供 100 GB/月带宽，与 GitHub Pages 持平。但 Vercel 的 Serverless Functions 调用次数限制（无限制但执行时间受限）可能影响需要 API 路由的场景。

### 构建能力与 CI/CD 集成

构建限制对开发效率的影响容易被低估。频繁的提交和 PR 会消耗构建配额，一旦耗尽就只能等下个月重置。

| 平台 | 构建/月 | 适用场景 |
|------|---------|---------|
| GitHub Pages | 无限制 | 高频迭代，大量 PR |
| Cloudflare Pages | 500 次 | 中等频率迭代 |
| Netlify | ~20 次生产部署 | 低频发布 |
| Vercel | 6,000 分钟 | 高频迭代，但受限于单次 10 分钟 |

GitHub Pages 的无限制构建对开源项目特别友好。每次 PR 都可以触发 CI 验证，不用担心配额。

Cloudflare Pages 的 500 次/月在正常开发节奏下足够用（平均每天 16 次构建），但在密集迭代期可能紧张。

Netlify 的 ~20 次生产部署限制意味着平均每周只能部署 5 次。对于生产发布来说够用，但 PR 预览也会消耗配额。

### SPA 路由支持

Clipboard Inspector 作为单页应用，路由支持是硬性要求。GitHub Pages 不原生支持 SPA 路由，需要通过 404.html hack 来模拟。具体做法是把 404.html 的内容设为与 index.html 相同，让所有未匹配的路径都返回主页面。

这个 hack 可行但不优雅。如果将来需要真正的服务端路由（如为每个分享链接生成独立的 meta tag），就需要迁移到支持路由重写的平台。

### Serverless 函数扩展

免费静态托管会在某条线前止步：当你需要服务端逻辑时。API 端点、短链接生成、用户反馈收集等功能都需要 Serverless 函数。

| 平台 | 函数支持 | 免费层限制 | 运行时 |
|------|---------|-----------|--------|
| GitHub Pages | 不支持 | N/A | N/A |
| Cloudflare Pages | Workers | 100,000 请求/天 | V8（非 Node.js） |
| Netlify | Functions | 125,000 请求/月 | Node.js |
| Vercel | Serverless Functions | 无限制 Hobby | Node.js |

Cloudflare Workers 的 100,000 请求/天（约 300 万/月）远超 Netlify 的 125,000/月。但 Workers 使用 V8 运行时而非 Node.js，部分 npm 包无法直接使用。

## mdBook 子目录部署方案

Clipboard Inspector 的策略文档使用 mdBook 构建，同样需要部署。最经济的方案是将 mdBook 输出作为静态站点的子目录部署。

### GitHub Pages 方案

```
clipboard-inspector/
├── docs/           # mdBook 输出目录（或 _site/）
│   └── strategy/   # 手动放置
├── index.html      # 应用主页
├── index.js
└── style.css
```

在 `deploy.yml` 中增加 mdBook 构建步骤：

```yaml
- name: Build mdBook
  uses: peaceiris/actions-mdbook@v2
  with:
    mdbook-version: 'latest'

- name: Build strategy book
  run: mdbook build strategy/

- name: Prepare site directory
  run: |
    mkdir -p _site
    cp index.html index.js style.css _site/
    cp -r strategy/book _site/strategy
```

### Cloudflare Pages 方案

Cloudflare Pages 的构建命令配置：

```
构建命令: npm run build && npx mdbook build strategy/
输出目录: _site
```

Cloudflare 会自动处理子目录路由，无需额外配置。

### Netlify 方案

在项目根目录创建 `netlify.toml`：

```toml
[build]
  command = "npm run build && mdbook build strategy/"
  publish = "_site"

[[redirects]]
  from = "/strategy/*"
  to = "/strategy/:splat"
  status = 200
```

## 迁移决策框架

用决策矩阵量化评估每个平台的综合得分：

| 权重因子 | 权重 | GitHub Pages | Cloudflare Pages | Netlify | Vercel |
|----------|------|-------------|-----------------|---------|--------|
| 带宽慷慨度 | 25% | 7 | 10 | 4 | 7 |
| 构建配额 | 20% | 10 | 8 | 4 | 8 |
| SPA 路由 | 10% | 4 | 10 | 8 | 10 |
| Serverless 扩展 | 15% | 0 | 9 | 7 | 8 |
| 迁移成本 | 15% | 10 | 6 | 5 | 5 |
| CDN 性能 | 10% | 7 | 9 | 7 | 8 |
| 生态与社区 | 5% | 9 | 7 | 8 | 9 |
| **加权总分** | **100%** | **7.15** | **8.55** | **5.85** | **7.45** |

> 评分说明：10 分制，10 为最优。迁移成本反映从当前 GitHub Pages 迁移到该平台的复杂度，当前平台天然得最高分。

## 推荐路径

基于以上分析，推荐的托管演进路径分三步：

**第一阶段（当前）：GitHub Pages。** 零成本、零迁移、无限制构建。在月流量低于 50 GB、不需要 Serverless 函数的阶段，没有理由离开。

**第二阶段（用户增长后）：Cloudflare Pages。** 当以下任一条件触发时考虑迁移：

- 月流量接近 50 GB
- 需要 Serverless API（如分享链接、用户反馈）
- 需要 PR 预览部署来加速 review 流程

迁移到 Cloudflare Pages 的核心收益是无限制带宽和 Workers 函数。迁移成本约为半天工作量（修改构建配置、更新 DNS 记录）。

**第三阶段（商业化后）：Cloudflare Pages + 自定义基础设施。** 如果商业化路径需要更复杂的服务端逻辑，可以在 Cloudflare Workers 上构建 API 层，同时保持静态资源托管在 Pages 上。这个架构可以支撑到日均百万请求的规模。

不推荐 Netlify 和 Vercel 作为长期托管方案。Netlify 的免费层在持续收缩，Vercel 的定价模式在 Hobby 之上跳变幅度大（Pro 层 $20/用户/月）。对于一人公司来说，Cloudflare 的免费层是最可持续的选择。
