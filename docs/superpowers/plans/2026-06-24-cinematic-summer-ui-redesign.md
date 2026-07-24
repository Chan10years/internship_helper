# Cinematic Summer UI Redesign Implementation Plan

> Archive note: this was the implementation plan for the 2026-06-24 UI redesign. It is historical context only. Current Web UI authority lives in `docs/06_WEB_UI_SPEC.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the internship browser as a cinematic, editorial experience for low-year students seeking first-time or zero-experience summer internships while preserving all existing job discovery behavior.

**Architecture:** Keep the existing Express API and native static frontend. Replace the page structure and styling, expand the existing client-side state machine for the filter drawer and detail overlay, and add a small set of local cinematic images that map deterministically across jobs.

**Tech Stack:** Native HTML, CSS, JavaScript, Node.js test runner, Express, locally stored raster images.

**Project constraints:** Work in the current workspace because Git modifications and worktrees are forbidden without separate approval. Do not install dependencies. Do not modify crawler, storage, scoring, or data files.

---

### Task 1: Lock the redesigned UI contract with failing tests

**Files:**
- Modify: `tests/ui.test.ts`
- Test: `tests/ui.test.ts`

- [ ] **Step 1: Add semantic structure assertions**

Add tests that require:

```ts
assert.match(html, /class="hero"/);
assert.match(html, /id="filterDrawer"/);
assert.match(html, /id="jobList"/);
assert.match(html, /id="jobStage"/);
assert.match(html, /id="detailDialog"/);
assert.match(html, />INTERNSHIP</);
assert.doesNotMatch(html, /SUMMER 2026/);
```

- [ ] **Step 2: Add interaction and safety assertions**

Add tests that require:

```ts
assert.match(script, /prefers-reduced-motion/);
assert.match(script, /Escape/);
assert.match(script, /aria-expanded/);
assert.match(script, /safeHttpUrl/);
assert.match(script, /textContent/);
assert.doesNotMatch(script, /\.innerHTML\s*=/);
```

- [ ] **Step 3: Run the UI test and verify RED**

Run:

```powershell
npm run test -- tests/ui.test.ts
```

Expected: FAIL because the cinematic structure and overlay behavior do not exist yet.

### Task 2: Generate and persist the cinematic image set

**Files:**
- Create: `src/server/public/assets/hero-campus-city.png`
- Create: `src/server/public/assets/stage-transit.png`
- Create: `src/server/public/assets/stage-making.png`

- [ ] **Step 1: Generate the hero image**

Use the built-in image generator for a wide editorial photograph:

```text
A cinematic summer coming-of-age still of a Chinese university student leaving a campus gate toward the city, candid movement, backpack and laptop, warm late-afternoon natural light, subtle 35mm grain, slightly imperfect documentary framing, sophisticated fashion-editorial color grade, generous dark and quiet negative space for oversized Chinese typography, no logos, no readable text, no business suits, no stock-photo smile.
```

- [ ] **Step 2: Generate the transit image**

Use the built-in image generator for a wide editorial photograph:

```text
A cinematic candid still of low-year Chinese university students on their first city commute, viewed through a bus or metro window with reflections, summer daylight, backpacks and headphones, curious rather than professional mood, subtle motion blur and 35mm grain, restrained editorial color grade, negative space for large typography, no logos, no readable text, no suits, no corporate stock-photo posing.
```

- [ ] **Step 3: Generate the making image**

Use the built-in image generator for a wide editorial photograph:

```text
A cinematic natural-light still of a Chinese university student experimenting at a shared desk with a laptop, notebook, rough sketches and headphones, first-project energy rather than polished office work, summer window light, tactile paper and screen reflections, subtle film grain, fashion-editorial composition with strong crop and negative space, no logos, no readable text, no meeting-room stock imagery.
```

- [ ] **Step 4: Copy generated images into the project**

Copy, do not delete, the selected generated PNGs into the exact asset paths above.

- [ ] **Step 5: Inspect the three saved assets**

Confirm each image:

- is landscape;
- contains no readable text or identifiable logo;
- feels youthful rather than corporate;
- leaves usable space for oversized page typography.

### Task 3: Build the cinematic semantic page shell

**Files:**
- Modify: `src/server/public/index.html`
- Test: `tests/ui.test.ts`

- [ ] **Step 1: Replace the old toolbar/table markup**

Create semantic regions with these stable contracts:

```html
<header class="hero" id="top">
  <nav class="hero-nav" aria-label="主导航">
    <a class="brand" href="#top">INTERNSHIP</a>
    <button id="openFiltersButton" aria-expanded="false" aria-controls="filterDrawer">筛选岗位</button>
  </nav>
  <div class="hero-copy">
    <p id="heroMeta">正在读取岗位...</p>
    <h1><span>不用准备好，</span><span>先去看看。</span></h1>
    <a href="#jobs">开始找实习</a>
  </div>
</header>
<main id="jobs">
  <section class="job-browser">
    <div class="job-index">
      <p id="resultSummary"></p>
      <div id="jobList" role="list"></div>
      <p id="emptyState" hidden></p>
    </div>
    <article id="jobStage" aria-live="polite"></article>
  </section>
</main>
```

- [ ] **Step 2: Add the filter drawer**

Include the existing control IDs inside `#filterDrawer`:

```html
searchInput
cityFilter
sourceFilter
companyFilter
tagFilter
sortScoreButton
clearFiltersButton
closeFiltersButton
```

The drawer must have an accessible heading and be hidden by default.

- [ ] **Step 3: Add the detail dialog**

Add:

```html
<section id="detailDialog" role="dialog" aria-modal="true" aria-labelledby="detailTitle" hidden>
  <button id="closeDetailButton" type="button">关闭</button>
  <div id="detailContent"></div>
</section>
```

- [ ] **Step 4: Run the UI test**

Run:

```powershell
npm run test -- tests/ui.test.ts
```

Expected: structural assertions pass; JavaScript behavior assertions may still fail.

### Task 4: Implement filtering, selection, drawer, and detail behavior

**Files:**
- Modify: `src/server/public/app.js`
- Test: `tests/ui.test.ts`

- [ ] **Step 1: Preserve the existing data behavior**

Keep these rules:

- search title, company, city, description, tags, and raw text;
- filter city, source, company, and tag;
- sort scored jobs descending with unscored jobs last;
- use `safeHttpUrl`;
- render untrusted job content with DOM nodes and `textContent`.

- [ ] **Step 2: Render editorial list buttons**

Each item in `#jobList` must be a keyboard-operable button with:

```text
index, title, company, city, salary, score or 未评分
```

Selecting an item updates `selectedId`, selected state, and `#jobStage`.

- [ ] **Step 3: Render the cinematic job stage**

Map each job deterministically to one of the three images using a stable string hash of job ID. Render:

```text
source, company, city, title, salary, duration, education,
work days, match score, short description, 查看完整岗位
```

Use an image class or CSS custom property rather than injecting HTML.

- [ ] **Step 4: Implement drawer state**

Opening the drawer must:

- remove its `hidden` state;
- set `aria-expanded="true"` on the trigger;
- move focus to the search input.

Closing it must reverse those states and return focus to the trigger.

- [ ] **Step 5: Implement detail state**

Opening the detail view must:

- render the full job detail;
- remove `hidden`;
- move focus to the close button.

Closing must restore `hidden` and return focus to the detail trigger.

- [ ] **Step 6: Implement keyboard behavior**

On `Escape`, close the topmost open layer. Detect reduced motion with:

```js
window.matchMedia("(prefers-reduced-motion: reduce)")
```

- [ ] **Step 7: Run the UI test and verify GREEN**

Run:

```powershell
npm run test -- tests/ui.test.ts
```

Expected: PASS.

### Task 5: Implement the cinematic editorial styling

**Files:**
- Modify: `src/server/public/style.css`
- Test: `tests/ui.test.ts`

- [ ] **Step 1: Define the restrained token system**

Use:

```css
--ink: #11110f;
--paper: #f2f0e9;
--muted: #c8c5bc;
--graphite: #34332f;
--signal: #e9b52b;
--signal-alt: #e85a2a;
```

- [ ] **Step 2: Build the hero**

The hero must:

- fill the first viewport;
- use `hero-campus-city.png`;
- use a dark image overlay for text contrast;
- place the enormous two-line title at the lower edge;
- crop typography intentionally;
- keep navigation minimal and square-edged.

- [ ] **Step 3: Build the editorial job browser**

Desktop:

- use an approximately `40 / 60` split;
- keep the list visually flat with rules rather than cards;
- make the stage near viewport height;
- overlay large title typography on the image;
- reveal metadata as small editorial captions.

- [ ] **Step 4: Build overlays**

The drawer and detail view must:

- use paper/ink contrast;
- avoid glass blur and floating card styling;
- occupy most or all of the viewport;
- use readable long-form typography.

- [ ] **Step 5: Add one orchestrated motion system**

Implement:

- hero image settle;
- staggered hero text reveal;
- stage content transition;
- drawer/detail slide transition.

Use only opacity and transforms where practical.

- [ ] **Step 6: Add reduced-motion and responsive rules**

At mobile widths:

- convert the browser to a single-column poster flow;
- keep touch targets at least 44px;
- reduce, but retain, the oversized typographic signature.

For reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Task 6: Verify behavior and visual quality

**Files:**
- Review: `src/server/public/index.html`
- Review: `src/server/public/style.css`
- Review: `src/server/public/app.js`
- Review: `docs/08_ACCEPTANCE_CHECKLIST.md`

- [ ] **Step 1: Run the complete project check**

Run:

```powershell
npm run check
```

Expected: type checking and all tests pass with exit code 0.

- [ ] **Step 2: Start the local UI**

Run:

```powershell
npm run web
```

Expected: server reports `http://localhost:3000/`.

- [ ] **Step 3: Inspect desktop**

At approximately `1440 × 900`, verify:

- cinematic hero and oversized title;
- list/stage split;
- search and all filters;
- score sorting;
- selected job stage;
- detail overlay;
- safe external link behavior;
- no horizontal overflow.

- [ ] **Step 4: Inspect mobile**

At approximately `390 × 844`, verify:

- poster flow;
- readable hero;
- full-screen filter drawer;
- detail reading;
- no inaccessible off-screen controls.

- [ ] **Step 5: Review acceptance and safety**

Confirm:

- server does not call crawlers;
- scoring-optional jobs still render;
- empty and failure states are understandable;
- only files inside the project changed;
- data files were untouched;
- no dependency install occurred;
- no Git modification command occurred.
