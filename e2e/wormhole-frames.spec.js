/**
 * Wormhole Frame-Capture Harness
 *
 * Scrolls the wormhole section through its full scroll range in 50 fine steps,
 * captures a screenshot clipped to the canvas at each position, saves PNGs to
 * artifacts/wormhole-frames/, then analyses them for:
 *   (a) blank / near-white frames
 *   (b) duplicate consecutive frames (animation stall)
 *   (c) large abrupt pixel deltas between adjacent steps (visual pops)
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default;

const FRAME_DIR = path.join(__dirname, '..', 'artifacts', 'wormhole-frames');
const NUM_STEPS = 50;
// pixelmatch threshold 0.1 = tight; 0.3 = loose
const DUP_THRESHOLD = 0.005;   // fraction of pixels that differ — below this = duplicate
const POP_THRESHOLD = 0.35;    // fraction of pixels that differ — above this = abrupt pop
// % of pixels below RGB 250 to be considered "not blank"
const BLANK_NONWHITE_MIN = 0.02;

// ---- helpers ----

function parsePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  return PNG.sync.read(buf);
}

function compareFrames(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`Dimension mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
    includeAA: false,
  });
  const total = a.width * a.height;
  return { changed, total, fraction: changed / total };
}

function isBlank(png) {
  const data = png.data;
  let nonWhite = 0;
  // Sample every 8th pixel (RGBA stride = 4)
  for (let i = 0; i < data.length; i += 32) {
    if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) nonWhite++;
  }
  const total = data.length / 32;
  return nonWhite / total < BLANK_NONWHITE_MIN;
}

// ---- setup ----

test.beforeAll(() => {
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  // Clean previous run
  fs.readdirSync(FRAME_DIR).forEach(f => {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAME_DIR, f));
  });
});

// ---- capture test ----

test('capture wormhole frames across full scroll range', async ({ page }) => {
  test.setTimeout(120000);

  // Collect JS errors
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Wait for Three.js module scripts to initialise (imports from CDN can take a moment)
  await page.waitForFunction(() => {
    const c = document.getElementById('wormholeCanvas');
    return c && c.width > 0 && c.height > 0;
  }, { timeout: 20000 });

  // Set a fixed viewport so canvas dims are consistent
  await page.setViewportSize({ width: 1280, height: 800 });

  // Get the section's scroll range before scrolling
  const { sectionTop, sectionHeight, viewportHeight } = await page.evaluate(() => {
    const el = document.getElementById('rationalLoop');
    const offsetTop = el.offsetTop;
    return {
      sectionTop: offsetTop,
      sectionHeight: el.offsetHeight,
      viewportHeight: window.innerHeight,
    };
  });

  const scrollable = sectionHeight - viewportHeight;
  expect(scrollable).toBeGreaterThan(0);

  // Scroll to the START of the section (forward only, never backward)
  await page.evaluate((y) => window.scrollTo(0, y), sectionTop);
  // Wait for IntersectionObserver to fire, rAF to start, and first frame to render
  await page.waitForTimeout(800);

  // Verify canvas is visible and sized
  const canvasBounds = await page.evaluate(() => {
    const c = document.getElementById('wormholeCanvas');
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });
  expect(canvasBounds.width).toBeGreaterThan(100);
  expect(canvasBounds.height).toBeGreaterThan(100);

  const framePaths = [];

  // Fixed clip dimensions for ALL frames — re-measuring per step lets
  // sub-pixel rounding produce off-by-one dims that break frame comparison.
  const clipDims = {
    width: Math.floor(canvasBounds.width),
    height: Math.floor(canvasBounds.height),
  };

  for (let step = 0; step < NUM_STEPS; step++) {
    const fraction = step / (NUM_STEPS - 1);  // 0..1 inclusive
    const targetScrollY = sectionTop + fraction * scrollable;

    await page.evaluate((y) => window.scrollTo(0, y), targetScrollY);
    // Wait for scroll event to propagate + at least 3 rAF cycles at 60fps
    await page.waitForTimeout(80);

    // Re-query canvas position after scroll (y offset changes), keep dims fixed
    const pos = await page.evaluate(() => {
      const c = document.getElementById('wormholeCanvas');
      const r = c.getBoundingClientRect();
      return { x: Math.floor(r.left), y: Math.floor(r.top) };
    });

    const frameName = `frame-${String(step).padStart(3, '0')}.png`;
    const framePath = path.join(FRAME_DIR, frameName);

    await page.screenshot({
      path: framePath,
      clip: { x: pos.x, y: pos.y, ...clipDims },
    });

    framePaths.push(framePath);
  }

  expect(framePaths.length).toBe(NUM_STEPS);
  console.log(`Captured ${framePaths.length} frames to ${FRAME_DIR}`);

  // No JS errors during capture
  expect(jsErrors).toEqual([]);
});

// ---- analysis test ----

test('analyse captured frames: no blanks, no stalls, no pops', async () => {
  test.setTimeout(60000);
  // Load all frames
  const files = fs.readdirSync(FRAME_DIR)
    .filter(f => f.startsWith('frame-') && f.endsWith('.png'))
    .sort();

  // Need frames from the capture test
  expect(files.length).toBeGreaterThanOrEqual(NUM_STEPS);

  const allFrames = files.map(f => ({ file: f, png: parsePNG(path.join(FRAME_DIR, f)) }));

  // Filter to the majority dimensions (handles leftover frames from prior viewport runs)
  const dimCounts = {};
  allFrames.forEach(({ png }) => {
    const key = `${png.width}x${png.height}`;
    dimCounts[key] = (dimCounts[key] || 0) + 1;
  });
  const majorityDim = Object.entries(dimCounts).sort((a, b) => b[1] - a[1])[0][0];
  console.log('Frame dimensions:', JSON.stringify(dimCounts), '— using', majorityDim);
  const filteredFrames = allFrames.filter(({ png }) => `${png.width}x${png.height}` === majorityDim);
  // Edge steps can be viewport-clamped (sticky canvas entering/exiting),
  // producing one off-dimension frame — tolerate a single dropped frame.
  expect(filteredFrames.length).toBeGreaterThanOrEqual(NUM_STEPS - 1);

  const frames = filteredFrames.map(f => f.png);
  const fileLabels = filteredFrames.map(f => f.file);

  const blankFrames = [];
  const dupFrames = [];
  const popFrames = [];

  for (let i = 0; i < frames.length; i++) {
    const label = fileLabels[i];

    // (a) Blank check — skip frame-000 (scroll=0 startup, rAF may not have fired yet)
    if (i > 0 && isBlank(frames[i])) {
      blankFrames.push({ index: i, file: label });
    }

    // (b) Duplicate / stall check + (c) Pop check
    if (i > 0) {
      const { fraction } = compareFrames(frames[i - 1], frames[i]);
      if (fraction < DUP_THRESHOLD) {
        dupFrames.push({ index: i, file: label, fraction });
      }
      if (fraction > POP_THRESHOLD) {
        popFrames.push({ index: i, file: label, fraction });
      }
    }
  }

  // Report findings before asserting
  if (blankFrames.length > 0) {
    console.error('BLANK frames:', JSON.stringify(blankFrames));
  }
  if (dupFrames.length > 0) {
    console.warn('DUPLICATE/STALL frames:', JSON.stringify(dupFrames));
  }
  if (popFrames.length > 0) {
    console.error('ABRUPT POP frames:', JSON.stringify(popFrames));
  }

  // Allow first and last step to be near-duplicates (camera barely moves at extremes)
  const midDups = dupFrames.filter(d => d.index > 2 && d.index < frames.length - 2);

  // Assertions
  // Blank frames are hard failures — the animation should always render
  expect(blankFrames).toHaveLength(0);

  // Mid-animation stalls are failures
  expect(midDups).toHaveLength(0);

  // Hard pops are failures
  expect(popFrames).toHaveLength(0);
});
