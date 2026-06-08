import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 3200));
await page.waitForTimeout(500);
await page.screenshot({ path: 'scroll-check.png' });
await browser.close();
console.log('Done');
