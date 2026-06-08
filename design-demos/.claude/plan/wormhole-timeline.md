# Plan: Three.js Wormhole Timeline

## Task Type
- [x] Frontend (Three.js + HTML/CSS)

## Overview
Replace the entire Rational Loop section (lines 973-1087 + all related CSS/JS) with a Three.js wireframe wormhole tunnel. The camera moves through the wormhole as the user scrolls. At 5 waypoints along the tunnel, HTML content panels appear with the existing stage content (Signal detected → Knowledge compounded). No orbital/pentagon — the wormhole IS the visualization.

## Reference
- Source: `ketan1406/threejs-wireframe-wormhole` cloned at `/tmp/threejs-wireframe-wormhole/`
- Key files: `src/main.js` (scene setup, geometry, camera), `src/spline.js` (CatmullRomCurve3 path)

## Color Mapping (original → Rational)
| Element | Original | Rational |
|---------|----------|----------|
| Fog | `0x000000` (black) | `0x0D0A07` (near-black warm) |
| Tube wireframe | `0x3d85c6` (blue) | `0xC4883A` (--warm gold) |
| Glow vertices | `0x8e7cc3` (purple) | `0xD4A853` (bright gold) |
| Floating boxes | HSL gradient | `0xC4883A` to `0xF3EDE4` (warm→cream gradient) |
| Torus knots | `0xff69b4` (pink) | `0xC4883A` (warm) with emissive |
| Bloom | strength 3.5 | strength 2.5 (subtler, premium feel) |

## Technical Solution

### Three.js Loading (no build step)
Use ES module importmap in `<head>`:
```html
<script type="importmap">
{ "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/"
}}
</script>
```

### Scroll-Driven Camera (replaces auto-fly)
```js
// Map section scroll progress (0→1) to spline position
const progress = clamp(-sectionRect.top / scrollable, 0, 1);
const pos = spline.getPointAt(progress);
const lookAt = spline.getPointAt(Math.min(progress + 0.02, 1));
camera.position.copy(pos);
camera.lookAt(lookAt);
```

### 5 Waypoints for Content Panels
| Stage | Scroll % | Content |
|-------|----------|---------|
| 0 | 10-25% | Signal detected |
| 1 | 25-40% | Context loaded |
| 2 | 40-55% | Best action determined |
| 3 | 55-70% | Team coordinated |
| 4 | 70-85% | Knowledge compounded |
| End | 85-100% | "The Rational Loop" summary text |

Each panel fades in/out with opacity based on scroll progress within its range.

## Implementation Steps

### Step 1: Add Three.js CDN importmap
- Add `<script type="importmap">` in `<head>` with three.js 0.171.0
- Add Three.js init script as `<script type="module">` at end of body

### Step 2: Replace section HTML
- Remove entire `<section class="flow-section" id="rationalLoop">` (lines 973-1087)
- Replace with:
  - `<section class="wormhole-section" id="rationalLoop">` — 1200vh tall
  - `<div class="wormhole-sticky">` — sticky viewport container
  - `<canvas id="wormholeCanvas">` — Three.js render target
  - `<div class="wormhole-overlay">` — HTML content layer on top
  - 5x `<div class="wormhole-panel" data-stage="0-4">` — content cards
  - `<div class="wormhole-summary">` — end label

### Step 3: Replace section CSS
- Remove ALL `.flow-section`, `.loop-*`, `.orbit-*` CSS rules
- Add `.wormhole-section`, `.wormhole-sticky`, `.wormhole-panel` CSS
- Panels: translucent dark bg, white/cream text, backdrop-blur for readability over the 3D scene
- Panel styling: `background: rgba(13,10,7,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(196,136,58,0.3);`

### Step 4: Three.js scene setup
- Copy spline data from `src/spline.js` (the CatmullRomCurve3 points)
- Create scene, camera, renderer targeting `#wormholeCanvas`
- **Fog**: `FogExp2(0x0D0A07, 0.3)`
- **Tube**: `TubeGeometry(spline, 222, 0.65, 16, true)` → `EdgesGeometry` → `LineSegments` with warm gold
- **Glow vertices**: Same shader, gold color `0xD4A853`
- **Floating boxes**: 55 boxes with warm→cream HSL gradient
- **Torus knots**: 25 scattered, warm gold emissive
- **Post-processing**: `EffectComposer` + `RenderPass` + `UnrealBloomPass(strength: 2.5)`

### Step 5: Scroll-driven camera + panel visibility
- Replace `updateCamera(t)` auto-fly with scroll listener
- On scroll: compute progress (0→1) from section position
- Move camera along spline: `spline.getPointAt(progress)`
- Show/hide panels based on which waypoint range progress falls in
- Render with `composer.render()` on each scroll frame (via rAF)

### Step 6: Remove old loop JS
- Remove `updateLoopScroll()`, `positionPentagonNodes()`, all loop-related observers
- Keep: scroll listener that drives the new wormhole camera
- Keep: `loopActive` IntersectionObserver pattern (only render Three.js when section is in view — GPU savings)

### Step 7: Accessibility + performance
- `prefers-reduced-motion`: disable Three.js, show flat fallback (static panels, no 3D)
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — cap DPR
- Only call `composer.render()` when section is in viewport (`loopActive` flag)
- Dispose Three.js resources when section leaves viewport for extended time

## Key Files
| File | Operation | Description |
|------|-----------|-------------|
| template-final.html:1-10 | Modify | Add importmap for Three.js CDN |
| template-final.html:388-643 | Replace | Remove old loop/orbit CSS, add wormhole CSS |
| template-final.html:973-1087 | Replace | Remove old loop HTML, add wormhole HTML |
| template-final.html:1200-1440 | Replace | Remove old loop JS, add Three.js wormhole init |

## Risks and Mitigation
| Risk | Mitigation |
|------|------------|
| Three.js ~160KB load | CDN-cached, deferred loading, only init when section near viewport |
| GPU-intensive on mobile | Cap DPR at 2, reduce segments on mobile, `prefers-reduced-motion` fallback |
| Dark section breaks page flow | Smooth background-color transition from paper→dark before section, dark→paper after |
| Content readability over 3D | Translucent dark panels with backdrop-blur, high-contrast text |

## SESSION_ID
- CODEX_SESSION: (none — single-model plan)
- GEMINI_SESSION: (none)
