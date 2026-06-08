import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(800);

const positions = [2500, 2700, 2900];
for (let i = 0; i < positions.length; i++) {
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), positions[i]);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `signal-scroll-${i}.png` });
}
await browser.close();
console.log('Done');
