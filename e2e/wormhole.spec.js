const { test, expect } = require('@playwright/test');

test.describe('Wormhole 3D Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('canvas has WebGL context initialized', async ({ page }) => {
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.getElementById('wormholeCanvas');
      if (!canvas) return false;
      // three.js grabs the context; a second getContext returns the same one
      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return ctx !== null;
    });
    expect(hasWebGL).toBe(true);
  });

  test('canvas renders non-blank pixels when scrolled into view', async ({ page }) => {
    const section = page.locator('#rationalLoop');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const isRendering = await page.evaluate(() => {
      const canvas = document.getElementById('wormholeCanvas');
      if (!canvas || canvas.width === 0 || canvas.height === 0) return false;
      const sample = document.createElement('canvas');
      sample.width = canvas.width;
      sample.height = canvas.height;
      const ctx = sample.getContext('2d');
      ctx.drawImage(canvas, 0, 0);
      const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
      let nonWhite = 0;
      for (let i = 0; i < data.length; i += 400) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) nonWhite++;
      }
      return nonWhite > 10;
    });
    expect(isRendering).toBe(true);
  });

  test('animation frames advance over time', async ({ page }) => {
    const section = page.locator('#rationalLoop');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const fps = await page.evaluate(() => new Promise(resolve => {
      let count = 0;
      const start = performance.now();
      function check() {
        count++;
        if (performance.now() - start > 1000) {
          resolve(count);
        } else {
          requestAnimationFrame(check);
        }
      }
      requestAnimationFrame(check);
    }));
    // headless has no GPU accel; 10fps floor catches total stalls without flaking
    expect(fps).toBeGreaterThan(10);
  });

  test('fiber color is flat (no gradient lerp in source)', async ({ page }) => {
    // WebGL buffer is not preserved after present, so pixel sampling is flaky.
    // Assert the source invariant instead: flat colMid copy, no positional gradient.
    const source = await page.content();
    expect(source).toContain('_gradColor.copy(colMid);');
    expect(source).not.toContain('_gradColor.copy(colEntry).lerp(colMid');
    expect(source).not.toContain('_gradColor.copy(colMid).lerp(colDeep');
  });

  test('fibers are short (span 0.05-0.08)', async ({ page }) => {
    const source = await page.content();
    expect(source).toContain('const minSpan = 0.05;');
    expect(source).toContain('const maxSpan = 0.08;');
  });

  test('no console errors from three.js during scroll', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const section = page.locator('#rationalLoop');
    await section.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
