---
title: "用 CSS Grid 做一套真正好用的布局系统"
date: "2026-08-18"
category: "前端架构"
tags: ["CSS","布局","响应式"]
excerpt: "不需要任何框架。用 Grid 的命名区域和 minmax，把响应式布局写进 CSS 本身。"
readTime: 8
views: 7320
featured: false
pattern: "grid"
hue: 168
hue2: 200
---
Grid 布局的很多能力被低估了，尤其是 grid-template-areas。它让"这个区块在宽屏时在左边、在窄屏时在上面"变成了一行声明。

## 命名区域

```css
.layout {
  display: grid;
  grid-template-areas:
    "sidebar content"
    "sidebar aside";
  grid-template-columns: 200px 1fr;
}

@media (max-width: 900px) {
  .layout {
    grid-template-areas:
      "content"
      "aside"
      "sidebar";
    grid-template-columns: 1fr;
  }
}
```

DOM 顺序和视觉顺序解耦，是 Grid 相比 Flexbox 在这个场景的最大优势。
