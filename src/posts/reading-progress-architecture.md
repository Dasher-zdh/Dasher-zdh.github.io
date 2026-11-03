---
title: "阅读进度条的架构：别用 scroll 事件"
date: "2026-07-30"
category: "性能优化"
tags: ["性能优化","IntersectionObserver","滚动"]
excerpt: "一个看起来只有 5 行的功能，如果用 scroll 事件实现，可能让整页掉帧。讲讲正确的做法。"
readTime: 6
views: 15760
featured: false
pattern: "wave"
hue: 178
hue2: 220
---
在 scroll 事件里计算进度条，逻辑上没错，但它把一次布局读取塞进了滚动热路径。滚动事件的触发频率远高于帧率。

## 为什么 scroll 事件不行

```ts
// 反面教材：滚动时读 getBoundingClientRect，强制同步布局
window.addEventListener('scroll', () => {
  const rect = article.getBoundingClientRect();
  const progress = -rect.top / rect.height;
  bar.style.transform = `scaleX(${progress})`;
});
```

## 用 rAF 节流 + 缓存尺寸

```ts
let ticking = false;

const update = () => {
  const rect = article.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
  bar.style.transform = `scaleX(${progress})`;
  ticking = false;
};

window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}, { passive: true });
```

passive: true 告诉浏览器你不会调用 preventDefault，滚动就不会被阻塞。加上 rAF 节流，回调频率被压到帧率级别。
