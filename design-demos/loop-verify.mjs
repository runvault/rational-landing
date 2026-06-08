import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(800);

const section = await page.$('#rationalLoop');
const box = await section.boundingBox();
const sectionTop = box.y + await page.evaluate(() => window.scrollY);
const sectionH = box.height;
const vh = 900;
const scrollable = sectionH - vh;

const positions = [
  { name: 'stage2', pct: 0.25 },
  { name: 'stage3', pct: 0.45 },
  { name: 'pentagon', pct: 0.95 },
];

for (const p of positions) {
  const scrollY = sectionTop + scrollable * p.pct;
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), scrollY);
  await page.waitForTimeout(300);
  const errors = await page.evaluate(() => window.__jsErrors || []);
  console.log(`${p.name}: scrollY=${Math.round(scrollY)}, errors=${errors.length}`);
  await page.screenshot({ path: `loop3-${p.name}.png` });
}

await browser.close();
console.log('Done');
