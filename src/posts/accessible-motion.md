---
title: "动效的可访问性：prefers-reduced-motion 之后还要做什么"
date: "2026-05-22"
category: "设计系统"
tags: ["无障碍","动画","CSS"]
excerpt: "关掉动画只是开始。真正的要求是：关掉之后，页面依然完整可读、可用。"
readTime: 7
views: 8540
featured: false
pattern: "wave"
hue: 160
hue2: 190
---
很多实现只是加了一句媒体查询，把所有 transition 变成 0.01ms。这会让页面元素停在初始状态——如果初始状态是 opacity: 0，那内容就永远看不见了。

## 初始状态陷阱

滚动入场动画的元素通常以 opacity: 0 开始。reduced-motion 下如果 IntersectionObserver 不再触发显隐，它们就永远透明。

```tsx
const reduce = usePrefersReducedMotion();

<motion.div
  initial={reduce ? false : { opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
  viewport={{ once: true }}
/>
```

> 降级不是"关掉动画"，是"换一种抵达终点的方式"。终点必须和动画结束时完全一致。
