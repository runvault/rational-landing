# Implementation Plan: Rational Loop Section Rework

## Task Type
- [x] Frontend (scroll-driven timeline + orbital pentagon)
- [ ] Backend
- [ ] Fullstack

## Summary

Replace the current simple horizontal flow track (`.flow-section` with 5 `.flow-node` boxes and `setInterval` lit-cycling) with a two-phase scroll-driven experience:

- **Phase 1** — Tall sticky-scroll vertical timeline revealing 5 stages sequentially
- **Phase 2** — Pentagon orbital summary showing all 5 stages as vertices, inspired by radial-orbital-timeline component

## Technical Solution

### Architecture (from Codex analysis)

- **Scroll engine**: `scroll` event + `requestAnimationFrame` throttle, with `IntersectionObserver` to enable/disable work when section is off-screen. NOT ScrollTimeline API (browser support too fragile for production landing page).
- **Layout**: Outer section at `~620vh` height provides scroll runway. Inner `.loop-sticky` (sticky, 100vh) stays in viewport. All panels and orbital live inside sticky container.
- **Progress line**: `transform: scaleY(var(--line-progress))` with `transform-origin: top`. No layout-triggering `height` animation.
- **Orbital rotation**: Pure CSS `@keyframes` on wrapper (48s linear infinite), with counter-rotation on node labels for readability. NOT JS setInterval.
- **Phase transition**: Overlapping scroll zones (0.00–0.82 timeline, 0.78–1.00 pentagon) with crossfade via CSS custom property `--orbital-progress`.

### UX Design (Claude analysis, replacing Gemini)

**Timeline panel hierarchy per stage:**
1. Stage number — DM Serif Display, ~4rem, `var(--t4)` color, goes `var(--warm)` when active
2. Stage title — Inter 600, 1.3rem, `var(--ink)`
3. Description — Inter 400, 0.95rem, `var(--t1)`, max-width 420px
4. Icon — Simple SVG in a 48px circle with `var(--warm-soft)` background, `var(--warm)` stroke

**Animation choreography per stage:**
- Enter: `translateY(28px)` → 0, `opacity 0` → 1, 400ms ease-out, blur(4px) → 0
- Active: full opacity, warm accent on number + icon border
- Complete: opacity dims to 0.35, slight scale(0.97)
- Progress line fills smoothly tracking scroll position

**Pentagon transition:**
- Timeline fades up (`translateY(-24px)`, opacity → 0) as pentagon scales in from center (`scale(0.88)` → `scale(1)`, opacity 0 → 1)
- Pentagon line draws in via `stroke-dashoffset` animation
- Central core pulse appears with radial gradient warm glow
- 400ms overlap zone prevents hard visual cut

**Pentagon node design:**
- 48px circle with warm border, icon inside
- Title label below, Inter 500 0.75rem
- Hover: scale(1.08), box-shadow warm glow
- Container auto-rotates; labels counter-rotate to stay upright

**Mobile strategy:**
- Timeline panels stack vertically, narrower progress line on left edge
- Pentagon radius shrinks from ~200px to ~120px
- No auto-rotation on mobile (simpler, saves battery)
- Use `100svh` for sticky height to handle mobile browser chrome

**Accessibility:**
- `prefers-reduced-motion`: disable rotation, pulse, all CSS animations; keep scroll-driven opacity reveals
- Pentagon nodes are real DOM text (not canvas/decorative)
- Section uses semantic `<article>` for each stage

## Implementation Steps

### Step 1 — Remove old flow section CSS + HTML + JS
**Deliverable:** Clean slate with no `.flow-*` classes, no `setInterval(animateFlow)` JS

Remove:
- CSS: `.flow-section`, `.flow-track`, `.flow-node`, `.flow-node.lit`, `.flow-connector`, `.flow-connector::after`, mobile media queries for flow
- HTML: The `<!-- Flow Visualization -->` section with `#flowTrack`
- JS: `flowNodes`, `flowIndex`, `animateFlow()`, `setInterval(animateFlow, 1200)`

### Step 2 — Add new section CSS
**Deliverable:** Complete CSS for `.loop-*` classes

```
.flow-section { height: 620vh; background: var(--cream); position: relative; overflow: clip; }
.loop-sticky { position: sticky; top: 0; height: 100svh; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.loop-header { position: absolute; top: 12vh; left: 50%; transform: translateX(-50%); text-align: center; z-index: 2; }
.loop-timeline { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding-left: clamp(4rem, 12vw, 10rem); transition: opacity 0.4s ease, transform 0.4s ease; }
.loop-progress { position: absolute; left: clamp(1.5rem, 8vw, 8rem); top: 18vh; bottom: 16vh; width: 1px; background: var(--t5); }
.loop-progress-fill { position: absolute; inset: 0; background: var(--warm); transform-origin: top; transform: scaleY(0); }
.loop-panel { position: absolute; left: 0; opacity: 0; transform: translateY(28px); transition: opacity 0.4s ease, transform 0.4s ease; }
.loop-panel.is-active { opacity: 1; transform: translateY(0); }
.loop-panel.is-complete { opacity: 0.35; transform: scale(0.97); }
.loop-panel-number { font-family: var(--font-heading); font-size: clamp(2.5rem, 5vw, 4rem); color: var(--t4); line-height: 1; margin-bottom: 0.5rem; transition: color 0.4s ease; }
.loop-panel.is-active .loop-panel-number { color: var(--warm); }
.loop-panel-title { font-size: 1.3rem; font-weight: 600; color: var(--ink); margin-bottom: 0.6rem; }
.loop-panel-desc { font-size: 0.95rem; color: var(--t1); line-height: 1.7; max-width: 420px; }
.loop-panel-icon { width: 48px; height: 48px; border-radius: 50%; background: var(--warm-soft); border: 1.5px solid var(--warm); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
.loop-panel-icon svg { width: 22px; height: 22px; stroke: var(--warm); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }

/* Orbital pentagon */
.loop-orbital { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.88); pointer-events: none; transition: opacity 0.5s ease, transform 0.5s ease; }
.loop-orbital.is-visible { opacity: 1; transform: scale(1); pointer-events: auto; }
.orbit-core { width: 56px; height: 56px; border-radius: 50%; background: radial-gradient(circle, var(--warm) 0%, rgba(196,136,58,0.3) 60%, transparent 100%); position: absolute; z-index: 3; }
.orbit-core-ring { position: absolute; border-radius: 50%; border: 1px solid var(--warm-glow); animation: corePulse 3s ease-in-out infinite; }
.orbit-core-ring:nth-child(1) { width: 72px; height: 72px; inset: -8px; }
.orbit-core-ring:nth-child(2) { width: 88px; height: 88px; inset: -16px; animation-delay: 1s; }
@keyframes corePulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.15); } }
.orbit-rotor { position: absolute; width: 100%; height: 100%; animation: orbitSpin 48s linear infinite; }
@keyframes orbitSpin { to { transform: rotate(360deg); } }
.orbit-lines { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
.orbit-pentagon-line { fill: none; stroke: var(--t4); stroke-width: 0.7; vector-effect: non-scaling-stroke; stroke-dasharray: 320; stroke-dashoffset: 320; transition: stroke-dashoffset 1.2s ease; }
.loop-orbital.is-visible .orbit-pentagon-line { stroke-dashoffset: 0; }
.orbit-node { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); cursor: default; z-index: 2; }
.orbit-node-inner { animation: orbitSpinReverse 48s linear infinite; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
@keyframes orbitSpinReverse { to { transform: rotate(-360deg); } }
.orbit-node-circle { width: 44px; height: 44px; border-radius: 50%; background: var(--paper); border: 1.5px solid var(--t4); display: flex; align-items: center; justify-content: center; transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease; }
.orbit-node-circle svg { width: 20px; height: 20px; stroke: var(--t2); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.orbit-node:hover .orbit-node-circle { border-color: var(--warm); box-shadow: 0 0 0 4px var(--warm-glow); transform: scale(1.08); }
.orbit-node:hover .orbit-node-circle svg { stroke: var(--warm); }
.orbit-node-label { font-size: 0.7rem; font-weight: 500; color: var(--t2); white-space: nowrap; text-align: center; }
.orbit-node:hover .orbit-node-label { color: var(--ink); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .orbit-rotor, .orbit-node-inner, .orbit-core-ring { animation: none !important; }
  .loop-panel { transition: none !important; }
}

/* Mobile */
@media (max-width: 768px) {
  .flow-section { height: 500vh; }
  .loop-sticky { height: 100svh; }
  .loop-timeline { padding-left: 3rem; }
  .loop-progress { left: 1rem; }
  .orbit-rotor, .orbit-node-inner { animation: none; }
}
```

### Step 3 — Add new section HTML
**Deliverable:** Replace flow visualization HTML

Replace `<!-- Flow Visualization -->` section with:
- `.flow-section#rationalLoop` outer (620vh)
- `.loop-sticky` inner (sticky 100vh)
- `.loop-header` with section label + heading
- `.loop-progress` rail with `.loop-progress-fill`
- 5x `.loop-panel` articles with number, icon, title, description
- `.loop-orbital` containing: `.orbit-core` + pulse rings, `.orbit-rotor` with SVG pentagon lines and 5x `.orbit-node`

Stage content:
1. **Signal detected** — "Your tools generate hundreds of signals daily. Emails, deadlines, status changes, capacity shifts."
2. **Context loaded** — "Rational pulls the full picture: client history, team capacity, preferences, and priorities."
3. **Best action determined** — "Every option is scored. Williams: 92% fit — industry match, Tuesday AM available."
4. **Team coordinated** — "The right person gets the right task through their preferred channel. No chasing."
5. **Knowledge compounded** — "Every correction becomes permanent. Week 4 is measurably sharper than week 1."

Icons (inline SVG): eye, database/layers, brain/lightbulb, users, trending-up

### Step 4 — Add new section JS
**Deliverable:** Scroll-driven animation logic

Key functions:
- `updateLoopScroll()` — calculate raw progress from section rect, split into timeline (0–0.82) and orbital (0.78–1.00) phases
- `updatePanels(t)` — per-panel local progress, set is-active/is-complete classes, opacity/transform
- `updateOrbital(p)` — set --orbital-progress custom property, toggle is-visible class
- `positionPentagonNodes()` — trigonometric placement of 5 nodes at -90° + i*72° offsets
- `smoothstep(edge0, edge1, x)` — easing utility
- IntersectionObserver to enable/disable scroll handler when section off-screen
- Call `positionPentagonNodes()` on load and resize

Integrate into existing `onScroll()` handler (add `updateLoopScroll()` call).

Remove old JS: `flowNodes`, `flowIndex`, `animateFlow()`, `setInterval(animateFlow, 1200)`.

### Step 5 — Screenshot verification
**Deliverable:** Visual verification at multiple scroll positions

Test positions: start of section, each stage active, transition zone, pentagon fully visible. Verify:
- Progress line fills correctly
- Panels reveal/dim properly
- Pentagon draws in smoothly
- No JS errors
- Mobile viewport test

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| template-final.html:388-448 | Replace | Remove old `.flow-*` CSS, add `.loop-*` and `.orbit-*` CSS |
| template-final.html:~780-800 | Replace | Remove old flow HTML, add new timeline + orbital HTML |
| template-final.html:~960-975 | Replace | Remove old flow JS, add scroll-driven animation logic |

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| 620vh section makes progress bar move very slowly | Acceptable tradeoff; the section IS the main content |
| Mobile 100vh instability with browser chrome | Use `100svh` with fallback |
| Pentagon labels crowded on small screens | Reduce radius to 120px, shorter labels, no rotation on mobile |
| Nav background needs to match cream through entire section | Already handled by dynamic nav color detection |
| Old flow JS `setInterval` left running | Explicitly remove in Step 1 |
| Pentagon node hover distracts on touch devices | No hover effects on touch; pointer: coarse media query |

## SESSION_ID (for /ccg:execute use)
- CODEX_SESSION: 019ea5df-a97c-79d2-bfed-5574a4cd4da3
- GEMINI_SESSION: (failed — UX analysis done by Claude directly)
