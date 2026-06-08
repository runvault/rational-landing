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

const shots = [
  { name: '1-signal', pct: 0.08 },
  { name: '2-context', pct: 0.25 },
  { name: '3-action', pct: 0.42 },
  { name: '4-team', pct: 0.58 },
  { name: '5-knowledge', pct: 0.72 },
  { name: '6-pentagon', pct: 0.95 },
];

for (const s of shots) {
  const y = sectionTop + scrollable * s.pct;
  await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), y);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `domino-${s.name}.png` });
}

await browser.close();
console.log('Done');
