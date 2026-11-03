# Markdown 文章撰写指南

博客现已完全升级为 **Markdown 驱动引擎**。所有文章统一存放在 `src/posts/` 目录下，以 `.md` 结尾。

系统会自动读取所有 `.md` 文件，解析其 Frontmatter 元数据，并自动建立搜索索引、标签云、阅读目录（TOC）、代码高亮和阅读进度条。

---

## 1. 文章文件命名
文件命名规范为英文字符加中划线，例如：
- `src/posts/my-first-post.md`
- `src/posts/react-server-components.md`

文件的名称默认就是该文章的访问路径（URL slug），即 `https://dasher-zdh.github.io/posts/my-first-post`。

---

## 2. 头部元数据（Frontmatter）模板

每篇 `.md` 文件的最顶部必须包含由 `---` 包裹的元数据块：

```markdown
---
title: "在低端机上活下来的粒子系统：一份性能预算清单"
date: "2026-10-24"
category: "性能优化"
tags: ["Canvas", "性能优化", "动画"]
excerpt: "星空粒子看起来很美，但在 4 年前的安卓机上能把帧率打到个位数。这篇文章把好看拆成可度量的预算，逐条给出取舍方案。"
readTime: 12
views: 18420
featured: true
pattern: "orbit"
hue: 172
hue2: 198
---
```

### 字段说明：
| 字段 | 类型 | 是否必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | 文章完整标题 |
| `date` | string | 是 | 发布日期，格式：`YYYY-MM-DD` |
| `category` | string | 是 | 分类，例如：`前端架构`、`性能优化`、`图形与可视化`、`AI 工程` |
| `tags` | string[] | 是 | 标签数组，例如：`["Canvas", "性能优化"]` |
| `excerpt` | string | 否 | 文章卡片上展示的简述（如不填会自动截取正文前 120 字） |
| `readTime` | number | 否 | 预估阅读分钟数（不填会自动按字数计算） |
| `views` | number | 否 | 初始阅读量计数（不填会自动生成） |
| `featured` | boolean | 否 | 是否置顶/精选（`true` 会出现在首页精选区） |
| `pattern` | string | 否 | 封面生成艺术类型：`orbit` / `wave` / `circuit` / `layer` / `security` / `cloud` / `ai` / `editor` |
| `hue` | number | 否 | 封面主色相（0~360），默认 172（青绿） |
| `hue2` | number | 否 | 封面副色相（0~360），默认 198（天蓝） |

---

## 3. 正文语法支持

### 二级与三级标题（自动生成文章目录大纲 TOC）
```markdown
## 第一步：定义预算，而不是定义粒子数

正文内容...

### 1.1 核心度量指标

正文内容...
```
> **注意**：大纲目录会自动提取所有的 `##`（二级标题）和 `###`（三级标题），并实现滚动到视口时的实时高亮联动。

### 代码块与语法高亮
使用三反引号标注语言：
````markdown
```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
```
````
代码块会自动带上暗黑科技风终端装饰条和一键复制按钮。

### 引用框
```markdown
> 预算的核心不是“帧率要 60”，而是“一帧最多允许花多少毫秒在动效上”。
```

### 列表
```markdown
- 第一条准则
- 第二条准则
- 第三条准则
```

### 强调与链接
- **加粗**：`**粗体文字**`
- *斜体*：`*斜体文字*`
- 行内代码：`` `const x = 1` ``
- 外部链接：`[GitHub](https://github.com)`

---

## 4. 发布与部署工作流

写好新的 `.md` 文章后，只需在项目目录下执行：

```bash
# 1. 查看改动
git status

# 2. 提交新文章
git add src/posts/
git commit -m "feat: publish new post"

# 3. 推送到 GitHub
git push origin main
```

推送后，**GitHub Actions 会自动编译并将新文章同步到线上博客**（`https://dasher-zdh.github.io`），通常 1 分钟左右即可生效。
