# PROTOTYPE — DialogDrawer (throwaway)

**Wayfinder ticket:** [#5](https://github.com/AlexDemzz/responsivecn/issues/5)

**Question:** does the "desktop props 1:1 on root + a namespaced override object" API hold up in real typed code, and what does the generated component for the star pair Dialog→Drawer concretely look like?

## Run

```sh
npm install
npm run typecheck   # the verdict — must pass with zero casts
```

## What's here

- `src/components/ui/dialog.tsx`, `drawer.tsx` — the real shadcn Base-UI wrappers (fetched from `shadcn-ui/ui` `apps/v4/registry/bases/base/ui/` at main, 2026-07-12), imports adapted, styling trimmed where irrelevant to types.
- `src/components/ui/dialog-drawer.tsx` — **the artifact**: the reference template the registry route will generate.
- `src/usage-check.tsx` — typed usage cases; `@ts-expect-error` marks what must NOT compile.

## Findings (tsc-verified)

1. **The API holds. Zero casts anywhere.** Root spreads Dialog props verbatim into `Drawer` (superset), `drawer={{}}` spreads on top (drawer side wins).
2. **`onOpenChange` union works as researched** — `reason === "swipe"` narrows, `setOpen` assignable directly.
3. **One real friction found: state-callback props.** `className`/`style`/`render` accept `(state) => …` callbacks, and `Dialog.Popup.State` ≠ `Drawer.Popup.State` (`nestedDialogOpen` vs `expanded`…). Fixed with the same contravariance trick as `onOpenChange`: a `SharedPartProps<Props, StateUnion>` helper widening those three props to the union state. Only `Content` needs it today (other parts' states are structurally compatible); the helper makes it mechanical for the generator.
4. **`handle` / `triggerId` / `defaultTriggerId` dropped in v1** — `Dialog.Handle` and `Drawer.Handle` are distinct classes; a desktop handle can't drive the mobile primitive.
5. **Explicit desktop-only drops:** `showCloseButton` on Content and Footer (drawer dismisses by swipe).

## Decisions taken with the human (HITL)

- **The override prop is named after the mobile side of the pair** — `drawer={{}}` here, `popover={{}}` for TooltipPopover — instead of a fixed `mobile={{}}`: it reads as "props for the drawer", which is what the object contains.
- **`drawer={{}}` on every part**, typed 1:1 as the Drawer-side counterpart's real API (`DialogDrawerTrigger.drawer` = `DrawerTrigger` props, etc.) — each part's override namespace matches the original component API.
- **`className` merges**: below the breakpoint, `cn(shared, drawer)`; callbacks compose (both resolved against the Drawer-side state, then merged via `mergeClassNames`). Other props: the override replaces.
- **Hook = shadcn sidebar convention**: `import { useIsMobile } from "@/hooks/use-mobile"` + `registryDependencies: ["use-mobile"]` (sidebar does exactly this). For a custom (non-768) breakpoint, the generated registry item ships its own hook file with the baked constant — naming/collision to be settled in the registry-route spec (ticket #6).

## Verdict

**API validated.** Resolution recorded on ticket #5. Delete this directory once the map is done (or absorb `dialog-drawer.tsx` as the generation template).
