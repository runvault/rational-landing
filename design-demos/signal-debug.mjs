import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(800);

// Scroll through and log signal section rect at each position
for (const scrollY of [2200, 2400, 2500, 2600, 2700, 2800, 3000]) {
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), scrollY);
  await page.waitForTimeout(200);
  const info = await page.evaluate(() => {
    const el = document.getElementById('signalSection');
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const enterStart = vh;
    const enterEnd = vh * 0.2;
    const rawP = (enterStart - rect.top) / (enterStart - enterEnd);
    return { scrollY: window.scrollY, top: rect.top, vh, rawP, hasActive: el.classList.contains('active') };
  });
  console.log(`scrollY=${info.scrollY}: top=${info.top.toFixed(0)}, vh=${info.vh}, rawP=${info.rawP.toFixed(3)}, active=${info.hasActive}`);
}
await browser.close();
