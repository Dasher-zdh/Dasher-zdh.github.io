---
title: "WebGL 和 Canvas2D：粒子渲染该选哪条路"
date: "2026-09-05"
category: "图形与可视化"
tags: ["WebGL","Canvas","性能优化"]
excerpt: "当粒子数突破五位数，Canvas2D 的绘制调用本身就变成了瓶颈。这篇文章对比两条渲染路径的性能曲线。"
readTime: 15
views: 24180
featured: true
pattern: "circuit"
hue: 200
hue2: 280
---
选择渲染路径的本质是选择你在优化什么：Canvas2D 优化的是绘制调用次数，WebGL 优化的是每帧的 GPU 提交次数。

## Canvas2D 的天花板

Canvas2D 里每个 fillRect 都是一次绘制调用，浏览器需要处理状态变更。五千个粒子意味着每帧五千次调用，你会明显感觉到掉帧。

```ts
// Canvas2D: 每粒子一次绘制调用
ctx.clearRect(0, 0, w, h);
for (const p of particles) {
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
}
```

## WebGL 的批处理

WebGL 可以把所有点塞进一个 buffer，一次 drawArrays 画完。GPU 侧的填充率远高于 CPU 侧的调用开销。

```ts
// WebGL: 所有点一次绘制
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
gl.drawArrays(gl.POINTS, 0, particleCount);
```

> 如果你只需要几百个点，别碰 WebGL。如果你需要几万个，Canvas2D 救不了你。

![两种路径的帧率随粒子数变化的对比](pattern://grid?hue=205&hue2=290)
