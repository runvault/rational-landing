import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(1500);

const section = await page.$('#rationalLoop');
const box = await section.boundingBox();
const sectionTop = box.y + await page.evaluate(() => window.scrollY);
const sectionH = box.height;
const vh = 900;
const scrollable = sectionH - vh;

const positions = [
  { name: 'stage1', pct: 0.08 },
  { name: 'stage2', pct: 0.22 },
  { name: 'stage3', pct: 0.38 },
  { name: 'stage4', pct: 0.55 },
  { name: 'stage5', pct: 0.70 },
  { name: 'pentagon', pct: 0.95 },
];

for (const p of positions) {
  const scrollY = sectionTop + scrollable * p.pct;
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), scrollY);
  await page.waitForTimeout(400);
  const errors = await page.evaluate(() => {
    const errs = [];
    const imgs = document.querySelectorAll('.loop-bg-image');
    imgs.forEach((img, i) => {
      errs.push(`bg${i}: opacity=${getComputedStyle(img).opacity}`);
    });
    return errs;
  });
  console.log(`${p.name} (${Math.round(scrollY)}): ${errors.join(', ')}`);
  await page.screenshot({ path: `bg-${p.name}.png` });
}

await browser.close();
console.log('Done');
