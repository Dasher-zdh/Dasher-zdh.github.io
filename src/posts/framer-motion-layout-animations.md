---
title: "Framer Motion 的 layout 动画：什么时候该用，什么时候是自找麻烦"
date: "2026-10-11"
category: "前端架构"
tags: ["Motion","React","动画"]
excerpt: "layout 动画看起来很魔法，但它会强制浏览器做额外的测量。讲清楚它的代价，以及三种真正需要它的场景。"
readTime: 9
views: 12880
featured: false
pattern: "editor"
hue: 186
hue2: 258
---
layout 动画是 Framer Motion 里最诱人也最危险的能力。它能自动补间位置和尺寸，看起来像魔法，代价是浏览器要在每一帧前后各做一次测量。

## 什么时候该用

- 共享元素：一个卡片展开成详情页，位置和尺寸要连续变化。
- 列表重排：筛选后卡片换位，顺序变化需要被追踪。
- 折叠展开：高度从 auto 过渡到确定值。

## 什么时候别用

如果两个状态之间没有空间上的连续性——比如一个面板从屏幕外飞入——用 transform 直接动画就够了，不要给 motion.div 加 layout 属性。

```tsx
// 不需要 layout：纯位移用 transform 即可，零测量成本
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
/>

// 需要 layout：卡片位置真的变了，要补间的是布局本身
<motion.article layout transition={{ type: 'spring', stiffness: 260 }} />
```

## 它的真实代价

每次 layout 动画触发一轮 measure + apply。列表越长越贵。给长列表加 layout 之前，先把项目数量砍到肉眼需要看的范围。

> 动效的性能预算和动效的视觉效果一样重要。一个 200ms 的掉帧，比一个 300ms 的慢动画糟糕得多。

![layout 动画的测量—应用循环](pattern://circuit?hue=190&hue2=240)
