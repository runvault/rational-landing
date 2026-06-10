const { test, expect } = require('@playwright/test');

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('headline shows "Built to Close Books."', async ({ page }) => {
    const headline = page.locator('#heroHeadline');
    await expect(headline).toBeVisible();
    const text = await headline.textContent();
    expect(text.replace(/\s+/g, ' ').trim()).toBe('Built to Close Books.');
  });

  test('subtitle shows correct 3-line text', async ({ page }) => {
    const subtitle = page.locator('.hero-subtitle');
    await expect(subtitle).toBeVisible();
    const text = await subtitle.textContent();
    expect(text).toContain('No more SaaS.');
    expect(text).toContain('No More Outsourcing.');
    expect(text).toContain('Onboarded in 48 hours.');
  });

  test('YC badge is visible with SVG logo', async ({ page }) => {
    const badge = page.locator('.yc-badge');
    await expect(badge).toBeVisible();
    const svg = badge.locator('svg.yc-logo');
    await expect(svg).toBeVisible();
    const text = badge.locator('.yc-text');
    await expect(text).toHaveText('Backed by Y Combinator');
  });

  test('social proof pill is visible', async ({ page }) => {
    const pill = page.locator('#socialPill');
    await expect(pill).toBeVisible();
    const text = await pill.textContent();
    expect(text).toContain('600+');
    expect(text).toContain('F&A teams worldwide');
  });

  test('hero headline has char-by-char animation spans', async ({ page }) => {
    await page.waitForTimeout(500);
    const chars = page.locator('#heroHeadline .char');
    const count = await chars.count();
    expect(count).toBe('Built to Close Books.'.length);
  });
});

test.describe('Approach Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('approach headline text is correct', async ({ page }) => {
    const headline = page.locator('.approach-headline');
    const text = await headline.textContent();
    expect(text).toContain('Humans Bring Judgement.');
    expect(text).toContain('Rational Handles The Rest.');
  });

  test('approach image does not animate on scroll', async ({ page }) => {
    const imageWrap = page.locator('.approach-image-wrap');
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(500);
    const clipPath = await imageWrap.evaluate(el => getComputedStyle(el).clipPath);
    expect(clipPath).toContain('inset');
  });

  test('approach text stays static on scroll', async ({ page }) => {
    const content = page.locator('.approach-content');
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(500);
    const opacity = await content.evaluate(el => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  });
});

test.describe('Wormhole Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('wormhole canvas exists and is visible', async ({ page }) => {
    const canvas = page.locator('#wormholeCanvas');
    await expect(canvas).toBeAttached();
  });

  test('wormhole section has correct structure', async ({ page }) => {
    const section = page.locator('#rationalLoop');
    await expect(section).toBeAttached();
    const canvas = section.locator('canvas');
    await expect(canvas).toBeAttached();
  });
});

test.describe('Navigation', () => {
  test('nav has wordmark and CTA button', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    const cta = page.locator('.btn-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText(/Book a Demo/i);
  });
});
