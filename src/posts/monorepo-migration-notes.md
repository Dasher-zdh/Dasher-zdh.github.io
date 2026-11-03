---
title: "把单体仓库迁到 Monorepo：踩过的 7 个坑"
date: "2026-04-02"
category: "工程实践"
tags: ["Monorepo","工具链","团队协作"]
excerpt: "从 npm workspaces 到 Turborepo，这次迁移花了两个月。这是我们没预料到的部分。"
readTime: 13
views: 21300
featured: true
pattern: "cloud"
hue: 200
hue2: 260
---
迁 Monorepo 的动机通常很朴素：共享包太难维护了。但迁移本身会带来一波你没准备好的工程问题。

## 几个真实的坑

- CI 缓存键设计与依赖图耦合，改一个包触发全量重建。
- 包的边界模糊，共享 utils 迅速膨胀成垃圾场。
- 本地 node_modules 与包管理器的幽灵依赖问题。
- 发布流程和普通 CI 混在一起，普通 PR 触发了发版检查。
- TypeScript 项目引用没有配好，编辑器里一片红。
- 本地开发时的热更新路径变长，调试成本上升。
- 代码所有权失去意义，reviewer 不知道该找谁。

> Monorepo 解决的是包的可见性问题，引入的是协作协议问题。后者才是真正要花时间的地方。
