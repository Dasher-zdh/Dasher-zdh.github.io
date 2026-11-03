/**
 * Article content. Each post carries the metadata the UI needs (cover art is
 * generated locally, so the site works fully offline).
 */

export type CoverPattern =
  | 'grid'
  | 'orbit'
  | 'wave'
  | 'circuit'
  | 'layer'
  | 'security'
  | 'cloud'
  | 'ai'
  | 'editor'

export interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  date: string
  readTime: number
  views: number
  featured?: boolean
  cover: { hue: number; hue2: number; pattern: CoverPattern }
  body: ArticleBlock[]
}

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; caption: string; hue: number; hue2: number; pattern: CoverPattern }

export const posts: Post[] = [
  {
    slug: 'particle-system-performance-budget',
    title: '在低端机上活下来的粒子系统：一份性能预算清单',
    excerpt:
      '星空粒子看起来很美，但在 4 年前的安卓机上能把帧率打到个位数。这篇文章把"好看"拆成可度量的预算，逐条给出取舍方案。',
    category: '性能优化',
    tags: ['Canvas', '性能优化', '动画'],
    date: '2026-10-24',
    readTime: 12,
    views: 18_420,
    cover: { hue: 172, hue2: 198, pattern: 'orbit' },
    body: [
      {
        type: 'p',
        text: '写粒子系统的人都会先想一个问题：多少个粒子才够？我在三个不同的项目里踩过同一个坑——先写效果，再补性能，最后发现效果本身就得砍掉一半。',
      },
      {
        type: 'p',
        text: '这篇文章反着来。先定预算，再写效果。预算的核心不是"帧率要 60"，而是"一帧最多允许花多少毫秒在动效上"。',
      },
      { type: 'h2', id: 'budget', text: '第一步：定义预算，而不是定义粒子数' },
      {
        type: 'p',
        text: '在 60fps 下，一帧是 16.67ms。但你可以全花掉吗？不能。给动效留 4ms 是相对安全的比例，剩下的时间要留给滚动、输入响应和 React 的调度。',
      },
      {
        type: 'code',
        lang: 'ts',
        code: `// 动效预算：按帧的剩余时间反推粒子上限
const FRAME_BUDGET_MS = 4;
const TARGET_FPS = 60;

const frameMs = 1000 / TARGET_FPS;
const perParticleCost = 0.012; // 实测：单个带 alpha 的圆点绘制成本(ms)

export const maxParticles = Math.floor(
  (FRAME_BUDGET_MS / perParticleCost) * 100,
);

// 输出: 33 —— 远低于"看起来应该有很多"的直觉数字`,
      },
      {
        type: 'p',
        text: '注意这里的成本是实测值，不是猜测。不同浏览器对 canvas 圆弧绘制、shadowBlur 和 globalAlpha 的处理差异极大，一个数字不能用到底。',
      },
      { type: 'h2', id: 'layers', text: '第二步：分层，而不是调数量' },
      {
        type: 'p',
        text: '把粒子拆成三层，每层的更新频率和绘制方式都不同，比单纯减少数量效果好得多。',
      },
      {
        type: 'list',
        items: [
          '远景层：静态星点，用 CSS 或一次性绘制的 canvas，不参与每帧更新。',
          '中景层：慢速漂浮，位置只在初始化时计算一次，每帧只改 opacity。',
          '近景层：响应鼠标交互，数量严格控制在 40 以内。',
        ],
      },
      {
        type: 'code',
        lang: 'ts',
        code: `// 只有近景层每帧更新，且只在鼠标移动时被唤醒
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
}`,
      },
      { type: 'h2', id: 'visibility', text: '第三步：看不见就停' },
      {
        type: 'p',
        text: 'IntersectionObserver 应该是粒子系统的第一个优化，而不是最后一个。视口外的动画没有任何视觉收益，却照常消耗主线程。',
      },
      {
        type: 'quote',
        text: '任何持续运行的动画，如果没有"空闲时停止"的能力，它就一定会在某个用户手机上把页面拖垮。',
      },
      {
        type: 'code',
        lang: 'ts',
        code: `const io = new IntersectionObserver(
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

io.observe(canvas);`,
      },
      { type: 'h3', id: 'visibility-2', text: '别忘了 document.hidden' },
      {
        type: 'p',
        text: '标签页切到后台时，rAF 本身会暂停，但你的计时器不会。加一个 visibilitychange 监听，能省下后台标签页里那点宝贵的电量。',
      },
      {
        type: 'image',
        caption: '三层粒子的更新频率差异：近景每帧，中景每 4 帧，远景仅初始化',
        hue: 172,
        hue2: 210,
        pattern: 'layer',
      } as ArticleBlock,
      { type: 'h2', id: 'reduce', text: '尊重 reduced-motion' },
      {
        type: 'p',
        text: 'prefers-reduced-motion 不是可选项。对前庭功能障碍的用户来说，强视差和持续漂浮可能真的会引发不适。降级方案要落到最终渲染状态，而不是简单地"什么都不做"。',
      },
      {
        type: 'code',
        lang: 'ts',
        code: `const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
);

if (reduceMotion.matches) {
  // 保留静态的星点，但取消所有位移与闪烁
  renderStaticField();
} else {
  startAnimatedField();
}`,
      },
    ],
  },
  {
    slug: 'framer-motion-layout-animations',
    title: 'Framer Motion 的 layout 动画：什么时候该用，什么时候是自找麻烦',
    excerpt:
      'layout 动画看起来很魔法，但它会强制浏览器做额外的测量。讲清楚它的代价，以及三种真正需要它的场景。',
    category: '前端架构',
    tags: ['Motion', 'React', '动画'],
    date: '2026-10-11',
    readTime: 9,
    views: 12_880,
    cover: { hue: 186, hue2: 258, pattern: 'editor' },
    body: [
      {
        type: 'p',
        text: 'layout 动画是 Framer Motion 里最诱人也最危险的能力。它能自动补间位置和尺寸，看起来像魔法，代价是浏览器要在每一帧前后各做一次测量。',
      },
      { type: 'h2', id: 'when', text: '什么时候该用' },
      {
        type: 'list',
        items: [
          '共享元素：一个卡片展开成详情页，位置和尺寸要连续变化。',
          '列表重排：筛选后卡片换位，顺序变化需要被追踪。',
          '折叠展开：高度从 auto 过渡到确定值。',
        ],
      },
      { type: 'h2', id: 'when-not', text: '什么时候别用' },
      {
        type: 'p',
        text: '如果两个状态之间没有空间上的连续性——比如一个面板从屏幕外飞入——用 transform 直接动画就够了，不要给 motion.div 加 layout 属性。',
      },
      {
        type: 'code',
        lang: 'tsx',
        code: `// 不需要 layout：纯位移用 transform 即可，零测量成本
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
/>

// 需要 layout：卡片位置真的变了，要补间的是布局本身
<motion.article layout transition={{ type: 'spring', stiffness: 260 }} />`,
      },
      { type: 'h2', id: 'cost', text: '它的真实代价' },
      {
        type: 'p',
        text: '每次 layout 动画触发一轮 measure + apply。列表越长越贵。给长列表加 layout 之前，先把项目数量砍到肉眼需要看的范围。',
      },
      {
        type: 'quote',
        text: '动效的性能预算和动效的视觉效果一样重要。一个 200ms 的掉帧，比一个 300ms 的慢动画糟糕得多。',
      },
      {
        type: 'image',
        caption: 'layout 动画的测量—应用循环',
        hue: 190,
        hue2: 240,
        pattern: 'circuit',
      } as ArticleBlock,
    ],
  },
  {
    slug: 'design-tokens-at-scale',
    title: '设计令牌的三层结构：让主题切换只改一层',
    excerpt:
      '很多项目的暗色亮色切换是散落各处的 if/else。正确的做法是分层的令牌，让切换只发生在叶子节点。',
    category: '设计系统',
    tags: ['Design Token', 'CSS', '主题'],
    date: '2026-09-26',
    readTime: 7,
    views: 9_640,
    cover: { hue: 158, hue2: 186, pattern: 'wave' },
    body: [
      {
        type: 'p',
        text: '主题切换之所以痛苦，通常是因为令牌层级混乱。原始色值直接写进了组件，切换时你只能去组件里逐个改。',
      },
      { type: 'h2', id: 'layers', text: '基础层 → 语义层 → 组件层' },
      {
        type: 'p',
        text: '基础层是纯色板，语义层给它们赋予用途，组件层只在有特殊需求时才出现。第三层应该很薄。',
      },
      {
        type: 'code',
        lang: 'css',
        code: `/* 基础层：原始色值 */
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
}`,
      },
      {
        type: 'p',
        text: '这样切换主题时，你只需要换掉语义层。组件代码永远只引用语义令牌。',
      },
      { type: 'h2', id: 'transition', text: '别忘了过渡' },
      {
        type: 'p',
        text: '主题切换时颜色是渐变的，而不是瞬变的。给 body 和常见表面元素加 color/background-color 过渡，体验会好很多。',
      },
    ],
  },
  {
    slug: 'webgl-particle-rendering',
    title: 'WebGL 和 Canvas2D：粒子渲染该选哪条路',
    excerpt:
      '当粒子数突破五位数，Canvas2D 的绘制调用本身就变成了瓶颈。这篇文章对比两条渲染路径的性能曲线。',
    category: '图形与可视化',
    tags: ['WebGL', 'Canvas', '性能优化'],
    date: '2026-09-05',
    readTime: 15,
    views: 24_180,
    featured: true,
    cover: { hue: 200, hue2: 280, pattern: 'circuit' },
    body: [
      {
        type: 'p',
        text: '选择渲染路径的本质是选择你在优化什么：Canvas2D 优化的是绘制调用次数，WebGL 优化的是每帧的 GPU 提交次数。',
      },
      { type: 'h2', id: 'canvas', text: 'Canvas2D 的天花板' },
      {
        type: 'p',
        text: 'Canvas2D 里每个 fillRect 都是一次绘制调用，浏览器需要处理状态变更。五千个粒子意味着每帧五千次调用，你会明显感觉到掉帧。',
      },
      {
        type: 'code',
        lang: 'ts',
        code: `// Canvas2D: 每粒子一次绘制调用
ctx.clearRect(0, 0, w, h);
for (const p of particles) {
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
}`,
      },
      { type: 'h2', id: 'webgl', text: 'WebGL 的批处理' },
      {
        type: 'p',
        text: 'WebGL 可以把所有点塞进一个 buffer，一次 drawArrays 画完。GPU 侧的填充率远高于 CPU 侧的调用开销。',
      },
      {
        type: 'code',
        lang: 'ts',
        code: `// WebGL: 所有点一次绘制
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
gl.drawArrays(gl.POINTS, 0, particleCount);`,
      },
      {
        type: 'quote',
        text: '如果你只需要几百个点，别碰 WebGL。如果你需要几万个，Canvas2D 救不了你。',
      },
      {
        type: 'image',
        caption: '两种路径的帧率随粒子数变化的对比',
        hue: 205,
        hue2: 290,
        pattern: 'grid',
      } as ArticleBlock,
    ],
  },
  {
    slug: 'css-grid-layout-system',
    title: '用 CSS Grid 做一套真正好用的布局系统',
    excerpt: '不需要任何框架。用 Grid 的命名区域和 minmax，把响应式布局写进 CSS 本身。',
    category: '前端架构',
    tags: ['CSS', '布局', '响应式'],
    date: '2026-08-18',
    readTime: 8,
    views: 7_320,
    cover: { hue: 168, hue2: 200, pattern: 'grid' },
    body: [
      {
        type: 'p',
        text: 'Grid 布局的很多能力被低估了，尤其是 grid-template-areas。它让"这个区块在宽屏时在左边、在窄屏时在上面"变成了一行声明。',
      },
      { type: 'h2', id: 'areas', text: '命名区域' },
      {
        type: 'code',
        lang: 'css',
        code: `.layout {
  display: grid;
  grid-template-areas:
    "sidebar content"
    "sidebar aside";
  grid-template-columns: 200px 1fr;
}

@media (max-width: 900px) {
  .layout {
    grid-template-areas:
      "content"
      "aside"
      "sidebar";
    grid-template-columns: 1fr;
  }
}`,
      },
      {
        type: 'p',
        text: 'DOM 顺序和视觉顺序解耦，是 Grid 相比 Flexbox 在这个场景的最大优势。',
      },
    ],
  },
  {
    slug: 'reading-progress-architecture',
    title: '阅读进度条的架构：别用 scroll 事件',
    excerpt: '一个看起来只有 5 行的功能，如果用 scroll 事件实现，可能让整页掉帧。讲讲正确的做法。',
    category: '性能优化',
    tags: ['性能优化', 'IntersectionObserver', '滚动'],
    date: '2026-07-30',
    readTime: 6,
    views: 15_760,
    cover: { hue: 178, hue2: 220, pattern: 'wave' },
    body: [
      {
        type: 'p',
        text: '在 scroll 事件里计算进度条，逻辑上没错，但它把一次布局读取塞进了滚动热路径。滚动事件的触发频率远高于帧率。',
      },
      { type: 'h2', id: 'bad', text: '为什么 scroll 事件不行' },
      {
        type: 'code',
        lang: 'ts',
        code: `// 反面教材：滚动时读 getBoundingClientRect，强制同步布局
window.addEventListener('scroll', () => {
  const rect = article.getBoundingClientRect();
  const progress = -rect.top / rect.height;
  bar.style.transform = \`scaleX(\${progress})\`;
});`,
      },
      { type: 'h2', id: 'good', text: '用 rAF 节流 + 缓存尺寸' },
      {
        type: 'code',
        lang: 'ts',
        code: `let ticking = false;

const update = () => {
  const rect = article.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
  bar.style.transform = \`scaleX(\${progress})\`;
  ticking = false;
};

window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}, { passive: true });`,
      },
      {
        type: 'p',
        text: 'passive: true 告诉浏览器你不会调用 preventDefault，滚动就不会被阻塞。加上 rAF 节流，回调频率被压到帧率级别。',
      },
    ],
  },
  {
    slug: 'ai-assisted-code-review',
    title: 'AI 辅助代码评审：我用了两年之后的真实体感',
    excerpt: '关于 AI 在代码评审里到底做了什么、没做什么，以及什么类型的问题它永远不该碰。',
    category: 'AI 工程',
    tags: ['AI', '代码评审', '工程实践'],
    date: '2026-07-08',
    readTime: 11,
    views: 31_420,
    featured: true,
    cover: { hue: 190, hue2: 320, pattern: 'ai' },
    body: [
      {
        type: 'p',
        text: '两年前我在团队里推 AI 辅助评审时，遇到的最大阻力不是模型能力，而是大家不知道该把什么问题交给它。',
      },
      { type: 'h2', id: 'good', text: '它擅长的' },
      {
        type: 'list',
        items: [
          '识别重复代码、复制粘贴的实现',
          '指出与团队既有约定不一致的写法',
          '补充边界条件的遗漏用例',
          '解释一段陌生代码的意图',
        ],
      },
      { type: 'h2', id: 'bad', text: '它不该碰的' },
      {
        type: 'list',
        items: [
          '架构决策是否合理——它看不到半年后的你',
          '性能特征——除非能真正跑起来测',
          '业务正确性——错误的业务比慢更糟',
          '安全边界的取舍',
        ],
      },
      {
        type: 'quote',
        text: '把 AI 当成一个永不疲倦、但完全不了解你团队背景的同事。它能帮你做得更快，但签字的还是你。',
      },
    ],
  },
  {
    slug: 'svg-path-animation',
    title: 'SVG 路径动画：用 dasharray 做描边生长',
    excerpt: '不需要任何库，stroke-dasharray 加一点点数学，就能实现很精致的描边动画。',
    category: '图形与可视化',
    tags: ['SVG', '动画', 'CSS'],
    date: '2026-06-15',
    readTime: 5,
    views: 10_240,
    cover: { hue: 172, hue2: 240, pattern: 'orbit' },
    body: [
      {
        type: 'p',
        text: '描边动画的本质是让路径的一部分可见。用 getTotalLength 拿到路径长度，就能精确控制描边的生长。',
      },
      {
        type: 'code',
        lang: 'ts',
        code: `const path = document.querySelector('path');
const length = path.getTotalLength();

path.style.strokeDasharray = \`\${length}\`;
path.style.strokeDashoffset = \`\${length}\`;
path.style.transition = 'stroke-dashoffset 1.2s ease';

// 触发
requestAnimationFrame(() => {
  path.style.strokeDashoffset = '0';
});`,
      },
      {
        type: 'p',
        text: '本博客的加载动画用的就是这套技术 —— 一枚三角轮廓被逐笔画出。',
      },
    ],
  },
  {
    slug: 'accessible-motion',
    title: '动效的可访问性：prefers-reduced-motion 之后还要做什么',
    excerpt: '关掉动画只是开始。真正的要求是：关掉之后，页面依然完整可读、可用。',
    category: '设计系统',
    tags: ['无障碍', '动画', 'CSS'],
    date: '2026-05-22',
    readTime: 7,
    views: 8_540,
    cover: { hue: 160, hue2: 190, pattern: 'wave' },
    body: [
      {
        type: 'p',
        text: '很多实现只是加了一句媒体查询，把所有 transition 变成 0.01ms。这会让页面元素停在初始状态——如果初始状态是 opacity: 0，那内容就永远看不见了。',
      },
      { type: 'h2', id: 'trap', text: '初始状态陷阱' },
      {
        type: 'p',
        text: '滚动入场动画的元素通常以 opacity: 0 开始。reduced-motion 下如果 IntersectionObserver 不再触发显隐，它们就永远透明。',
      },
      {
        type: 'code',
        lang: 'tsx',
        code: `const reduce = usePrefersReducedMotion();

<motion.div
  initial={reduce ? false : { opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
  viewport={{ once: true }}
/>`,
      },
      {
        type: 'quote',
        text: '降级不是"关掉动画"，是"换一种抵达终点的方式"。终点必须和动画结束时完全一致。',
      },
    ],
  },
  {
    slug: 'build-search-index',
    title: '给博客做一个 30KB 的客户端全文搜索',
    excerpt: '不需要 Lunr，不需要后端。一个倒排索引 + 一个模糊匹配器就够了。',
    category: '前端架构',
    tags: ['搜索', '算法', '性能优化'],
    date: '2026-04-30',
    readTime: 9,
    views: 13_560,
    featured: true,
    cover: { hue: 186, hue2: 214, pattern: 'security' },
    body: [
      {
        type: 'p',
        text: '博客规模不大时，一个手写的倒排索引就够用了：几分钟的构建时间，几 KB 的体积，零依赖。',
      },
      { type: 'h2', id: 'index', text: '构建倒排索引' },
      {
        type: 'code',
        lang: 'ts',
        code: `function buildIndex(docs: Doc[]) {
  const index = new Map<string, Set<number>>();

  docs.forEach((doc, i) => {
    const tokens = tokenize(\`\${doc.title} \${doc.excerpt} \${doc.tags.join(' ')}\`);
    for (const token of tokens) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token)!.add(i);
    }
  });

  return index;
}`,
      },
      { type: 'h2', id: 'search', text: '带前缀和模糊匹配' },
      {
        type: 'p',
        text: '查询时先做前缀匹配，命中不了再退化成子串扫描。对中文这种没有空格分词的语言，子串扫描其实承担了大部分工作量。',
      },
    ],
  },
  {
    slug: 'monorepo-migration-notes',
    title: '把单体仓库迁到 Monorepo：踩过的 7 个坑',
    excerpt: '从 npm workspaces 到 Turborepo，这次迁移花了两个月。这是我们没预料到的部分。',
    category: '工程实践',
    tags: ['Monorepo', '工具链', '团队协作'],
    date: '2026-04-02',
    readTime: 13,
    views: 21_300,
    featured: true,
    cover: { hue: 200, hue2: 260, pattern: 'cloud' },
    body: [
      {
        type: 'p',
        text: '迁 Monorepo 的动机通常很朴素：共享包太难维护了。但迁移本身会带来一波你没准备好的工程问题。',
      },
      { type: 'h2', id: 'pitfalls', text: '几个真实的坑' },
      {
        type: 'list',
        items: [
          'CI 缓存键设计与依赖图耦合，改一个包触发全量重建。',
          '包的边界模糊，共享 utils 迅速膨胀成垃圾场。',
          '本地 node_modules 与包管理器的幽灵依赖问题。',
          '发布流程和普通 CI 混在一起，普通 PR 触发了发版检查。',
          'TypeScript 项目引用没有配好，编辑器里一片红。',
          '本地开发时的热更新路径变长，调试成本上升。',
          '代码所有权失去意义，reviewer 不知道该找谁。',
        ],
      },
      {
        type: 'quote',
        text: 'Monorepo 解决的是包的可见性问题，引入的是协作协议问题。后者才是真正要花时间的地方。',
      },
    ],
  },
  {
    slug: 'shader-basics',
    title: '着色器入门：把噪声函数当作你的新玩具',
    excerpt: 'Simplex noise 只需要几十行 GLSL，但它能生成的背景效果，比任何静态图都好看。',
    category: '图形与可视化',
    tags: ['WebGL', 'GLSL', '着色器'],
    date: '2026-03-14',
    readTime: 16,
    views: 26_890,
    featured: true,
    cover: { hue: 210, hue2: 190, pattern: 'wave' },
    body: [
      {
        type: 'p',
        text: '噪声函数是程序化生成的基础。学会了它，你可以生成云、火焰、烟雾、水波，以及所有看起来"自然"的随机形态。',
      },
      { type: 'h2', id: 'simplex', text: 'Simplex noise 核心' },
      {
        type: 'code',
        lang: 'glsl',
        code: `vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

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
}`,
      },
      {
        type: 'p',
        text: '这是 Ashima Arts 的标准实现。把 uniform 时间加进去，就得到了流动的噪声场。',
      },
    ],
  },
]

export const categories = Array.from(new Set(posts.map((p) => p.category)))
export const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort()

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function relatedPosts(slug: string, limit = 3): Post[] {
  const current = getPost(slug)
  if (!current) return posts.slice(0, limit)
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score:
        p.tags.filter((t) => current.tags.includes(t)).length * 2 +
        (p.category === current.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.post)
}
