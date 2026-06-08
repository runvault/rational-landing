import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('JS ERROR:', e.message));
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(2500);

for (let y = 0; y < 9000; y += 500) {
  await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), y);
  await page.waitForTimeout(80);
}

const section = await page.$('#rationalLoop');
const box = await section.boundingBox();
const sectionTop = box.y + await page.evaluate(() => window.scrollY);
const scrollable = box.height - 900;

// Capture transitions BETWEEN stages (exit of one, enter of next)
const shots = [
  { name: '0-enter', pct: 0.03 },
  { name: '0-hold', pct: 0.10 },
  { name: '0-exit', pct: 0.17 },
  { name: '1-enter', pct: 0.22 },
  { name: '1-hold', pct: 0.30 },
  { name: '1-exit', pct: 0.37 },
  { name: '2-enter', pct: 0.42 },
  { name: '2-hold', pct: 0.50 },
  { name: '2-exit', pct: 0.57 },
  { name: '3-enter', pct: 0.62 },
  { name: '3-hold', pct: 0.70 },
  { name: '3-exit', pct: 0.77 },
  { name: '4-enter', pct: 0.82 },
  { name: '4-hold', pct: 0.88 },
  { name: '4-exit', pct: 0.93 },
  { name: '5-pentagon', pct: 0.97 },
];

for (const s of shots) {
  const y = sectionTop + scrollable * s.pct;
  await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), y);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `trans-${s.name}.png` });
}

await browser.close();
console.log('Done');
