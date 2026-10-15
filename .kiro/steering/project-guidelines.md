---
inclusion: always
---

# Life Dashboard — Project Guidelines

## Technology Constraints
- **HTML5 + CSS3 + Vanilla JavaScript only.** No frameworks (React, Vue, Angular), no build tools (Webpack, Vite), no external libraries or CDN dependencies.
- No backend server of any kind. All data is stored client-side via the **localStorage API**.
- The application must load and run as a standalone `index.html` file in any modern browser (Chrome, Firefox, Edge, Safari).

## File Structure
```
index.html          ← single HTML entry point
css/style.css       ← single stylesheet (no other CSS files)
js/app.js           ← single JavaScript file (no other JS files)
.kiro/steering/     ← Kiro configuration only
README.md           ← project documentation
```
Do not create additional CSS or JS files. Do not add `node_modules`, `package.json`, or any build artefacts.

## Coding Standards
- Use `'use strict';` at the top of `app.js`.
- No inline CSS (`style="..."`) on elements — use classes and CSS custom properties instead.
- No inline JavaScript (`onclick="..."`) on elements — use `addEventListener` in `app.js`.
- Use semantic HTML elements (`<header>`, `<main>`, `<section>`, `<nav>`, `<ul>`, etc.).
- Provide `aria-label`, `aria-live`, and `role` attributes where needed for accessibility.
- Screen-reader-only text uses the `.sr-only` utility class.
- All form controls have associated `<label>` elements (visible or `.sr-only`).

## localStorage Conventions
All keys are prefixed `ld_` to avoid collisions:

| Key             | Type    | Content                        |
|-----------------|---------|--------------------------------|
| `ld_tasks`      | Array   | Task objects                   |
| `ld_links`      | Array   | Quick-link objects             |
| `ld_theme`      | String  | `"light"` or `"dark"`         |
| `ld_name`       | String  | User's display name            |
| `ld_filter`     | String  | Active task filter tab         |
| `ld_timer_preset` | Number | Last-selected timer minutes   |

Always wrap localStorage reads/writes in try/catch. Surface a `console.warn` on `QuotaExceededError`.

## Feature Checklist (do not regress these)
- [ ] Live clock (HH:MM:SS) and date in the header, updated every second
- [ ] Time-based greeting (morning / afternoon / evening)
- [ ] Editable user name, persisted, shown in greeting
- [ ] Light/dark mode toggle, persisted
- [ ] Focus Timer with 15 / 25 / 50 min presets; Start, Stop, Reset; no multiple intervals
- [ ] Task CRUD: add, toggle complete, edit (modal), delete
- [ ] Duplicate task title prevention (case-insensitive, trimmed)
- [ ] Blank task prevention
- [ ] Task priority (Low / Medium / High) with colour badges
- [ ] Optional due dates with overdue highlighting
- [ ] Task filters: All / Active / Completed
- [ ] Task counts (total / active / done)
- [ ] Clear completed tasks with confirmation
- [ ] Quick Links with defaults; add custom links; URL validation; delete links
- [ ] Responsive layout (two-column desktop, single-column mobile)
- [ ] Graceful localStorage error handling

## Design Tokens (CSS custom properties)
Primary brand colours: red (`#c0392b`), near-white (`#ecf0f1`), blue (`#2980b9`) — used in the background gradient.
Card background: warm white `#fffef9`.
Do not introduce new colour values outside the `:root` / `[data-theme="dark"]` blocks in `style.css`.
