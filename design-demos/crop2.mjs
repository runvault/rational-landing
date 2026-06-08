import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(600);

for (let i = 0; i < 30; i++) {
  await page.evaluate(v => window.scrollTo(0, v), i * 500);
  await page.waitForTimeout(100);
}

// Signal section
const signalEl = await page.$('#signalSection');
await signalEl.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await signalEl.screenshot({ path: 'signal-crop.png' });

// Flow section
const flowEl = await page.$('.flow-section');
await flowEl.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await flowEl.screenshot({ path: 'flow-crop.png' });

await browser.close();
console.log('Done');
