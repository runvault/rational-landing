import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('JS ERROR:', e.message));
await page.goto('file:///tmp/rational-landing/design-demos/template-final.html');
await page.waitForTimeout(2500);

for (let y = 0; y < 12000; y += 500) {
  await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), y);
  await page.waitForTimeout(80);
}

const el = await page.$('#rationalLoop');
const box = await el.boundingBox();
const sTop = box.y + await page.evaluate(() => window.scrollY);
const scrollable = box.height - 900;

const shots = [
  { name: '0-enter', pct: 0.04 },
  { name: '0-hold', pct: 0.10 },
  { name: '0-exit', pct: 0.16 },
  { name: '1-enter', pct: 0.20 },
  { name: '1-hold', pct: 0.28 },
  { name: '2-enter', pct: 0.36 },
  { name: '2-hold', pct: 0.46 },
  { name: '3-enter', pct: 0.52 },
  { name: '3-hold', pct: 0.60 },
  { name: '4-enter', pct: 0.68 },
  { name: '4-hold', pct: 0.76 },
  { name: '5-pentagon', pct: 0.96 },
];

for (const s of shots) {
  const y = sTop + scrollable * s.pct;
  await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), y);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `gentle-${s.name}.png` });
}

await browser.close();
console.log('Done');
