# responsivecn — Ubiquitous Language

Glossary only. Implementation decisions live in the wayfinder map ([#1](https://github.com/AlexDemzz/responsivecn/issues/1)) and its closed tickets.

## Pair

A curated desktop→mobile component combination. Exactly four exist: Dialog→Drawer, Sheet→Drawer, Popover→Drawer, Tooltip→Popover. Closed whitelist — no other combination is valid.

## Slug

The kebab-case name of a pair: `<desktop>-<mobile>`, e.g. `dialog-drawer`. One slug names everything: the component, its source file, its registry item, and its URL path. The bare slug is the Base UI item (shadcn default base); the Radix variant is the suffixed item `<slug>-radix` ([#16](https://github.com/AlexDemzz/responsivecn/issues/16)).

## Responsive component

The component a pair produces (e.g. `DialogDrawer`): renders the desktop component at or above the breakpoint, the mobile one below. A drop-in replacement for the desktop component — desktop props map 1:1 on the root and parts.

## Override prop

The per-part prop named after the mobile side of the pair (`drawer={{...}}` on DialogDrawer, `popover={{...}}` on TooltipPopover), typed 1:1 on the mobile counterpart's API. `className` merges (`cn(shared, mobile)`), state callbacks compose; other props replace.

## Breakpoint

Fixed at 768px, read via the standard shadcn `useIsMobile` hook (`@/hooks/use-mobile`). Not a parameter — it briefly was one, ruled out for shadcn parity ([#6](https://github.com/AlexDemzz/responsivecn/issues/6)).

## Registry

The static shadcn registry served under `/r/`: two item JSONs per slug — `/r/<slug>.json` (Base UI) and `/r/<slug>-radix.json` (Radix) — built with `npx shadcn build` from the root `registry.json`. Sources live in two hand-written parallel trees, `registry/base/` and `registry/radix/` ([#16](https://github.com/AlexDemzz/responsivecn/issues/16)).

## Catalog

The flattened registry index served at `/r/registry.json` — the eight items without file contents. Powers `search`/`list`/MCP and the official directory listing for `@responsivecn`.
