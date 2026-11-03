---
title: "着色器入门：把噪声函数当作你的新玩具"
date: "2026-03-14"
category: "图形与可视化"
tags: ["WebGL","GLSL","着色器"]
excerpt: "Simplex noise 只需要几十行 GLSL，但它能生成的背景效果，比任何静态图都好看。"
readTime: 16
views: 26890
featured: true
pattern: "wave"
hue: 210
hue2: 190
---
噪声函数是程序化生成的基础。学会了它，你可以生成云、火焰、烟雾、水波，以及所有看起来"自然"的随机形态。

## Simplex noise 核心

```glsl
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
```

这是 Ashima Arts 的标准实现。把 uniform 时间加进去，就得到了流动的噪声场。
