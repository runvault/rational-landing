import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(600);

// Scroll through entire page to trigger all IntersectionObservers
for (let i = 0; i < 20; i++) {
  await page.evaluate(v => window.scrollTo(0, v), i * 500);
  await page.waitForTimeout(100);
}
// Scroll to absolute bottom
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

await page.screenshot({ path: 'template-final-screenshot.png', fullPage: true });
await browser.close();
console.log('Done');
