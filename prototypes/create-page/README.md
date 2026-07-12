# PROTOTYPE — /create page (throwaway)

**Wayfinder ticket:** [#7](https://github.com/AlexDemzz/responsivecn/issues/7)

**Question:** exact layout & behavior of the `/create` page — selects constrained to the pair matrix, resizable preview frame, copy affordance (install command vs item URL), selection-change behavior, default state, invalid combos.

**Plan:** three structurally different variants on one route, switchable via `?variant=` (floating bottom bar, `←`/`→` keys).

## Run

```sh
npm install
npm run dev
```

## Variants

| Key | Name | Structure it argues for |
| --- | --- | --- |
| `a` | Two selects, strict matrix | The ticket as written: desktop + mobile selects top center, invalid mobile options disabled, auto-snap (amber flash) when the desktop change invalidates the mobile pick. Copy = primary CLI command button + secondary URL icon. Default: `dialog-drawer`, 1024px, drag handle right. |
| `b` | Pair rail + code panel | Selection is *picking a pair*, not composing one — 4 cards in a left rail make invalid combos impossible by construction. Device presets (375/768/1024) instead of free drag. Right panel: Command/URL tabs + item metadata. Default: **empty state** ("Pick a pair"). Selection change = skeleton shimmer. |
| `c` | Playground, derived mobile | The matrix is a *function* — one desktop select, mobile side shown as a non-interactive "auto" chip. Full-bleed dotted canvas, symmetric drag handles + numeric width input, split copy button (npx / pnpm / item URL). Default: `dialog-drawer` at **375px** (mobile first). |

All variants share the mock preview: fake in-frame Dialog/Sheet/Popover/Tooltip lookalikes that swap to the mobile primitive below 768px frame width.

## Findings (HITL verdict)

**Variant C — "Playground, derived mobile" — wins**, with everything it embeds:

- **Layout**: full-bleed canvas (dotted background), floating top-center toolbar, centered preview frame.
- **Selection**: ONE select (desktop component); the mobile side is derived from the pair matrix and shown as a non-interactive "auto" chip. Invalid combos impossible by construction — the matrix is a function desktop → mobile, so a second select never made sense.
- **Preview**: free resize via symmetric left/right drag handles + numeric px input (clamped 320–1200); width badge showing `<px> · mobile|desktop`; below 768px the mobile primitive replaces the desktop one.
- **Selection change**: instant swap, no transition; command/URL update live.
- **Default state**: `dialog-drawer` at **375px** — visitors see the mobile behavior (the product's raison d'être) first.
- **Copy**: split button — primary = `npx shadcn@latest add @responsivecn/<slug>`, dropdown = pnpm dlx variant + static item URL.
