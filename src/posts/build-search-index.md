---
title: "给博客做一个 30KB 的客户端全文搜索"
date: "2026-04-30"
category: "前端架构"
tags: ["搜索","算法","性能优化"]
excerpt: "不需要 Lunr，不需要后端。一个倒排索引 + 一个模糊匹配器就够了。"
readTime: 9
views: 13560
featured: true
pattern: "security"
hue: 186
hue2: 214
---
博客规模不大时，一个手写的倒排索引就够用了：几分钟的构建时间，几 KB 的体积，零依赖。

## 构建倒排索引

```ts
function buildIndex(docs: Doc[]) {
  const index = new Map<string, Set<number>>();

  docs.forEach((doc, i) => {
    const tokens = tokenize(`${doc.title} ${doc.excerpt} ${doc.tags.join(' ')}`);
    for (const token of tokens) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token)!.add(i);
    }
  });

  return index;
}
```

## 带前缀和模糊匹配

查询时先做前缀匹配，命中不了再退化成子串扫描。对中文这种没有空格分词的语言，子串扫描其实承担了大部分工作量。
