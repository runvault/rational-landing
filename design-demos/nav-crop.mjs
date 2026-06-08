import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'nav-crop.png', clip: { x: 0, y: 0, width: 400, height: 150 } });
await browser.close();
console.log('Done');
