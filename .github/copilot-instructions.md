## 快速目标

这是一个基于 Jekyll 的静态博客（Hux Blog 主题变体）。本文件为 AI 编码助手提供可执行的、本仓库特有的上下文——如何构建、调试、修改主题和发布文章的关键点与示例路径。

## 大局结构（为什么这样组织）
- 内容由 Jekyll 渲染：Markdown 带 Front Matter 放在 `_posts/`，布局由 `_layouts/` 和可复用片段放在 `_includes/`。修改展示通常在这些目录内完成。
- 资产流水线（CSS/JS）使用 Grunt 构建：源文件在 `less/` 和 `js/`，构建产物放在 `css/` 和 `js/`（已经存在的构建产物）。理由是继承自老主题，使用传统 Grunt 流程而非现代工具链。
- 本站在本地预览依赖 Ruby + Bundler + Jekyll；前端开发可并行运行 `grunt watch` 来编译 LESS/压缩 JS。

## 关键开发/调试命令（以 PowerShell/Windows 为例）
- 安装 Ruby 依赖：
```powershell
bundle install
```
- 本地预览（Jekyll）：
```powershell
bundle exec jekyll serve
```
- 同时做前端开发（在一个终端运行 Grunt watch，另一个运行 Jekyll）：
```powershell
# 终端 A
npm run dev    # package.json 的 dev 脚本: grunt watch & npm run start (在 Windows 上如果 & 行为异常，请分别运行 `grunt watch` 和 `npm start`)
# 终端 B
npm start      # 等同于 `bundle exec jekyll serve`
```
- 使用 Rake 创建新文章（会写好 front-matter 模板）：
```powershell
rake post title="你的标题" subtitle="副标题"
```

## 项目约定与可直接引用的实例
- 页面布局：`_layouts/default.html`（整体 HTML 骨架）、`_layouts/post.html`（文章页面模板）。这些文件包含对 `_includes/*` 的大量引用。
- 可复用片段：`_includes/head.html`、`_includes/nav.html`、`_includes/footer.html`。修改头部 meta、资源链接优先从这里入手。
- 文章示例：`_posts/2025-11-19-设置esxi定时关机.md`。注意 front-matter 字段：`layout`, `title`, `subtitle`, `date`, `header-img`, `tags`。
- 样式/高亮：`less/highlight.less` 用于代码高亮 CSS；Jekyll 配置中使用 `highlighter: rouge`（在 `_config.yml`），不要改成 pygments。
- JS 示例：`js/hux-blog.js` 包含主题行为（导航、目录、表格响应处理等）。

## 集成点与外部依赖
- Jekyll 及插件：`Gemfile` 和 `_config.yml`（`plugins: [jekyll-paginate]`）。保证 `bundle install` 安装 `jekyll`、`jekyll-paginate`。
- 前端构建：`package.json`（devDependencies: grunt, grunt-contrib-less, grunt-contrib-uglify 等）。编辑 `less/` 或 `js/` 后需要运行 Grunt 来编译。
- 评论/第三方服务：Disqus（通过 `_config.yml` 的 `disqus_username`），网易云跟帖（可选），PWA/service-worker 在 `pwa/` 与 `sw.js`。

## 编辑/修改要点（AI 助手可直接执行的建议）
- 修改页面布局或站点结构：优先在 `_includes/` 修改小组件，再在 `_layouts/` 做全局变更。保持 Liquid 标签与 `site.*`、`page.*` 的现有用法。
- 新增样式：编辑 `less/` 源文件，并确保在 `Gruntfile.js` 中的任务仍然覆盖到目标 `css/`。保留打包任务中添加 license banner 的逻辑（README 提示需保留 Apache 2.0 license banner）。
- 新增脚本：把源放到 `js/`（或项目约定的源目录），并更新 `Gruntfile.js` 的 uglify / concat 目标（若添加新的入口文件）。
- 发布/推送：仓库使用常规 git push；package.json 有 `boil`、`push` 脚本，请在变更远程流程前向维护者确认。

## 不要假设的事（常见坑）
- 不要假设有现代前端构建（Webpack、Babel）。这是一个老式 Grunt + LESS 流程。
- Windows 上 `npm run dev` 的单行并行符 `&` 可能行为不同，分开运行 `grunt watch` 与 `npm start` 更可靠。
- 站点使用 `kramdown` 的 GFM 模式，代码高亮靠 `rouge`，修改 markdown 渲染时以 `_config.yml` 为准。

## 变更提交/风格小提示
- 保留并尽量不破坏 `less` 文件顶部或构建生成文件内的 license/banner（仓库 README 提及）。
- 修改模板时，保留原有 Liquid 变量与注释，新增字段应在 `_config.yml` 或文档中有对应说明。

## 生成文件 / 不应直接编辑的文件
- `css/hux-blog.min.css`、`js/hux-blog.min.js`：这些通常由 Grunt/uglify/less 生成，直接修改会被覆盖。请修改 `less/` 或 `js/` 源文件并运行 Grunt。
- `css/bootstrap*.css`、`js/bootstrap*.js`：保留第三方构建产物为兼容性使用，若升级请同时更新 vendor 说明。

## 质量门（Quick quality gates）
在提交变更前执行以下快速检查：
- 本地预览能启动并加载页面（快速 smoke）：
```powershell
bundle exec jekyll serve --watch
```
- 如果修改了 Less/JS，确保 Grunt build/ watch 未报错：
```powershell
grunt watch
```
- 检查生成的页面中是否有明显的 Liquid/HTML 错误（本地浏览器查看控制台和页面渲染）。

如果你想要我把该草案直接提交到 `.github/copilot-instructions.md`（或合并已有内容），我可以继续：请确认是否覆盖或附加到现有文件。完成后我会请求你的反馈并做迭代。
