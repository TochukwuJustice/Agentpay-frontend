# TODO - Responsive collapsible header menu

- [ ] Implement responsive disclosure menu in `src/components/Header.tsx`
  - [ ] Add hamburger toggle button visible only below Tailwind `md`
  - [ ] Wire `aria-expanded`, `aria-controls`, and real `<button>`
  - [ ] Keyboard support: Escape closes, focus returns to toggle
  - [ ] Focus moves into menu when opened
  - [ ] Close on route change (pathname change)
  - [ ] Keep focus-visible rings and existing navigation aria-label
- [x] Extend tests in `src/components/__tests__/Header.test.tsx`
  - [x] Assert toggle opens/closes + `aria-expanded` flips
  - [x] Assert `aria-controls` points to menu
  - [x] Assert Escape closes + focus returns to toggle
  - [x] Assert auto-close on route change
  - [x] Ensure primary links remain reachable / no regressions

- [x] Update `README.md` with responsive nav note + breakpoint (`md`)
- [ ] Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- [ ] Commit with message: `feat(navigation): add accessible responsive menu to the header`


