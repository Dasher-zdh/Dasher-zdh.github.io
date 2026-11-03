---
title: "在低端机上活下来的粒子系统：一份性能预算清单"
date: "2026-10-24"
category: "性能优化"
tags: ["Canvas","性能优化","动画"]
excerpt: "星空粒子看起来很美，但在 4 年前的安卓机上能把帧率打到个位数。这篇文章把\"好看\"拆成可度量的预算，逐条给出取舍方案。"
readTime: 12
views: 18420
featured: false
pattern: "orbit"
hue: 172
hue2: 198
---
写粒子系统的人都会先想一个问题：多少个粒子才够？我在三个不同的项目里踩过同一个坑——先写效果，再补性能，最后发现效果本身就得砍掉一半。

这篇文章反着来。先定预算，再写效果。预算的核心不是"帧率要 60"，而是"一帧最多允许花多少毫秒在动效上"。

## 第一步：定义预算，而不是定义粒子数

在 60fps 下，一帧是 16.67ms。但你可以全花掉吗？不能。给动效留 4ms 是相对安全的比例，剩下的时间要留给滚动、输入响应和 React 的调度。

```ts
// 动效预算：按帧的剩余时间反推粒子上限
const FRAME_BUDGET_MS = 4;
const TARGET_FPS = 60;

const frameMs = 1000 / TARGET_FPS;
const perParticleCost = 0.012; // 实测：单个带 alpha 的圆点绘制成本(ms)

export const maxParticles = Math.floor(
  (FRAME_BUDGET_MS / perParticleCost) * 100,
);

// 输出: 33 —— 远低于"看起来应该有很多"的直觉数字
```

注意这里的成本是实测值，不是猜测。不同浏览器对 canvas 圆弧绘制、shadowBlur 和 globalAlpha 的处理差异极大，一个数字不能用到底。

## 第二步：分层，而不是调数量

把粒子拆成三层，每层的更新频率和绘制方式都不同，比单纯减少数量效果好得多。

- 远景层：静态星点，用 CSS 或一次性绘制的 canvas，不参与每帧更新。
- 中景层：慢速漂浮，位置只在初始化时计算一次，每帧只改 opacity。
- 近景层：响应鼠标交互，数量严格控制在 40 以内。

```ts
// 只有近景层每帧更新，且只在鼠标移动时被唤醒
let needsFrame = false;
let rafId = 0;

function onPointerMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  if (!needsFrame) {
    needsFrame = true;
    rafId = requestAnimationFrame(frame);
  }
}

function frame(now: number) {
  drawNearLayer(now);
  // 静止后停止循环，不做无意义的空转
  if (pointerIdle(now)) {
    needsFrame = false;
    rafId = 0;
    return;
  }
  rafId = requestAnimationFrame(frame);
}
```

## 第三步：看不见就停

IntersectionObserver 应该是粒子系统的第一个优化，而不是最后一个。视口外的动画没有任何视觉收益，却照常消耗主线程。

> 任何持续运行的动画，如果没有"空闲时停止"的能力，它就一定会在某个用户手机上把页面拖垮。

```ts
const io = new IntersectionObserver(
  ([entry]) => {
    isVisible = entry.isIntersecting;
    if (!isVisible) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    } else {
      rafId = requestAnimationFrame(frame);
    }
  },
  { threshold: 0 },
);

io.observe(canvas);
```

### 别忘了 document.hidden

标签页切到后台时，rAF 本身会暂停，但你的计时器不会。加一个 visibilitychange 监听，能省下后台标签页里那点宝贵的电量。

![三层粒子的更新频率差异：近景每帧，中景每 4 帧，远景仅初始化](pattern://layer?hue=172&hue2=210)

## 尊重 reduced-motion

prefers-reduced-motion 不是可选项。对前庭功能障碍的用户来说，强视差和持续漂浮可能真的会引发不适。降级方案要落到最终渲染状态，而不是简单地"什么都不做"。

```ts
const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
);

if (reduceMotion.matches) {
  // 保留静态的星点，但取消所有位移与闪烁
  renderStaticField();
} else {
  startAnimatedField();
}
```
