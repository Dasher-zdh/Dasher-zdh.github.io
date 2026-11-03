---
title: "设计令牌的三层结构：让主题切换只改一层"
date: "2026-09-26"
category: "设计系统"
tags: ["Design Token","CSS","主题"]
excerpt: "很多项目的暗色亮色切换是散落各处的 if/else。正确的做法是分层的令牌，让切换只发生在叶子节点。"
readTime: 7
views: 9640
featured: false
pattern: "wave"
hue: 158
hue2: 186
---
主题切换之所以痛苦，通常是因为令牌层级混乱。原始色值直接写进了组件，切换时你只能去组件里逐个改。

## 基础层 → 语义层 → 组件层

基础层是纯色板，语义层给它们赋予用途，组件层只在有特殊需求时才出现。第三层应该很薄。

```css
/* 基础层：原始色值 */
:root {
  --teal-400: #2dd4bf;
  --slate-900: #05070d;
}

/* 语义层：用途 */
:root {
  --accent: var(--teal-400);
  --surface-base: var(--slate-900);
}

/* 主题层：只覆盖语义层 */
[data-theme='light'] {
  --accent: #0f766e;
  --surface-base: #f4f7fa;
}
```

这样切换主题时，你只需要换掉语义层。组件代码永远只引用语义令牌。

## 别忘了过渡

主题切换时颜色是渐变的，而不是瞬变的。给 body 和常见表面元素加 color/background-color 过渡，体验会好很多。
