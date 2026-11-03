const { chromium } = require('playwright-core')
const fs = require('fs')

const EXEC = '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1600x1000', width: 1600, height: 1000 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '390x844', width: 390, height: 844 },
]

;(async () => {
  if (!fs.existsSync('/opt/myblog/screenshots')) {
    fs.mkdirSync('/opt/myblog/screenshots')
  }

  const browser = await chromium.launch({
    executablePath: EXEC,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'],
  })

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2200)

    // Measure layout metrics
    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar')
      const main = document.querySelector('.home-main')
      const rightRail = document.querySelector('.home-right-rail')
      const hero = document.querySelector('.hero-banner')
      const cards = document.querySelectorAll('.article-grid .post-card')
      const firstCard = cards[0]

      return {
        sidebarWidth: sidebar ? sidebar.offsetWidth : null,
        mainWidth: main ? main.offsetWidth : null,
        rightRailWidth: rightRail ? rightRail.offsetWidth : null,
        heroHeight: hero ? hero.offsetHeight : null,
        heroWidth: hero ? hero.offsetWidth : null,
        cardCount: cards.length,
        cardWidth: firstCard ? firstCard.offsetWidth : null,
        cardHeight: firstCard ? firstCard.offsetHeight : null,
      }
    })

    console.log(`\n=== Viewport ${vp.name} ===`, JSON.stringify(metrics, null, 2))

    await page.screenshot({ path: `/opt/myblog/screenshots/home-${vp.name}.png`, fullPage: false })
    await page.close()
  }

  await browser.close()
})()
