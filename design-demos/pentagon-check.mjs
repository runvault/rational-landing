import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('file:///tmp/rational-landing/design-demos/template-final.html');
await page.waitForTimeout(2000);

for (let y = 0; y < 9000; y += 500) {
  await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), y);
  await page.waitForTimeout(80);
}

const el = await page.$('#rationalLoop');
const box = await el.boundingBox();
const sTop = box.y + await page.evaluate(() => window.scrollY);
const scrollable = box.height - 900;
await page.evaluate(v => window.scrollTo({top:v,behavior:'instant'}), sTop + scrollable * 0.97);
await page.waitForTimeout(3000);
await page.screenshot({ path: 'pentagon-final.png' });
await browser.close();
console.log('Done');
