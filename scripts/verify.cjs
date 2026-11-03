const { chromium } = require('playwright-core')

const EXEC =
  '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

;(async () => {
  const browser = await chromium.launch({
    executablePath: EXEC,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const errors = []
  const consoleErrors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('requestfailed', (r) =>
    consoleErrors.push(`REQ FAIL ${r.url()} ${r.failure()?.errorText}`),
  )

  const base = 'http://127.0.0.1:4173'

  // --- Home ---
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)

  const checks = []
  const record = (name, ok, detail = '') =>
    checks.push({ name, ok, detail })

  record('h1 present', (await page.locator('h1').count()) > 0)
  record('sidebar rendered', (await page.locator('.sidebar').count()) === 1)
  record('nav links', (await page.locator('.sidebar__link').count()) === 5)
  record(
    'post cards',
    (await page.locator('.post-card').count()) > 0,
    `${await page.locator('.post-card').count()} cards`,
  )
  record('profile card', (await page.locator('.profile').count()) === 1)
  record('tag cloud', (await page.locator('.tag-cloud__tag').count()) > 0)
  record('timeline', (await page.locator('.timeline__item').count()) > 0)
  record('hero visible', await page.locator('.hero__title').isVisible())
  record(
    'preloader gone',
    (await page.locator('.preloader').count()) === 0,
    'after 2.2s',
  )

  // Canvas actually painted?
  const canvasPainted = await page.evaluate(() => {
    const c = document.querySelector('.bg-shell__stars canvas')
    if (!c) return 'no canvas'
    const ctx = c.getContext('2d')
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    let lit = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit++
    return lit
  })
  record('starfield painted pixels', Number(canvasPainted) > 50, `${canvasPainted}`)

  // --- Dark theme default ---
  const theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme'),
  )
  record('default theme is dark', theme === 'dark', theme)

  // --- Sidebar collapse ---
  const wBefore = await page.locator('.sidebar').evaluate((el) => el.offsetWidth)
  await page.locator('.sidebar__collapse').click()
  await page.waitForFunction(() => document.querySelector('.sidebar')?.offsetWidth === 72, { timeout: 2000 }).catch(() => {})
  const wAfter = await page.locator('.sidebar').evaluate((el) => el.offsetWidth)
  record(
    'sidebar collapses 190/200→72',
    (wBefore === 200 || wBefore === 190) && wAfter === 72,
    `${wBefore}→${wAfter}`,
  )
  await page.locator('.sidebar__collapse').click()
  await page.waitForFunction(() => document.querySelector('.sidebar')?.offsetWidth === 200 || document.querySelector('.sidebar')?.offsetWidth === 190, { timeout: 2000 }).catch(() => {})

  // --- Search: Ctrl+K ---
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(500)
  record('search panel opens on Ctrl+K', await page.locator('.topbar__panel').isVisible())

  await page.locator('.topbar__panel-input input').fill('性能')
  await page.waitForTimeout(500)
  const results = await page.locator('.topbar__result').count()
  record('search returns results', results > 0, `${results} hits`)
  record('match highlighted', (await page.locator('.topbar__mark').count()) > 0)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  record('Escape closes search', (await page.locator('.topbar__panel').count()) === 0)

  // --- Theme toggle ---
  await page.locator('.topbar__theme').click()
  await page.waitForTimeout(600)
  const theme2 = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme'),
  )
  record('theme toggles to light', theme2 === 'light', theme2)
  const persisted = await page.evaluate(() =>
    localStorage.getItem('sanzang-theme'),
  )
  record('theme persisted', persisted === 'light', String(persisted))
  await page.locator('.topbar__theme').click()
  await page.waitForTimeout(500)

  // --- Navigate to a post ---
  await page.locator('.post-card__link').first().click()
  await page.waitForTimeout(1400)
  record('url is a post', /\/posts\/.+/.test(page.url()), page.url())
  record('post title', (await page.locator('.post-detail__title').count()) === 1)
  record('toc built', (await page.locator('.post-detail__toc-link').count()) > 0)
  record('code block', (await page.locator('.code-block').count()) > 0)

  // Reading progress bar advances on scroll
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5))
  await page.waitForTimeout(900)
  const progress = await page.evaluate(() => {
    const el = document.querySelector('.post-detail__progress-fill')
    return el ? new DOMMatrixReadOnly(getComputedStyle(el).transform).a : -1
  })
  record('reading progress advances', progress > 0.05, `scaleX=${progress.toFixed(3)}`)

  // TOC active state
  const activeToc = await page.locator('.post-detail__toc-link[data-active="true"]').count()
  record('toc highlights active section', activeToc === 1, `${activeToc} active`)

  // --- Lightbox ---
  const figBtn = page.locator('.post-detail__figure-btn').first()
  if (await figBtn.count()) {
    await figBtn.click()
    await page.waitForTimeout(700)
    record('lightbox opens', await page.locator('.lightbox').isVisible())
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    record('Escape closes lightbox', (await page.locator('.lightbox').count()) === 0)
  } else {
    record('lightbox figure present', false, 'no figure in post')
  }

  // --- Other routes ---
  for (const [path, sel] of [
    ['/posts', '.post-card'],
    ['/archive', '.archive__year'],
    ['/tags', '.tag-cloud__tag'],
    ['/about', '.profile'],
    ['/nonexistent-page', '.notfound'],
  ]) {
    await page.goto(base + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    const n = await page.locator(sel).count()
    record(`route ${path}`, n > 0, `${n} × ${sel}`)
  }

  // --- Mobile viewport ---
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  record(
    'mobile toggle visible',
    await page.locator('.sidebar__mobile-toggle').isVisible(),
  )
  record(
    'no horizontal scroll on mobile',
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    await page.evaluate(
      () => `${document.documentElement.scrollWidth} vs ${window.innerWidth}`,
    ),
  )

  await browser.close()

  console.log('\n=== RUNTIME CHECKS ===')
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  — ' + c.detail : ''}`)
  }
  const failed = checks.filter((c) => !c.ok)
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`)
  console.log('\n=== PAGE ERRORS ===')
  console.log(errors.length ? errors.join('\n') : '(none)')
  console.log('\n=== CONSOLE ERRORS ===')
  console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)')
  process.exit(failed.length || errors.length ? 1 : 0)
})()
