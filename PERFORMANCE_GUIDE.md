# Performance Guide

Use these rules when adding new features so the app stays fast over time.

## 1) Route-level lazy loading is the default

- For every new page/screen, use `React.lazy(...)` + `Suspense`.
- Do not import all pages at the top-level router eagerly.
- Keep fallbacks lightweight (`Loading...` or skeleton).

## 2) Heavy libraries must be feature-scoped

- If a dependency is large (charts, editors, PDF tools, maps), import it only in the page/component that needs it.
- Prefer dynamic import for optional panels/modals:
  - open modal -> load module
  - first visit of feature -> load module

## 3) Keep shared layout code lean

- Files loaded on every page (e.g. `App.jsx`, global providers, nav/sidebar) should avoid feature-specific imports.
- Move expensive logic behind route boundaries or user actions.

## 4) Optimize media and static assets

- Compress images before adding to repo.
- Use modern formats (`webp`) where possible.
- Avoid large unoptimized assets in `public/` unless required.

## 5) Avoid performance regressions in PRs

- Run production builds before merging:
  - `admin-panel`: `npm run build`
  - `storefront`: `npm run build`
- If bundle spikes, check for new eager imports in top-level files.

## 6) Measure with production preview, not dev server

- Dev mode is intentionally slower and can mislead Lighthouse.
- Use:
  - `npm run build`
  - `npm run preview`
- Then run Lighthouse on preview URLs.

## 7) Quick checklist for new feature PRs

- [ ] New routes are lazy-loaded
- [ ] No heavy dependency imported in global/root files
- [ ] Large components/modals are code-split when practical
- [ ] Images/assets optimized
- [ ] Build passes without new large chunk warnings
- [ ] Lighthouse spot-check on changed route

