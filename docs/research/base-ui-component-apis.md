# Base UI Component APIs — Dialog, Drawer, Popover, Tooltip (+ shadcn Sheet)

Research date: **2026-07-12**. All claims verified against primary sources only: the live Base UI docs (`base-ui.com/react/components/*.md`, which serve raw markdown), the `mui/base-ui` source on GitHub, npm metadata, and the `shadcn-ui/ui` repository at commit [`3cdaa6e`](https://github.com/shadcn-ui/ui/commit/3cdaa6eb2f0da27aca8598cb752c32d840e06940) (tip of `main`, last pushed 2026-07-10).

Package: **`@base-ui/react`**, latest `1.6.0` on npm (verified 2026-07-12). The old package `@base-ui-components/react` stopped at `1.0.0-rc.0`; every Base UI doc page carries the banner "The package was previously published as `@base-ui-components/react` and has since been renamed to `@base-ui/react`. Use `@base-ui/react` in all imports." ([tooltip.md front matter](https://base-ui.com/react/components/tooltip.md))

---

## TL;DR

- **Drawer is a strict superset of Dialog.** Base UI's own guideline: "Drawer extends Dialog: It adds gesture support, snap points, and indent effects. If you don't need these, use Dialog instead." Every Dialog.Root prop exists on Drawer.Root; Drawer adds `snapPoints`/`snapPoint`/`defaultSnapPoint`/`onSnapPointChange`, `snapToSequentialPoints`, `swipeDirection`, plus parts Dialog lacks (`Content`, `SwipeArea`, `Provider`, `Indent`, `IndentBackground`, `VirtualKeyboardProvider`). ([drawer.md](https://base-ui.com/react/components/drawer.md))
- **shadcn Sheet wraps Base UI Dialog, not a separate primitive** — `import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"`, with a CSS-only `side` prop (`"top" | "right" | "bottom" | "left"`, default `"right"`). So the SheetDrawer pair is Dialog→Drawer under the hood, plus a mechanical `side`→`swipeDirection` mapping. ([sheet.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/sheet.tsx))
- **`onOpenChange` has the same shape everywhere**: `(open: boolean, eventDetails: X.Root.ChangeEventDetails) => void`. All four `ChangeEventDetails` types instantiate one generic (`BaseUIChangeEventDetail<Reason>` in [`createBaseUIEventDetails.ts`](https://github.com/mui/base-ui/blob/master/packages/react/src/internals/createBaseUIEventDetails.ts)) — a `reason`-discriminated union plus shared members (`event`, `cancel()`, `allowPropagation()`, `isCanceled`, `isPropagationAllowed`, `trigger`, `preventUnmountOnClose`). Only the `reason` string sets differ per component. **A shared callback typed with the union of both pair members' details types is assignable to both roots with zero casts** (function-parameter contravariance). Passing a plain `setOpen` also works (TS allows fewer params). ([dialog.md API reference](https://base-ui.com/react/components/dialog.md), shadcn's own [drawer-dialog demo](https://github.com/shadcn-ui/ui/blob/main/apps/v4/examples/base/drawer-dialog.tsx) passes `setOpen` directly)
- **Tooltip is disabled on touch devices by design** — "tooltips are disabled on touch devices"; Base UI's stated alternative for touch access is exactly what responsivecn's TooltipPopover pair does: "Popups that open when hovering an info icon should use Popover with the `openOnHover` prop on the trigger instead of a tooltip. This way, touch users and screen reader users can access the content." ([tooltip.md, Alternatives](https://base-ui.com/react/components/tooltip.md))
- **shadcn ships `use-mobile`** (registry item `use-mobile`, type `registry:hook`): breakpoint hard-coded at **768px** (`max-width: 767px` media query), returns `false` during SSR/first render (state starts `undefined`, coerced by `!!isMobile`). The official "Responsive" recipe in the Base drawer docs instead uses an app-level `useMediaQuery("(min-width: 768px)")` hook and conditionally renders `<Dialog>` or `<Drawer>` around shared children. ([use-mobile.ts](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/hooks/use-mobile.ts), [base/drawer.mdx §Responsive](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/drawer.mdx))
- **shadcn wrappers hide most parts**: `*Content` components bundle Portal + Backdrop/Positioner + Popup and lift the load-bearing Positioner props (`side`, `align`, `sideOffset`, `alignOffset`) to `Content` props. Mapping responsivecn pairs at the **shadcn wrapper level** (DialogContent↔DrawerContent) is far smaller than mapping raw Base UI parts.

---

## 1. Parts & props per component

All part lists and props from the API reference sections of the live docs ([dialog.md](https://base-ui.com/react/components/dialog.md), [drawer.md](https://base-ui.com/react/components/drawer.md), [popover.md](https://base-ui.com/react/components/popover.md), [tooltip.md](https://base-ui.com/react/components/tooltip.md), all fetched 2026-07-12). Every rendering part additionally accepts `className`/`style` (plain or state-callback) and `render` (element-replacement); those are omitted below.

### 1.1 Dialog (`@base-ui/react/dialog`)

Anatomy: `Root > Trigger + Portal > (Backdrop, Viewport > Popup > Title/Description/Close)`. Plus `createHandle()`/`Handle` for detached triggers.

| Part | Renders | Load-bearing props |
|---|---|---|
| `Root` | nothing | `defaultOpen=false`, `open`, `onOpenChange(open, eventDetails)`, `onOpenChangeComplete(open)`, `modal: boolean \| 'trap-focus'` **default `true`**, `disablePointerDismissal=false`, `actionsRef` (`{unmount, close}`), `handle`, `triggerId`/`defaultTriggerId`, `children` (node or payload render fn) |
| `Trigger` | `<button>` | `handle`, `payload`, `nativeButton=true`, `id` |
| `Portal` | `<div>` in `<body>` | `container`, `keepMounted=false` |
| `Backdrop` | `<div>` | `forceRender=false` |
| `Viewport` | `<div>` | positioning container "that can be made scrollable" (outside-scroll pattern) |
| `Popup` | `<div>` | `initialFocus`, `finalFocus` (boolean \| ref \| fn of `InteractionType`) |
| `Title` | `<h2>` | — |
| `Description` | `<p>` | — |
| `Close` | `<button>` | `nativeButton=true` |

Usage guideline: "Dialog doesn't support gestures: Use Drawer when you need gesture support or snap points."

**shadcn wrapper** ([`apps/v4/registry/bases/base/ui/dialog.tsx`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/dialog.tsx)): exports `Dialog` (Root pass-through, props typed `DialogPrimitive.Root.Props` 1:1), `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay` (= Backdrop), `DialogContent` (**Portal + Overlay + Popup + auto close button**, extra prop `showCloseButton = true`), `DialogHeader`/`DialogFooter` (plain `<div>`s; Footer takes `showCloseButton = false`), `DialogTitle`, `DialogDescription`. Base UI's `Viewport` is **not** used. Naming convention: Base UI `Backdrop`→shadcn `Overlay`, `Popup`→`Content`.

### 1.2 Drawer (`@base-ui/react/drawer`)

Anatomy: `Provider > IndentBackground + Indent > Root > Trigger + SwipeArea + Portal > (Backdrop, Viewport > Popup > Content > Title/Description/Close)`; optional `VirtualKeyboardProvider` wrapper for bottom sheets with form fields. Plus `createHandle()`/`Handle`.

| Part | Renders | Load-bearing props |
|---|---|---|
| `Root` | nothing | **everything Dialog.Root has**, plus: `snapPoints: (number \| string)[]` (0–1 = viewport fraction, >1 = px, or `'148px'`/`'30rem'` strings), `defaultSnapPoint`, `snapPoint` + `onSnapPointChange(snapPoint, eventDetails)` (controlled), `snapToSequentialPoints=false`, `swipeDirection: 'up' \| 'down' \| 'left' \| 'right'` **default `'down'`** |
| `Provider` | nothing | shared context for indent/background effects across drawers |
| `Indent` / `IndentBackground` | `<div>` | wrap the app's main UI; `data-active` when any drawer open |
| `Trigger` | `<button>` | same as Dialog.Trigger |
| `SwipeArea` | `<div>` | invisible swipe-to-**open** area; `swipeDirection` (defaults to opposite of Root's), `disabled=false` |
| `Portal` | `<div>` | same as Dialog.Portal |
| `Backdrop` | `<div>` | `forceRender=false`; CSS var `--drawer-swipe-progress` |
| `Viewport` | `<div>` | positioning container; CSS var `--drawer-keyboard-inset` (with VirtualKeyboardProvider) |
| `Popup` | `<div>` | `initialFocus`/`finalFocus`; rich swipe state surface: `data-swiping`, `data-swipe-direction`, `data-expanded` (full-height snap point), CSS vars `--drawer-height`, `--drawer-snap-point-offset`, `--drawer-swipe-movement-x/y`, `--drawer-swipe-strength`, `--nested-drawers`, `--drawer-frontmost-height` |
| `Content` | `<div>` | **no Dialog equivalent** — "allows text selection of its children without swipe interference when using a mouse pointer"; opt out of swipe per-element with `data-base-ui-swipe-ignore` |
| `Title` / `Description` / `Close` | `<h2>`/`<p>`/`<button>` | same as Dialog |
| `VirtualKeyboardProvider` | nothing | keyboard-aware focus/scroll for bottom sheets with form fields |

**shadcn wrapper** ([`drawer.tsx`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/drawer.tsx)): `Drawer` (Root) adds `showSwipeHandle = false` and pipes `{hasSnapPoints, modal, showSwipeHandle, swipeDirection}` through a React context consumed by `DrawerContent`. `DrawerContent` = Portal + **conditional** Overlay (rendered only when `modal === true`) + Viewport + Popup + optional `DrawerSwipeHandle` + Base UI `Content`. Exports: `Drawer`, `DrawerPortal`, `DrawerOverlay`, `DrawerSwipeHandle`, `DrawerTrigger`, `DrawerClose`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`. **Not exposed**: `SwipeArea`, snap-point subcomponents, `Provider`/`Indent`/`IndentBackground`/`VirtualKeyboardProvider` (snap points still work — `snapPoints` passes through the root).

### 1.3 Popover (`@base-ui/react/popover`)

Anatomy: `Root > Trigger + Portal > (Backdrop, Positioner > Popup > Arrow/Title/Description/Close/Viewport)`. Plus `createHandle()`/`Handle`.

| Part | Renders | Load-bearing props |
|---|---|---|
| `Root` | nothing | `defaultOpen`, `open`, `onOpenChange`, `onOpenChangeComplete`, `modal` **default `false`** (⚠ opposite of Dialog/Drawer), `actionsRef`, `handle`, `triggerId`/`defaultTriggerId`, `children` |
| `Trigger` | `<button>` | `openOnHover=false`, `delay=300`, `closeDelay=0`, `handle`, `payload`, `nativeButton=true`, `id` |
| `Portal` | `<div>` | `container`, `keepMounted=false` |
| `Backdrop` | `<div>` | exists (unlike Tooltip) |
| `Positioner` | `<div>` | `side: Side` **default `'bottom'`**, `align: Align='center'`, `sideOffset=0`, `alignOffset=0` (number or `OffsetFunction`), `anchor`, `arrowPadding=5`, `collisionAvoidance`, `collisionBoundary='clipping-ancestors'`, `collisionPadding=5`, `sticky=false`, `positionMethod='absolute'`, `disableAnchorTracking=false`; CSS vars `--available-width/height`, `--transform-origin`, `--positioner-width/height` |
| `Popup` | `<div>` | `initialFocus`, `finalFocus` |
| `Arrow` | `<div>` | positioned against the anchor; `data-side`/`data-align`/`data-uncentered` |
| `Title` / `Description` / `Close` | `<h2>`/`<p>`/`<button>` | same shape as Dialog's |
| `Viewport` | `<div>` | **content-transition container** for multi-trigger popovers — "only required if one popup can be opened by multiple triggers … and switching between them is animated" (⚠ same name, entirely different purpose than Dialog/Drawer `Viewport`) |

`Side = 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'`, `Align = 'start' | 'center' | 'end'`.

**shadcn wrapper** ([`popover.tsx`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/popover.tsx)): `PopoverContent` = Portal + Positioner + Popup, lifting `side='bottom'`, `sideOffset=4`, `align='center'`, `alignOffset=0` (typed `Pick<Positioner.Props, ...>`). Exports: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`. **No `PopoverClose` export, no Arrow.**

### 1.4 Tooltip (`@base-ui/react/tooltip`)

Anatomy: `Provider > Root > Trigger + Portal > Positioner > Popup > Arrow/Viewport`. **No Backdrop, no Title/Description/Close.** Plus `createHandle()`/`Handle`.

| Part | Renders | Load-bearing props |
|---|---|---|
| `Provider` | nothing | shared `delay`, `closeDelay`, `timeout=400` (grouping: adjacent tooltips open instantly) |
| `Root` | nothing | `defaultOpen`, `open`, `onOpenChange`, `onOpenChangeComplete`, `disabled=false`, `trackCursorAxis: 'none' \| 'x' \| 'y' \| 'both' = 'none'`, `disableHoverablePopup=false`, `actionsRef`, `handle`, `triggerId`/`defaultTriggerId` — **no `modal` prop** |
| `Trigger` | `<button>` | `delay=600`, `closeDelay=0`, `closeOnClick=true`, `disabled=false`, `handle`, `payload` |
| `Portal` | `<div>` | `container`, `keepMounted=false` |
| `Positioner` | `<div>` | same prop set as Popover.Positioner but `side` **default `'top'`** |
| `Popup` | `<div>` | plain container (no `initialFocus` — tooltips never take focus) |
| `Arrow` | `<div>` | same as Popover.Arrow |
| `Viewport` | `<div>` | content-transition container (multi-trigger), same as Popover.Viewport |

Touch behavior (all quotes from [tooltip.md](https://base-ui.com/react/components/tooltip.md)):
- "Tooltips don't work well with touch input. … **tooltips are disabled on touch devices**." (iOS has no standard affordance; Android long-press conflicts with browser context menus.)
- Usage guideline: "Tooltips alone are not accessible to touch or screen reader users"; the trigger must carry an `aria-label` matching the tooltip content.
- Alternative: infotips should be **Popover with `openOnHover`** so touch and screen-reader users can access the content. Decision rule: "If the trigger's purpose is to open the popup itself, it's a popover. If the trigger's purpose is unrelated to opening the popup, it's a tooltip."

**shadcn wrapper** ([`tooltip.tsx`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/tooltip.tsx)): `TooltipProvider` defaults `delay=0` (overriding Base UI's 600ms trigger default via Provider). `TooltipContent` = Portal + Positioner + Popup **+ Arrow baked in**, lifting `side='top'`, `sideOffset=4`, `align='center'`, `alignOffset=0`. Exports: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`.

---

## 2. `onOpenChange` / `eventDetails` — exact signatures

Identical shape on all four roots: `onOpenChange: (open: boolean, eventDetails: <Component>.Root.ChangeEventDetails) => void`.

Every `ChangeEventDetails` is a discriminated union on `reason` (each variant pinning `event` to specific native event types) intersected with the same base members:

```typescript
{
  cancel: () => void;              // cancels Base UI's own handling
  allowPropagation: () => void;
  isCanceled: boolean;
  isPropagationAllowed: boolean;
  trigger: Element | undefined;
  preventUnmountOnClose: () => void;
}
```

All four instantiate one generic — `BaseUIChangeEventDetail<Reason, CustomProperties>` with a shared `ReasonToEventMap` — in [`packages/react/src/internals/createBaseUIEventDetails.ts`](https://github.com/mui/base-ui/blob/master/packages/react/src/internals/createBaseUIEventDetails.ts). So for any reason string common to two components, the variant types are **structurally identical**.

### Reason sets per component (from each doc's `Root.ChangeEventReason`)

| Reason | Dialog | Drawer | Popover | Tooltip |
|---|:-:|:-:|:-:|:-:|
| `trigger-press` | ✔ | ✔ | ✔ | ✔ |
| `outside-press` | ✔ | ✔ | ✔ | ✔ |
| `escape-key` | ✔ | ✔ | ✔ | ✔ |
| `close-press` | ✔ | ✔ | ✔ | — |
| `focus-out` | ✔ | ✔ | ✔ | — |
| `imperative-action` | ✔ | ✔ | ✔ | ✔ |
| `none` | ✔ | ✔ | ✔ | ✔ |
| `close-watcher` | — | ✔ | — | — |
| `swipe` | — | ✔ | — | — |
| `trigger-hover` | — | — | ✔ | ✔ |
| `trigger-focus` | — | — | ✔ | ✔ |
| `disabled` | — | — | — | ✔ |

Drawer additionally has `onSnapPointChange(snapPoint, eventDetails: Drawer.Root.SnapPointChangeEventDetails)` — same union minus `preventUnmountOnClose`.

### Typing strategy for a shared callback

**Recommended: widened union per pair, no generics, no casts.**

```typescript
type DialogDrawerOpenChangeDetails =
  | Dialog.Root.ChangeEventDetails
  | Drawer.Root.ChangeEventDetails;

onOpenChange?: (open: boolean, eventDetails: DialogDrawerOpenChangeDetails) => void;
```

Why this works with zero casts: function parameters are contravariant, so a handler accepting the *union* is assignable where a handler accepting either *member* is expected. The wrapper passes the same user callback to `Dialog.Root` on desktop and `Drawer.Root` on mobile; TypeScript accepts both sides natively. Users can still narrow with `if (eventDetails.reason === 'swipe')` — the discriminated union survives the widening.

Notes:
- For DialogDrawer the union is nearly redundant: Drawer's reason set is a strict superset of Dialog's, and shared variants are structurally identical, so `Drawer.Root.ChangeEventDetails` alone would type-check — but the explicit union is self-documenting and robust to future divergence.
- For PopoverDrawer and TooltipPopover the union is genuinely needed (disjoint extra reasons on both sides).
- `setOpen` (a `(value: boolean) => void`) remains directly assignable — TS permits callbacks that declare fewer parameters; shadcn's own responsive demo does exactly `onOpenChange={setOpen}` ([drawer-dialog.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/examples/base/drawer-dialog.tsx)).
- `onOpenChangeComplete: (open: boolean) => void` is identical on all four — passes through untouched.
- Avoid per-component generics: nothing here varies by payload except `Dialog.Handle<Payload>`/trigger `payload`, which is orthogonal to `onOpenChange` and can be ignored in v1.

---

## 3. Part-correspondence tables per pair

Mappings are given at the **shadcn wrapper level** (the granularity responsivecn generates), with Base UI parts noted where the wrapper hides them.

### 3.1 DialogDrawer (Dialog → Drawer)

| Desktop (Dialog) | Mobile (Drawer) | Notes |
|---|---|---|
| `Dialog` (Root) | `Drawer` (Root) | Drawer.Root props ⊇ Dialog.Root props — every desktop root prop forwards 1:1 |
| `DialogTrigger` | `DrawerTrigger` | identical |
| `DialogContent` | `DrawerContent` | both bundle Portal+Overlay+Popup; Dialog side adds `showCloseButton=true`; Drawer side renders Overlay only when `modal===true` and adds Base UI `Content` (text-selection layer) |
| `DialogHeader` / `DialogFooter` | `DrawerHeader` / `DrawerFooter` | plain divs, same slots |
| `DialogTitle` / `DialogDescription` | `DrawerTitle` / `DrawerDescription` | identical |
| `DialogClose` | `DrawerClose` | identical |
| `DialogOverlay` / `DialogPortal` | `DrawerOverlay` / `DrawerPortal` | identical |
| — | `DrawerSwipeHandle` (+ root `showSwipeHandle`) | **no desktop counterpart** |
| — (root) | `snapPoints`, `snapPoint`, `defaultSnapPoint`, `onSnapPointChange`, `snapToSequentialPoints`, `swipeDirection` | **mobile-only root props** → natural `mobile={{}}` residents |
| — | Base UI `SwipeArea`, `Provider`/`Indent`/`IndentBackground`, `VirtualKeyboardProvider` | not exposed by shadcn's wrapper either — out of v1 mapping |
| `showCloseButton` (Content) | — | desktop-only Content prop (Drawer dismisses by swipe) |

Behavioral: none significant — both default `modal: true`; Drawer adds `swipe`/`close-watcher` close reasons.

### 3.2 SheetDrawer (Sheet → Drawer)

Sheet **is** Base UI Dialog (see §1.1), so this pair inherits everything from 3.1, plus:

| Desktop (Sheet) | Mobile (Drawer) | Notes |
|---|---|---|
| `SheetContent side="right"\|"left"\|"bottom"\|"top"` | `Drawer swipeDirection` | mechanical mapping: `right→'right'`, `left→'left'`, `bottom→'down'`, `top→'up'`. ⚠ lives on **Content** desktop-side but on **Root** mobile-side; Sheet's `side` is CSS-only (`data-side` attr), Drawer's `swipeDirection` drives gesture physics |
| `SheetHeader`/`SheetFooter`/`SheetTitle`/`SheetDescription`/`SheetTrigger`/`SheetClose` | `Drawer*` equivalents | identical slots |
| `SheetPortal`/`SheetOverlay` | (internal) | defined but **not exported** by shadcn sheet.tsx |

### 3.3 PopoverDrawer (Popover → Drawer)

| Desktop (Popover) | Mobile (Drawer) | Notes |
|---|---|---|
| `Popover` (Root) | `Drawer` (Root) | ⚠ **`modal` default mismatch**: Popover `false`, Drawer `true`. The wrapper must pick an explicit policy |
| `PopoverTrigger` | `DrawerTrigger` | Popover trigger props `openOnHover`/`delay`/`closeDelay` have **no Drawer counterpart** (drop on mobile) |
| `PopoverContent` (Portal+Positioner+Popup) | `DrawerContent` (Portal+Overlay+Viewport+Popup+Content) | positioning props lifted onto PopoverContent (`side`, `align`, `sideOffset`, `alignOffset`) are **meaningless on Drawer** — a drawer is edge-anchored, not anchor-positioned. Drop on mobile |
| `PopoverHeader`/`PopoverTitle`/`PopoverDescription` | `DrawerHeader`/`DrawerTitle`/`DrawerDescription` | direct |
| Base UI `Popover.Positioner`, `Popover.Arrow` | — | **no mobile counterpart** (shadcn wrapper hides them anyway; Arrow isn't even rendered by shadcn popover) |
| Base UI `Popover.Backdrop` | `DrawerOverlay` | popover rarely uses one; drawer shows it when modal |
| — | `DrawerSwipeHandle`, `snapPoints` etc. | mobile-only, as in 3.1 |
| Base UI `Popover.Viewport` | Base UI `Drawer.Viewport` | ⚠ **same name, different concept**: Popover.Viewport = content-transition container for multi-trigger popovers; Drawer.Viewport = positioning container. Neither is exposed by the shadcn wrappers, but don't conflate them in generated code |
| — (close reasons) | — | Popover closes on `focus-out`/hover-out; Drawer closes on `swipe` — reason union covers both |

### 3.4 TooltipPopover (Tooltip → Popover)

The only pair where **desktop and mobile swap within the popup family**, and the only one driven by input modality rather than screen size semantics: Base UI disables tooltips on touch outright (§1.4).

| Desktop (Tooltip) | Mobile (Popover) | Notes |
|---|---|---|
| `TooltipProvider` (delay grouping) | — | **no Popover equivalent** — Provider-level delay/timeout grouping is tooltip-only |
| `Tooltip` (Root) | `Popover` (Root) | Tooltip has no `modal`; `trackCursorAxis` and `disableHoverablePopup` have **no Popover counterpart** |
| `TooltipTrigger` (`delay=600`, `closeDelay`, `closeOnClick`) | `PopoverTrigger` (press-to-open; `openOnHover=false`) | hover/focus semantics → press semantics. Popover.Trigger's own `openOnHover`+`delay`+`closeDelay` exist if hover is wanted, matching Base UI's infotip recommendation |
| `TooltipContent` (Portal+Positioner+Popup+**Arrow**) | `PopoverContent` (Portal+Positioner+Popup, **no Arrow**) | both lift `side`/`align`/`sideOffset(4)`/`alignOffset`; ⚠ default `side` differs: tooltip `'top'`, popover `'bottom'` (shadcn keeps both defaults) |
| — | `PopoverHeader`/`PopoverTitle`/`PopoverDescription`, Base UI `Popover.Close`, `Popover.Backdrop` | tooltip has no title/description/close/backdrop parts — mobile side gains structure desktop lacks |
| (a11y) | | tooltip never takes focus and is a visual label only; popover is focusable content. Per Base UI, if the content matters, it should be a popover *everywhere* — responsivecn's pair should be positioned as "tooltip on pointer-fine desktop, accessible popover on touch" |
| (close reasons) | | shared: `trigger-hover`, `trigger-focus`, `trigger-press`, `outside-press`, `escape-key`, `imperative-action`, `none`; tooltip-only: `disabled`; popover-only: `close-press`, `focus-out` |

---

## 4. shadcn responsive patterns today

1. **`use-mobile` hook** — registry item `use-mobile` (`registry:hook`) in the Base registry ([hooks/_registry.ts](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/hooks/_registry.ts)). Implementation ([use-mobile.ts](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/hooks/use-mobile.ts)): `MOBILE_BREAKPOINT = 768`; `matchMedia("(max-width: 767px)")` listener; state starts `undefined` and the hook returns `!!isMobile` — i.e. **`false` (desktop) during SSR and the first client render**, flipping in an effect. Used in the registry by `sidebar.tsx` and dashboard blocks.
2. **Official "Responsive" recipe** — the Base drawer docs: "You can combine the `Dialog` and `Drawer` components to create a responsive dialog. This renders a `Dialog` component on desktop and a `Drawer` on mobile." ([base/drawer.mdx §Responsive](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/drawer.mdx), demo `drawer-dialog`). The demo ([apps/v4/examples/base/drawer-dialog.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/examples/base/drawer-dialog.tsx)):
   - uses an **app-level** `useMediaQuery("(min-width: 768px)")` hook ([apps/v4/hooks/use-media-query.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/hooks/use-media-query.tsx) — *not* a registry item, and also SSR-defaults to `false`, i.e. **mobile-first**, the opposite bias of `use-mobile`);
   - hoists `open` state and passes `onOpenChange={setOpen}` to both roots;
   - conditionally returns *either* the Dialog tree *or* the Drawer tree, duplicating Trigger/Header/Title/Description markup around a shared `<ProfileForm>` child.
   This copy-paste recipe is exactly the boilerplate responsivecn's generated components collapse into one drop-in component.
3. **No packaged responsive dialog exists in the registry** — the recipe ships only as docs example (`drawer-dialog` in `examples/`), not as an installable `registry:ui` item. There is no `use-media-query` registry item in the Base registry either.

---

## 5. Implications for responsivecn

Constraints these findings put on the planned API (desktop props 1:1 on root + `mobile={{}}` overrides):

1. **The 1:1 desktop-props contract is safe.** shadcn wrappers type their roots exactly as `Primitive.Root.Props`, and for DialogDrawer/SheetDrawer the mobile root accepts a superset — every desktop root prop can be forwarded verbatim. Mobile-only props (`snapPoints`, `swipeDirection`, `showSwipeHandle`, `onSnapPointChange`…) are exactly the natural contents of `mobile={{}}`.
2. **Type `onOpenChange` as the per-pair union** (`Desktop.Root.ChangeEventDetails | Mobile.Root.ChangeEventDetails`) — assignable to both primitives with zero casts, keeps `reason` narrowing, and `setOpen` still just works (§2). Same recipe for any other shared `eventDetails` callback.
3. **Map at the shadcn wrapper level, not raw Base UI parts.** Content components bundle Portal/Overlay/Positioner/Popup, shrinking the surface: DialogDrawer needs ~9 subcomponent mappings instead of ~14 part mappings, and Positioner (which has no mobile meaning) disappears from the API entirely.
4. **Per-pair prop drops must be explicit in the generator**: `PopoverContent`'s `side`/`align`/`sideOffset`/`alignOffset` and `PopoverTrigger`'s `openOnHover`/`delay`/`closeDelay` don't exist on Drawer; `DialogContent.showCloseButton` doesn't exist on DrawerContent; Sheet's `side` (a *Content* prop) becomes Drawer's `swipeDirection` (a *Root* prop) via a fixed lookup table (§3.2).
5. **Decide the `modal` policy for PopoverDrawer** — Popover defaults `false`, Drawer defaults `true`. Silent forwarding would make the mobile experience modal while desktop isn't. Either bake an explicit default or document that `mobile={{ modal }}` controls it.
6. **TooltipPopover is a semantics change, not a layout swap** — Base UI hard-disables tooltips on touch, and its docs prescribe Popover-with-`openOnHover` as the accessible alternative; the generated component should follow the infotip guidance (press-to-open popover on mobile, and keep the trigger's `aria-label` requirement in the docs). Also reconcile the `side` default (`top` vs `bottom`) and the fact that shadcn bakes an Arrow into TooltipContent but exposes none on PopoverContent.
7. **SSR/first-paint bias is a real decision.** shadcn's two hooks disagree: `use-mobile` renders the *desktop* branch first, the docs' `useMediaQuery` renders the *mobile* branch first; either way, the conditional-render pattern means (a) a possible flash/hydration re-render at the wrong breakpoint and (b) **state loss when crossing the breakpoint** (the other tree unmounts). Since responsivecn bakes the breakpoint at generation time, the generated hook should be one canonical, documented implementation — defaulting to 768px keeps it aligned with shadcn's `use-mobile` and the official demo.
8. **Registry dependency**: generated items can declare `registryDependencies: ["use-mobile"]` (bare name resolves to shadcn's built-in item) or ship their own hook file; and `dependencies: ["@base-ui/react"]` matches what shadcn's own base style declares (see [shadcn-registry-requirements.md](./shadcn-registry-requirements.md), §1).
9. **Whitelist sanity check passes**: all four pairs are constructible from what shadcn's Base registry actually ships today (`dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `popover.tsx`, `tooltip.tsx` in `apps/v4/registry/bases/base/ui/`), all importing `@base-ui/react`.

---

## Confidence & gaps

High confidence — parts/props/types quote the live `.md` API references verbatim; shadcn wrapper facts come from reading the five component sources at commit `3cdaa6e`. Remaining gaps:

1. **Doc-vs-source drift**: prop tables were taken from the docs (`base-ui.com/react/components/*.md`), spot-checked against `mui/base-ui` source only for the `ChangeEventDetails` generic. Base UI is at 1.6.0 with monthly minors; re-verify before freezing the generated templates.
2. **`Dialog.Handle` / payload generics** were not analyzed for the wrapper API (detached-trigger feature, orthogonal to the responsive swap). If responsivecn forwards `handle`, the pair's handles are distinct classes (`Dialog.Handle` vs `Drawer.Handle`) — a desktop handle cannot drive the mobile primitive; flag as unsupported in v1.
3. **shadcn `styles/base-rhea` variants**: the demo imports from `@/styles/base-rhea/ui/*`; these are style-layer builds of the same `registry/bases/base/ui` sources. Not diffed — assumed structurally identical.
4. The exact behavior of Base UI's touch-disable for Tooltip (event-level detail, e.g. whether `trigger-press` still fires on tap) is documented only as prose ("tooltips are disabled on touch devices"); not verified in source.
