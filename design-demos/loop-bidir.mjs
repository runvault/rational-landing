import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(800);

async function scrollAndShot(y, name) {
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `bidir-${name}.png` });
}

// Scroll down to signal section, then back up, then down again
await scrollAndShot(1800, '1-signal-first');
await scrollAndShot(0, '2-back-to-top');
await scrollAndShot(1800, '3-signal-second');

// Scroll to loop stage 3, back up past section, then back down
await scrollAndShot(5500, '4-loop-stage3');
await scrollAndShot(2000, '5-above-loop');
await scrollAndShot(5500, '6-loop-stage3-again');

await browser.close();
console.log('Done');
