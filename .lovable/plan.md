# Fix `CandidateComparisonModal` legibility (light + dark)

## Root cause

`src/components/shortlist/CandidateComparisonModal.tsx` is the only component in this project that uses shadcn-style semantic tokens (`bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border`, `divide-x`, `bg-primary/20`, etc.). 

This project does **not** define those tokens — Tailwind is loaded via CDN in `index.html` with a custom `jnana.*` palette only. Result: the modal renders with **transparent background, transparent borders, invisible text**. The only visible elements are the native `<textarea>` (browser default white) and the `Button` primary variant — exactly what the screenshot shows.

The page behind also gets a `bg-black/50` overlay, so the dashboard bleeds through and looks "broken".

## Fix scope (UI-only, single file)

Rewrite all class names in `CandidateComparisonModal.tsx` to use the project's `jnana-*` tokens + standard Tailwind grays (already used everywhere else in the codebase, e.g. `Card.tsx`, `OrgExplorerPanel.tsx`).

### Token mapping

| Current (broken)              | Replacement (light / dark)                                    |
|-------------------------------|---------------------------------------------------------------|
| `bg-background`               | `bg-white dark:bg-gray-800`                                   |
| `bg-muted/30`, `bg-muted/50`  | `bg-jnana-bg dark:bg-gray-900/50`                             |
| `bg-muted`                    | `bg-gray-100 dark:bg-gray-700`                                |
| `text-foreground`             | `text-jnana-text dark:text-gray-100`                          |
| `text-muted-foreground`       | `text-gray-500 dark:text-gray-400`                            |
| `border`, `border-t`, `divide-x` | add explicit `border-gray-200 dark:border-gray-700`        |
| `bg-primary/20 → /40` gradient avatar | `from-jnana-sage/20 to-jnana-sage/40 text-jnana-sage` (dark: `text-jnana-powder`) |
| `text-primary`, `bg-primary/70` (RIASEC bars) | `text-jnana-sage` / `bg-jnana-sage`             |
| Score colors (`text-green-600` etc.) | keep, but bump to `text-green-500 dark:text-green-400`  |

### Specific structural fixes

1. **Modal shell**: `bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700` — guarantees opaque surface over the `bg-black/50` overlay.
2. **Header bar**: solid `bg-jnana-bg dark:bg-gray-900/40` with bottom border; title `text-jnana-text dark:text-white`, subtitle `text-gray-500 dark:text-gray-400`.
3. **Two-column body**: replace `divide-x` with explicit `border-r border-gray-200 dark:border-gray-700` on the left column (only on `md+`, stack on mobile via `flex-col md:flex-row`).
4. **Match score block**: `bg-jnana-bg dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700`, larger ring, score color uses tier (green ≥80, amber 60–79, red <60) with dark variants.
5. **RIASEC bars**: track `bg-gray-200 dark:bg-gray-700`, fill `bg-jnana-sage`, labels `text-gray-600 dark:text-gray-300`.
6. **Skill rows**: matched icon `text-green-600 dark:text-green-400`, missing icon `text-red-500 dark:text-red-400`, label color follows match state.
7. **Soft skills chips**: `bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300`.
8. **Notes textarea**: `bg-white dark:bg-gray-900 text-jnana-text dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-jnana-sage focus:border-transparent`.
9. **Section dividers**: every `border-t pt-3` → `border-t border-gray-200 dark:border-gray-700 pt-3`.
10. **Action button**: change `variant={index === 0 ? "primary" : "outline"}` (the project's `Button` doesn't have `"primary"` — verify and use `"default"` or the existing primary variant). Make both buttons full-width and visually distinct (filled jnana-sage vs outlined).
11. **Close (X) and footer "Torna alla Shortlist"**: ensure visible hover states in dark mode (`hover:bg-gray-100 dark:hover:bg-gray-700`).
12. **Accessibility**: add `role="dialog"` `aria-modal="true"` `aria-labelledby` on shell; click-outside to close on overlay.

### Out of scope

- No layout/UX restructuring (sections, order, fields stay as-is).
- No changes to `CandidateRatingStars`, `CandidateStatusBadge`, `Button`, or any data flow.
- No changes to the comparison logic in `PositionMatchingView.tsx`.

## Files

- `src/components/shortlist/CandidateComparisonModal.tsx` — full className refactor + minor a11y attrs.

## Verification

After edit: open the comparison modal in light mode and dark mode, confirm opaque surface, all text legible, RIASEC bars/skill icons visible, both action buttons distinguishable, textarea contrast OK.
