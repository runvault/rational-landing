import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`file:///tmp/rational-landing/design-demos/template-final.html`);
await page.waitForTimeout(800);

// Scroll to where signal section is ~50% through viewport
await page.evaluate(() => {
  const el = document.getElementById('signalSection');
  const top = el.offsetTop;
  window.scrollTo(0, top - window.innerHeight * 0.3);
});
await page.waitForTimeout(300);

// Check glow state
const glowState = await page.evaluate(() => {
  const glows = document.querySelectorAll('[class^="cpu-line-"]');
  return Array.from(glows).map((g, i) => ({
    class: g.className,
    offsetDistance: g.style.offsetDistance,
    opacity: g.style.opacity
  }));
});
console.log('Glow states:', JSON.stringify(glowState, null, 2));

await page.screenshot({ path: 'signal-glow-mid.png' });
await browser.close();
console.log('Done');
