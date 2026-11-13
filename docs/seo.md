# 搜索与 AI / Agent 可读性

本站正式地址是 `https://nashaiomos.github.io/nash-web/`。保留 GitHub Pages 发布方式。

## 已实现

- 页面独立标题、摘要、绝对 canonical、Open Graph、Twitter Card 和 1200 × 630 分享图。
- 首页 `ProfilePage`、站点 `WebSite`、作者 `Person`，文章 `BlogPosting` 与 `BreadcrumbList` JSON-LD。
- 正文仍完整预渲染到 HTML；不运行 JavaScript 也能阅读。页面显示作者和语义化发布时间。
- 首页明确 Nash Aiomos、Nash、中子星的对应关系，关联已有 GitHub / X 个人资料。
- 为现有文章补齐摘要；转载的《游击队开放访问宣言》标明 Aaron Swartz，避免把原作者写成站长。
- 已确认的《造梦家的冒险之旅》中英文版本互相声明 `hreflang`，各自保持独立 canonical。
- `/sitemap.xml` 自动列出首页、Blog、Projects、标签及公开文章，支持 frontmatter 中的自定义 `_path`。它也驱动预渲染，避免文章因缺少入口而漏生成。
- `/article-index.json` 提供文章 URL、作者、标题、摘要、语言、标签、日期；保持站内搜索可用。
- `/content.json` 提供公开简介、项目和完整文章纯文本。数据来自与页面相同的 Nuxt Content 文档，不包含读者评论。
- `/llms.txt` 是可选的 Agent 阅读指南，链接到原文、JSON、RSS；页脚和 HTML head 提供发现入口。它不是通用的 AI 收录标准，也不是搜索排名保证。
- Search、404、静态 SPA 回退页使用 `noindex`；不存在的文章在 Nuxt 服务端返回 404。
- `pnpm test:seo` 检查生成产物：canonical、元信息、JSON-LD、可解析 JSON、文章覆盖、正文一致性、语言互链、RSS、图片和 URL 文件存在性。GitHub Actions 发布前自动运行。

## 发布后需要的外部操作

### 2026-11-13 Google 渲染错误修复

Search Console 实际测试的 HTML 出现 `Unable to Load Page` 和 `noindex`。
控制台记录了首页初始化时 `Failed to fetch dynamically imported module`，并有 `_payload.json` 下载失败。
检查时这些线上文件返回 200，因此只能确认资源加载失败触发错误页，不能确定是缓存还是临时网络问题。

- 客户端脚本合并为一个文件，避免初始化途中再下载页面/组件分块；CSS 同步合并。
- 关闭独立 payload 提取，将初始数据放在同一份预渲染 HTML 中。所有访问者使用相同产物。
- 代价是首次访问加载整站客户端代码，HTML 包含该页数据；当前脚本约 142 KB gzip。站点规模扩大后需重新评估。
- SEO 检查增加初始数据内联和单脚本断言。本地验证首页、博客、文章导航、文章直接刷新与站内搜索正常，无控制台错误。
- 发布后仍需在 Google 对首页重新执行“测试实际网址”；代码和本地验证通过不等于 Google 已收录。

### 验证与提交

1. 在 [Google Search Console](https://search.google.com/search-console) 添加 **URL 前缀资源** `https://nashaiomos.github.io/nash-web/`。使用该账号提供的 HTML 验证文件（放入 `public/`，重新发布），或真实的验证 meta 标签；不能凭空生成验证代码。
2. 验证通过后，提交 `https://nashaiomos.github.io/nash-web/sitemap.xml`。用 URL 检查检查首页和几篇重点文章，确认 Google 看到完整正文与正确 canonical，再申请编入索引。
3. 在 [Bing Webmaster Tools](https://www.bing.com/webmasters/) 添加同一网站并提交 sitemap；可以按其界面从 Search Console 导入已验证的网站。
4. 观察曝光、点击、搜索词与索引覆盖。技术配置可改善发现和理解，排名、收录及 AI 引用仍取决于搜索服务。

本次检查中，线上首页返回 HTTP 200；域名根目录的 `https://nashaiomos.github.io/robots.txt` 返回 HTTP 404。404 不等于禁止抓取。

### GitHub Pages 子目录与 robots.txt

爬虫只读取**域名根目录**的 `/robots.txt`，不会把 `/nash-web/robots.txt` 当成该域名的 robots 配置。本项目生成的文件用于未来根域名部署，或复制到 `NashAiomos/nashaiomos.github.io` 用户站点仓库根目录。当前项目仓库单独发布无法改变域名根路径。

如果以后配置用户站点根目录，应先合并已有爬虫规则，再加入：

```text
User-agent: *
Allow: /

Sitemap: https://nashaiomos.github.io/nash-web/sitemap.xml
```

没有根目录控制权时，直接在搜索站长平台提交完整 sitemap URL；本站也已通过可抓取链接暴露 sitemap。不要把 `robots.txt` 中的开放抓取误认为收录、排名或引用承诺。

## 后续写文章

```yaml
---
title: 文章真实标题
description: 准确说明主题、问题和内容的简短摘要，避免重复通用宣传语。
lang: zh-Hans
date: 2026-11-13
tags:
  - AI
---
```

- 正文实质更新时才添加或修改 `updated: YYYY-MM-DD`。构建时间不能当作文章更新时间；缺少真实更新时间时 sitemap 不输出 `lastmod`。
- 转载内容填写 `author` 和已核实的 `authorUrl`，正文保留出处。默认作者是 Nash Aiomos。
- 对应翻译可添加 `alternates`（语言代码 → 本站页面路径），两篇都要填写，且指向真实内容。
- `draft: true`、`_draft: true`、`_partial: true` 的文档不进入公开列表、sitemap 或 Agent 导出。这不是访问控制；敏感草稿应留在部署内容目录之外。
- 新文章通过链接引用相关旧文，维持清楚的主题和来源。不要为了关键词改写个人经历或增加不可核实的资历。

验证：

```sh
pnpm generate
pnpm test:seo
```

分享图保存在 `public/images/social-card.png`，随源码维护；修改文字或设计后运行 `pnpm images:social`。该命令使用已有的 Sharp，无需网络。

## 本次验证（2026-11-13）

- `pnpm generate` 成功，`pnpm test:seo` 覆盖 29 个 canonical 页面和 16 篇文章。
- `pnpm exec tsc --noEmit --pretty false`、`git diff --check` 通过；sitemap 与 RSS 通过 XML 解析。
- 本地静态站浏览器验证：首页 → Blog → 中文文章 → 含 `&` 的标签页及刷新；站内搜索 → 英文文章 → 首页。标题、语言、canonical、结构化数据及 `noindex` 随导航正确更新，不残留上一页文章或语言标记。
- 不存在的文章显示错误页面与 `noindex`。
- 此处为本地验证；没有代表用户提交 Google/Bing 验证，也没有声称搜索服务已经收录本次改动。

## 官方依据

- [Google：AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)：AI 搜索沿用 SEO 基础要求，没有专属文件或标记要求。
- [Google：构建与提交 sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)：使用 canonical URL 和真实修改时间。
- [Google：robots.txt 文件位置](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt)：文件必须位于适用站点的根目录。
- [Google：Article 结构化数据](https://developers.google.com/search/docs/appearance/structured-data/article) 与 [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page)。
