---
title: "SVG 路径动画：用 dasharray 做描边生长"
date: "2026-06-15"
category: "图形与可视化"
tags: ["SVG","动画","CSS"]
excerpt: "不需要任何库，stroke-dasharray 加一点点数学，就能实现很精致的描边动画。"
readTime: 5
views: 10240
featured: false
pattern: "orbit"
hue: 172
hue2: 240
---
描边动画的本质是让路径的一部分可见。用 getTotalLength 拿到路径长度，就能精确控制描边的生长。

```ts
const path = document.querySelector('path');
const length = path.getTotalLength();

path.style.strokeDasharray = `${length}`;
path.style.strokeDashoffset = `${length}`;
path.style.transition = 'stroke-dashoffset 1.2s ease';

// 触发
requestAnimationFrame(() => {
  path.style.strokeDashoffset = '0';
});
```

本博客的加载动画用的就是这套技术 —— 一枚三角轮廓被逐笔画出。
