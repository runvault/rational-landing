import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(3000);

// Scroll slowly through the section to trigger all image loads
for (let y = 0; y < 9000; y += 500) {
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(100);
}

// Now scroll back and capture each stage
const section = await page.$('#rationalLoop');
const box = await section.boundingBox();
const sectionTop = box.y + await page.evaluate(() => window.scrollY);
const scrollable = box.height - 900;

const shots = [
  { name: '1-signal', pct: 0.06 },
  { name: '2-context', pct: 0.25 },
  { name: '3-action', pct: 0.42 },
  { name: '4-team', pct: 0.58 },
  { name: '5-knowledge', pct: 0.72 },
  { name: '6-pentagon', pct: 0.95 },
];

for (const s of shots) {
  const y = sectionTop + scrollable * s.pct;
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `final-${s.name}.png` });
}

await browser.close();
console.log('Done');
