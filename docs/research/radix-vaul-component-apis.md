# Radix + Vaul Component APIs — Dialog, Popover, Tooltip, Drawer (+ shadcn Sheet), radix base

Research date: **2026-07-12**. The radix-side mirror of [base-ui-component-apis.md](./base-ui-component-apis.md) (ticket #4), for the dual-base spec. All claims verified against primary sources only: the `radix-ui/primitives` source at commit [`e4e0664`](https://github.com/radix-ui/primitives/commit/e4e06649716b0134ece0df9e067403992cfeb47d) (tip of `main`, 2026-07-10), the `emilkowalski/vaul` source at commit [`3e97aac`](https://github.com/emilkowalski/vaul/commit/3e97aac6a38e4481bade71d7233ed6002e80f9b0) (tip of `main`, 2025-10-03), the live docs (radix-ui.com, vaul.emilkowal.ski), npm metadata, and `shadcn-ui/ui` at commit [`3cdaa6e`](https://github.com/shadcn-ui/ui/commit/3cdaa6eb2f0da27aca8598cb752c32d840e06940) — the **same pin** as the base-side research; re-verified 2026-07-12 that `3cdaa6e` is still the tip of `main`, so the radix tree (`apps/v4/registry/bases/radix`) has not moved since ticket #4/#9.

Packages (npm, verified 2026-07-12):
- **`vaul` latest `1.1.2`** — matches the repo tip; last publish 2024-12-14 (`npm view vaul time.modified`). Repo owner is **`emilkowalski`** (not `emilkowal`; verified via `git remote` and [package.json `repository`](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/package.json)). Sole runtime dependency: `@radix-ui/react-dialog ^1.1.1`.
- **`@radix-ui/react-dialog` / `react-popover` latest `1.1.19`**, **`react-tooltip` latest `1.2.12`** — all match the pinned monorepo source. shadcn's radix base imports the **`radix-ui` monolith** (latest `1.6.2`; `apps/v4` pins `^1.4.3`), which re-exports the scoped packages ([radix-ui package.json](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/radix-ui/package.json) lists `@radix-ui/react-dialog: workspace:*` etc.).

---

## TL;DR for the spec

- **⚠ Vaul is explicitly unmaintained.** The entire README at the repo tip reads: "This repo is unmaintained. I might come back to it at some point, but not in the near future. This was and always will be a hobby project…" (commit [`3e97aac` "Explain maintenance"](https://github.com/emilkowalski/vaul/commit/3e97aac6a38e4481bade71d7233ed6002e80f9b0), 2025-10-03; last npm publish 2024-12-14). shadcn's radix drawer still depends on it ([`dependencies: ["vaul"]`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/_registry.ts#L352-L360)). The mobile side of three of four pairs on the radix base is frozen software — **feed this to #16**.
- **`onOpenChange` is `(open: boolean) => void` on all four roots — identical, so the base-side union-typing question dissolves.** No `ChangeEventDetails`, no union needed, zero casts trivially. The flip side: **no `reason`, no `event`, no `cancel()`/`preventUnmountOnClose()` exists anywhere on the radix side**, so the pair-level `onOpenChange` public type *cannot* be identical across bases (base: `(open, details) => void`; radix: `(open) => void`). Cross-base API parity is prop-*name* parity, not prop-*type* parity — **feed this to #16** (§2).
- **Vaul.Root is a prop-name superset of Radix Dialog.Root** — Dialog.Root has exactly 5 props (`children`, `open`, `defaultOpen`, `onOpenChange`, `modal=true`; [dialog.tsx L47–L62](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L47-L62)); Vaul.Root has all 5 with identical types plus ~23 drawer-only props ([index.tsx L50–L137](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L50-L137)). The 1:1 desktop-root forwarding contract survives. But the superset is *shallower* than Base UI's: `modal` and `defaultOpen` carry divergent semantics on the Vaul side (§1.2, §5.1).
- **Sheet `side` ↔ Vaul `direction` is an identity lookup.** Both use the same four edge-named values (`"top" | "right" | "bottom" | "left"`); Vaul's `direction` names the anchored edge exactly like Sheet's `side` — *simpler* than the base side's `bottom→'down'` swipe-direction table. Same structural mismatch remains: `side` is a Content-level CSS-only prop, `direction` is a Root-level physics prop (§3.2).
- **Radix tooltips are touch-dead by source, not by docs.** The trigger ignores touch pointers outright — `if (event.pointerType === 'touch') return;` ([tooltip.tsx L295](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L294-L303)) — and tap/click actively close. The radix docs say only "Opens when the trigger is focused or hovered" and contain **no touch statement** ([tooltip docs](https://www.radix-ui.com/primitives/docs/components/tooltip)). The TooltipPopover pair's rationale holds on radix, but the citation must be source, and Base UI's documented "Popover with `openOnHover`" infotip alternative is **not portable** — Radix Popover has no hover-open ability (§1.4, §3.4).
- **Radix Popover has no Title/Description primitives at all** — shadcn's `PopoverTitle`/`PopoverDescription` are bare styled `<div>`/`<p>` with zero aria wiring ([popover.tsx L58–L79](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/popover.tsx#L58-L79)). On base, `Popover.Title`/`Description` were real a11y parts. Consequence: in PopoverDrawer, the **mobile** drawer side carries *more* aria semantics than the desktop popover side (inverted vs. base) — and the TooltipPopover fallback story gets easier (§3.3, §3.4).
- **shadcn wrappers hide most parts, same as base**: every `*Content` bundles Portal (+ Overlay where relevant). Positioning props live natively on Radix `Popover.Content`/`Tooltip.Content` (no Positioner part to hide), so radix `PopoverContent` exposes the *full* Popper surface (`side`, `align`, `sideOffset=4`, `collision*`, `sticky`, …) typed 1:1 — a larger desktop-only prop-drop list for PopoverDrawer than on base (§1.3, §3.3).
- **Vaul's own docs are unreliable for typing**: the [API page](https://vaul.emilkowal.ski/api) documents ~15 of ~28 Root props and mistypes `activeSnapPoint` as `boolean`; in-source JSDoc contradicts the code on `disablePreventScroll`'s default. shadcn's radix drawer docs punt entirely: "See the [Vaul documentation](https://vaul.emilkowal.ski/getting-started) for the full API reference" ([drawer.mdx L131–L133](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/content/docs/components/radix/drawer.mdx)). **Type `drawer={{}}` from the package's `.d.ts`, never from docs** (§5.5).

---

## 1. Parts & props per component

Part lists and props read from the pinned sources. Every rendering part additionally accepts `asChild` (Radix's element-replacement, analogous to Base UI's `render`) plus standard div/button props; those are omitted below. Cross-checked against the live docs API references ([dialog](https://www.radix-ui.com/primitives/docs/components/dialog), [popover](https://www.radix-ui.com/primitives/docs/components/popover), [tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip), [vaul](https://vaul.emilkowal.ski/api), all fetched 2026-07-12).

### 1.1 Dialog (`@radix-ui/react-dialog` 1.1.19, via `radix-ui`)

Anatomy: `Root > Trigger + Portal > (Overlay, Content > Title/Description/Close)`. No Backdrop/Popup split, no Viewport, no handles/payloads — the whole surface is 8 parts.

| Part | Renders | Load-bearing props |
|---|---|---|
| `Root` | nothing | `open`, `defaultOpen`, `onOpenChange(open: boolean)`, `modal` **default `true`** — that's the whole interface ([dialog.tsx L47–L62](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L47-L62)) |
| `Trigger` | `<button>` | `data-state="open" \| "closed"` |
| `Portal` | portal to `<body>` | `container`, `forceMount` |
| `Overlay` | `<div>` | `forceMount`; **renders `null` when `modal={false}`** ([L195–L199](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L195-L199)) |
| `Content` | `<div role="dialog">` | `forceMount`, `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown(KeyboardEvent)`, `onPointerDownOutside(PointerDownOutsideEvent)`, `onInteractOutside(PointerDownOutsideEvent \| FocusOutsideEvent)` — inherited from `Omit<DismissableLayerProps, 'onDismiss'>` ([L384–L403](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L384-L403); event types are `CustomEvent<{originalEvent: PointerEvent}>` / `CustomEvent<{originalEvent: FocusEvent}>`, [dismissable-layer.tsx L302–L303](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dismissable-layer/src/dismissable-layer.tsx#L302-L303)) |
| `Title` / `Description` | `<h2>` / `<p>` | wired to `aria-labelledby`/`aria-describedby` on Content |
| `Close` | `<button>` | click → `onOpenChange(false)` |

Modal vs non-modal (source, [L280–L377](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L280-L377)): modal = focus trap + `aria-hidden` on the rest (`hideOthers`) + `RemoveScroll` + outside pointer events disabled; non-modal = none of that, **and outside interactions dismiss the dialog** (DismissableLayer `onDismiss` fires unless prevented).

**shadcn wrapper** ([`bases/radix/ui/dialog.tsx`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/dialog.tsx)): 10 exports — `Dialog` (Root pass-through typed `React.ComponentProps<typeof DialogPrimitive.Root>` 1:1), `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent` (**Portal + Overlay + Content + auto close button**, extra prop `showCloseButton = true`), `DialogHeader`/`DialogFooter` (plain `<div>`s; Footer takes `showCloseButton = false`), `DialogTitle`, `DialogDescription`. Identical export set and extra props as the base-side wrapper. Radix names map 1:1 (`Overlay` is already `Overlay`, `Content` already `Content` — no Backdrop/Popup renaming as on base).

### 1.2 Drawer (`vaul` 1.1.2)

**Vaul is a layer on Radix Dialog, not a separate primitive**: `import * as DialogPrimitive from '@radix-ui/react-dialog'` ([index.tsx L3](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L3)); `Root` renders `<DialogPrimitive.Root defaultOpen onOpenChange open modal>` internally ([L748–L763](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L748-L763)).

Re-export vs redefine (the `Drawer` namespace, [L1137–L1148](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L1137-L1148)):

| Vaul part | Relation to Radix Dialog |
|---|---|
| `Trigger`, `Close`, `Title`, `Description` | **direct re-exports** (`Trigger: DialogPrimitive.Trigger`, …) — bit-identical Radix parts |
| `Portal` | thin wrapper: injects the Root-level `container` from context, then renders `DialogPrimitive.Portal` ([L1130–L1135](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L1130-L1135)) |
| `Overlay` | wraps `DialogPrimitive.Overlay`, props typed 1:1 (`ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>`); adds `data-vaul-*` attrs; **returns `null` when `modal={false}`** — "Overlay is the component that is locking scroll, removing it will unlock the scroll without having to dig into Radix's Dialog library" ([L803–L827](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L803-L827)) |
| `Content` | wraps `DialogPrimitive.Content`, props typed 1:1 (`export type ContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>`, [L831](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L831)); adds all drag handling + `data-vaul-*` attrs; intercepts `onOpenAutoFocus`/`onPointerDownOutside`/`onFocusOutside` (§5.1, §5.3) |
| `Root`, `NestedRoot`, `Handle` | Vaul-only implementations (`Handle` = `<div data-vaul-handle>` with `preventCycle?: boolean`, tap-to-cycle-snap-points behavior, [L989–L1094](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L989-L1094)) |

`Root` props — the full `DialogProps` type ([L50–L137](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L50-L137)), defaults from the destructuring ([L139–L169](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L139-L169)):

| Group | Props |
|---|---|
| Shared with Radix Dialog.Root (identical types) | `open`, `defaultOpen=false`, `onOpenChange(open: boolean)`, `modal=true`, `children` |
| Placement / gesture | `direction: 'top' \| 'bottom' \| 'left' \| 'right'` **default `'bottom'`**, `dismissible=true`, `handleOnly=false`, `closeThreshold=0.25`, `scrollLockTimeout=100` (ms), `onDrag(event, percentageDragged)`, `onRelease(event, open)` |
| Snap points | `snapPoints?: (number \| string)[]` (0–1 = fraction of screen, or px/`'148px'` strings), `activeSnapPoint?: number \| string \| null` + `setActiveSnapPoint?(snapPoint)` (controlled pair; uncontrolled default = `snapPoints[0]`, [use-snap-points.ts L30–L34](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/use-snap-points.ts#L30-L34)), `fadeFromIndex?: number` (defaults to last index; **only legal together with `snapPoints`** — enforced by the `WithFadeFromProps \| WithoutFadeFromProps` union with `fadeFromIndex?: never`, [L27–L48](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L27-L48)), `snapToSequentialPoint=false` |
| Background / body effects | `shouldScaleBackground=false` (requires a user-placed `[data-vaul-drawer-wrapper]` attribute on the app shell, [L377](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L377)), `setBackgroundColorOnScale=true`, `noBodyStyles=false` |
| Keyboard / scroll | `repositionInputs=true`, `fixed`, `disablePreventScroll=true` ⚠ (JSDoc claims `@default false`; code says `true` — [L112–L115 vs L162](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L112-L115)), `preventScrollRestoration=false` |
| Lifecycle / misc | `onClose()`, `onAnimationEnd(open: boolean)` (fired via `setTimeout(…, 500)` after open change — `TRANSITIONS.DURATION = 0.5`s, [L180–L182](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L180-L182) + [constants.ts](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/constants.ts)), `autoFocus=false` (when `false`, Vaul `preventDefault()`s Radix's open auto-focus, [L925–L931](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L925-L931)), `container?: HTMLElement \| null` (Root-level portal target), `nested` |

Styling hooks (source): `data-vaul-drawer`, `data-vaul-drawer-direction={direction}`, `data-vaul-snap-points`, `data-vaul-delayed-snap-points`, `data-vaul-custom-container`, `data-vaul-animate` on Content ([L902–L908](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L902-L908)); `--snap-point-height` CSS var ([L911–L918](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L911-L918)); `data-vaul-no-drag` attribute to opt an element out of dragging ([L292](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L292)); plus Radix's `data-state` on the wrapped parts.

**shadcn wrapper** ([`bases/radix/ui/drawer.tsx`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/drawer.tsx)): 10 exports — `Drawer` (Root, typed `ComponentProps<typeof DrawerPrimitive.Root>` 1:1), `DrawerPortal`, `DrawerOverlay`, `DrawerTrigger`, `DrawerClose`, `DrawerContent` (Portal + Overlay + Content + **a plain `<div className="cn-drawer-handle …">` rendered unconditionally**, shown via CSS only for `data-[vaul-drawer-direction=bottom]`, [L64](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/drawer.tsx#L64)), `DrawerHeader`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`. Differences vs the base-side drawer wrapper: **no `DrawerSwipeHandle` export and no `showSwipeHandle` root prop** (base had 11 exports); the handle is cosmetic CSS, *not* Vaul's interactive `Handle` part (no tap-to-cycle); no modal-conditional Overlay in the wrapper (Vaul's own Overlay already nulls itself when non-modal); the Content's placement styling is keyed entirely off Vaul's Root-driven `data-vaul-drawer-direction` attribute ([L59](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/drawer.tsx#L59)). Registry item declares `dependencies: ["vaul"]` ([_registry.ts L352–L360](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/_registry.ts#L352-L360)); `radix-ui` itself is a style-level dependency ([registry.ts L15–L19](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/registry.ts#L15-L19)).

### 1.3 Popover (`@radix-ui/react-popover` 1.1.19)

Anatomy: `Root > Anchor? + Trigger + Portal > Content > Arrow/Close`. **No Title, no Description, no Backdrop** — much thinner than Base UI Popover (which has Title/Description/Close/Backdrop/Viewport parts).

| Part | Renders | Load-bearing props |
|---|---|---|
| `Root` | nothing | `open`, `defaultOpen`, `onOpenChange(open: boolean)`, `modal` **default `false`** ([popover.tsx L48–L63](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L48-L63)) |
| `Anchor` | `<div>` | optional custom anchor; when present the Trigger stops anchoring ([L155–L161](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L155-L161)) |
| `Trigger` | `<button>` | click toggles; doubles as Popper anchor |
| `Portal` | portal | `container`, `forceMount` |
| `Content` | `<div role="dialog">` | positioning (from `Omit<PopperContentProps, 'onPlaced'>`, defaults in [popper.tsx L158–L188](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popper/src/popper.tsx#L158-L188)): `side='bottom'`, `sideOffset=0`, `align='center'`, `alignOffset=0`, `avoidCollisions=true`, `collisionBoundary=[]`, `collisionPadding=0`, `arrowPadding=0`, `sticky='partial'`, `hideWhenDetached=false`, `updatePositionStrategy='optimized'`; dismissal callbacks identical to Dialog.Content (`onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`), `forceMount`; CSS vars `--radix-popover-content-transform-origin/-available-width/-available-height`, `--radix-popover-trigger-width/-height` ([L428–L438](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L428-L438)) |
| `Close` | `<button>` | click → close ([L455–L468](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L455-L468)) |
| `Arrow` | `<svg>` | `width=10`, `height=5` |

`Side = 'top' | 'right' | 'bottom' | 'left'` — **4 values** ([popper.tsx L25–L29](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popper/src/popper.tsx#L25-L29)); Base UI had 6 (`inline-start/-end` extra). Modal popover adds `RemoveScroll` + `hideOthers` + focus trap ([L251–L299](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L251-L299)); non-modal (default) dismisses on outside interaction.

**Trigger is click-only.** There is no `openOnHover`/`delay`/`closeDelay` anywhere in Radix Popover — Base UI's hover-open infotip pattern does not exist here (Radix's hover primitive is the separate HoverCard package, which is outside the whitelist).

**shadcn wrapper** ([`bases/radix/ui/popover.tsx`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/popover.tsx)): 7 exports — `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger`. `PopoverContent` = Portal + Content with explicit defaults `align="center"`, `sideOffset={4}`, typed plainly as `React.ComponentProps<typeof PopoverPrimitive.Content>` — i.e. **the whole Popper positioning surface is public** (nothing is "lifted" because Radix has no Positioner part). **No `PopoverClose`, no `PopoverArrow` export** (both primitives exist, unexported — same Close-omission as base). `PopoverHeader`/`PopoverTitle`/`PopoverDescription` are pure styled elements: Title is typed `ComponentProps<"h2">` but **renders a `<div>`** ([L58–L66](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/popover.tsx#L58-L66)); Description renders `<p>`. None is aria-wired (Radix Popover has no such primitives to wire to). vs base wrapper: base exports 6 (no Anchor); radix adds `PopoverAnchor`.

### 1.4 Tooltip (`@radix-ui/react-tooltip` 1.2.12)

Anatomy: `Provider > Root > Trigger + Portal > Content > Arrow`. **No Close, no Title/Description, no Overlay, no modal prop** — same structural poverty as Base UI Tooltip.

| Part | Renders | Load-bearing props |
|---|---|---|
| `Provider` | nothing | `delayDuration=700`, `skipDelayDuration=300` (grace window for instant re-open across adjacent tooltips), `disableHoverableContent=false` ([tooltip.tsx L45–L73](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L45-L73)); `children` **required** |
| `Root` | nothing | `open`, `defaultOpen`, `onOpenChange(open: boolean)`, `delayDuration?` (overrides Provider), `disableHoverableContent?` ([L136–L152](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L136-L152)) |
| `Trigger` | `<button>` (Popper anchor) | hover/focus opens, but: **`onPointerMove` returns early for `pointerType === 'touch'`** ([L294–L303](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L294-L303)); `onPointerDown` closes an open tooltip and suppresses the subsequent focus-open; `onClick` closes ([L308–L319](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L308-L319)) — net effect: **a tap can never open a Radix tooltip** |
| `Portal` | portal | `container`, `forceMount` |
| `Content` | `<div>` + a `VisuallyHidden` copy with `role="tooltip"` ([L568–L573](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L568-L573)) | `Omit<PopperContentProps, 'onPlaced'>` with `side` **default `'top'`** ([L387](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L387)); plus only `aria-label`, `onEscapeKeyDown`, `onPointerDownOutside`, `forceMount` ([L489–L505](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L489-L505)) — no focus callbacks (tooltips never take focus) |
| `Arrow` | `<svg>` | as Popover.Arrow |

⚠ Tooltip's `data-state` values are **`'closed' | 'delayed-open' | 'instant-open'`** ([L190–L192](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L190-L192)) — not the `'open' | 'closed'` of Dialog/Popover/Vaul. Styling shared across a pair must not key on `data-state="open"`.

**shadcn wrapper** ([`bases/radix/ui/tooltip.tsx`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/tooltip.tsx)): 4 exports — `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`. `TooltipProvider` overrides `delayDuration = 0` (Radix default 700). `TooltipContent` = Portal + Content **+ Arrow baked in**, `sideOffset = 0` (base-side TooltipContent used 4). **App-level Provider is the documented convention**: the registry item's install note says "Remember to wrap your app with the `TooltipProvider` component" with a `app/layout.tsx` example ([_registry.ts L940–L957](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/_registry.ts#L940-L957)) — same app-level convention as the base side.

### 1.5 Sheet (shadcn wrapper over Radix Dialog)

Exactly as on base: **Sheet is Radix Dialog** — `import { Dialog as SheetPrimitive } from "radix-ui"` ([sheet.tsx L4](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/sheet.tsx#L4)). 8 exports — `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`; `SheetPortal`/`SheetOverlay` defined but **not exported**. `SheetContent` adds `side?: "top" | "right" | "bottom" | "left"` **default `"right"`** — CSS-only via `data-side` ([L48–L67](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/sheet.tsx#L48-L67)) — and `showCloseButton = true`.

### 1.6 Legacy `new-york-v4` style

The pre-dual-base tree `apps/v4/registry/new-york-v4/ui/` still exists at `3cdaa6e`. For these five components it is **structurally identical** to `bases/radix/ui`: same imports (`radix-ui` monolith, `vaul`), same export sets (dialog 10, drawer 10, sheet 8, popover 7 incl. `PopoverAnchor`, tooltip 4), same lifted props (`showCloseButton`, `side="right"`, `delayDuration=0`, `sideOffset=0` + baked Arrow); only the Tailwind class strings differ (new-york-v4 inlines them, bases/radix uses `cn-*` tokens) — including the same unconditional cosmetic handle div in `DrawerContent` (`hidden … group-data-[vaul-drawer-direction=bottom]/drawer-content:block`). Verified by diffing all five files at the pin.

---

## 2. State callbacks — exact signatures, and what happened to the union

### 2.1 The signatures (all from source)

| Callback | Radix Dialog | Vaul Drawer | Radix Popover | Radix Tooltip |
|---|---|---|---|---|
| `onOpenChange` | `(open: boolean) => void` | `(open: boolean) => void` | `(open: boolean) => void` | `(open: boolean) => void` |
| Root-level extras | — | `onDrag(event: React.PointerEvent<HTMLDivElement>, percentageDragged: number)`, `onRelease(event: React.PointerEvent<HTMLDivElement>, open: boolean)`, `onClose()`, `onAnimationEnd(open: boolean)`, `setActiveSnapPoint(snapPoint: number \| string \| null)` | — | — |
| Content-level | `onOpenAutoFocus(Event)`, `onCloseAutoFocus(Event)`, `onEscapeKeyDown(KeyboardEvent)`, `onPointerDownOutside(PointerDownOutsideEvent)`, `onInteractOutside(PointerDownOutsideEvent \| FocusOutsideEvent)` (+`onFocusOutside` via DismissableLayer) | **identical to Dialog** (Content typed `ComponentPropsWithoutRef<typeof DialogPrimitive.Content>`, [index.tsx L831](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L831)) | same set as Dialog + positioning | only `onEscapeKeyDown`, `onPointerDownOutside` |

Sources: Dialog [L47–L53](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L47-L53), Vaul [L50–L137](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L50-L137), Popover [L48–L54](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L48-L54), Tooltip [L136–L152](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L136-L152).

### 2.2 Union typing: unnecessary — and impossible to enrich

On base, the shared `onOpenChange` was typed as the per-pair union of `ChangeEventDetails` (contravariance made it assignable both ways, zero casts). On radix **all four roots share the literal same signature `(open: boolean) => void`**, so:

- The pair-level `onOpenChange` type is just `(open: boolean) => void`. No union, no generics, **zero casts** — trivially assignable to both sides of every pair. `onOpenChange={setOpen}` works everywhere (shadcn's own radix demo does exactly that, [drawer-dialog.tsx](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/examples/radix/drawer-dialog.tsx)).
- Content-level callbacks are zero-cast for the same reason but stronger: for DialogDrawer/SheetDrawer the two sides' Content props are *the same declared type* (Vaul re-uses Radix's). Even though `vaul` bundles its own `@radix-ui/react-dialog` dependency (potentially a second copy in `node_modules`), the event types (`CustomEvent<{originalEvent: PointerEvent}>` etc.) unify structurally — TypeScript is structural, so no casts arise from the duplicate package either.
- **Casts become inevitable: nowhere.** There is no state callback in the whitelist whose two pair-sides have incompatible parameter types.

**⚠ Flag for #16 — the contract is weaker, not just simpler.** What made the base-side union valuable — `reason` discrimination, `eventDetails.cancel()`, `preventUnmountOnClose()`, the native `event` — **does not exist on radix**. Consequences to grill:

1. The public `onOpenChange` prop type of a generated pair component **differs between bases**: `(open, details) => void` (base) vs `(open) => void` (radix). A user callback written for one base does not type-check semantically on the other (a `(open) => void` callback works on both, but any base-side `details` usage is unportable). "Same spec, two bases" holds at prop-name level only.
2. "Which side closed and why" is unrecoverable on radix at the root; the closest radix analogs are the *Content-level* callbacks (`onPointerDownOutside`, `onEscapeKeyDown`, …), which are per-part, preventable, and differently shaped from Base UI's reason strings.
3. Vaul's close-gesture visibility is `onDrag`/`onRelease`/`onClose` on the **Root** — mobile-only callbacks with no desktop analog → natural `drawer={{}}` residents, same slot as base's `onSnapPointChange`.
4. Base UI's `onOpenChangeComplete(open)` (both roots) has **no radix equivalent on the desktop side**; the mobile side offers only Vaul's `onAnimationEnd(open)` — which is not an `animationend` listener but a hard-coded 500 ms `setTimeout` after the open-state change ([L180–L182](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L180-L182)). Any cross-base "after the animation" API promise breaks on radix.

### 2.3 Two typing gotchas for `drawer={{}}` (radix flavor)

1. **Vaul's Root props are an intersection with a union**: `DialogProps = {...} & (WithFadeFromProps | WithoutFadeFromProps)`, where `WithoutFadeFromProps` declares `fadeFromIndex?: never` ([L27–L48](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L27-L48)). This encodes "`fadeFromIndex` requires `snapPoints`". Passing the object through typed exactly as `React.ComponentProps<typeof DrawerPrimitive.Root>` preserves the constraint; any `Omit<>`/`Pick<>`/mapped-type reshaping of it **flattens the union and silently loses the constraint** (no cast needed, but the type gets more permissive). Prefer `Omit` only over keys the pair actually consumes, or intersect the override type rather than rebuilding it.
2. **`onAnimationEnd` name-shadows React's DOM handler.** On Vaul's Root (renders no DOM) it's unambiguous, but any design that merges Root props into a DOM-rendering part's props collides with `React.DOMAttributes.onAnimationEnd` — pushmodal had to `Omit<'onAnimationEnd'>` for exactly this (see [responsive-pair-libs.md §4.2](./responsive-pair-libs.md)). Keep `drawer={{}}` strictly Root-shaped.

---

## 3. Part-correspondence tables per pair

Mappings at the **shadcn wrapper level** (the granularity responsivecn generates), radix base. Export censuses counted from each file's `export { … }` block at `3cdaa6e`. Orphan policy vocabulary from [responsive-pair-libs.md §8](./responsive-pair-libs.md).

### 3.1 DialogDrawer (Dialog → Drawer)

Export sets: dialog **10**, drawer **10** — and they pair **1:1 by name with zero orphan parts**: `{Dialog↔Drawer}` + `Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Close`. This is *cleaner* than base, where the drawer side had an 11th export (`DrawerSwipeHandle`) and a `showSwipeHandle` root prop.

| Desktop (Dialog) | Mobile (Drawer) | Notes |
|---|---|---|
| `Dialog` (Root) | `Drawer` (Root) | Vaul.Root props ⊇ Dialog.Root props (all 5 desktop props forward 1:1, identical types) |
| `DialogTrigger` / `DialogClose` / `DialogTitle` / `DialogDescription` | `Drawer*` | mobile side is literally the same Radix parts (Vaul re-exports them, §1.2) — the strongest 1:1 in the whole project |
| `DialogContent` (`showCloseButton=true`) | `DrawerContent` | both bundle Portal+Overlay+Content; Content-level callbacks identically typed on both sides (§2.1); Drawer side auto-renders the cosmetic handle div; `showCloseButton` is desktop-only (drawer dismisses by swipe) |
| `DialogHeader`/`DialogFooter` | `DrawerHeader`/`DrawerFooter` | plain divs both sides; `DialogFooter.showCloseButton=false` is desktop-only |
| `DialogOverlay`/`DialogPortal` | `DrawerOverlay`/`DrawerPortal` | both Overlays render `null` when non-modal (Radix [L195–L199](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/dialog/src/dialog.tsx#L195-L199), Vaul [L811–L813](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L811-L813)) |
| — (root) | `direction`, `snapPoints`, `activeSnapPoint`/`setActiveSnapPoint`, `fadeFromIndex`, `snapToSequentialPoint`, `dismissible`, `handleOnly`, `repositionInputs`, `autoFocus`, `shouldScaleBackground`(+wrapper attr), `onDrag`/`onRelease`/`onClose`/`onAnimationEnd`, … | **mobile-only root props** → the natural contents of `drawer={{}}`; none exists on the desktop side |
| — | Vaul `Handle`, `NestedRoot` | not exposed by shadcn's wrapper — out of v1 mapping (handle is cosmetic CSS in the wrapper) |

Behavioral deltas: both roots default `modal: true`, but **non-modal semantics diverge** (§5.1); `defaultOpen` on Vaul also skips the enter animation ([L106–L110](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L106-L110)); Vaul `dismissible={false}` blocks *all* user-initiated closing at the root ([L751–L752](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L751-L752)) — Radix Dialog has no root-level equivalent (per-event `preventDefault` on Content instead).

### 3.2 SheetDrawer (Sheet → Drawer) — and `side` ↔ `direction`

Sheet **is** Radix Dialog (§1.5), so everything in 3.1 applies. Export sets: sheet **8**, drawer **10**; drawer-only exports `DrawerPortal`/`DrawerOverlay` (sheet keeps its own internal), same as base.

The placement mapping:

| | Desktop: shadcn Sheet | Mobile: Vaul Drawer |
|---|---|---|
| Prop | `side?: "top" \| "right" \| "bottom" \| "left"` | `direction?: 'top' \| 'bottom' \| 'left' \| 'right'` |
| Default | `"right"` | `'bottom'` |
| Lives on | **`SheetContent`** (Content-level) | **`Drawer`** (Root-level) |
| Mechanism | CSS only — sets `data-side`, wrapper styles slide-in per side ([sheet.tsx L48–L67](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/sheet.tsx#L48-L67)) | gesture physics + placement: drives drag axis/close direction in Vaul ([helpers/`isVertical`, direction multipliers L364, L627–L639](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L364)) *and* the shadcn wrapper's placement CSS via `data-vaul-drawer-direction` ([drawer.tsx L59](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/drawer.tsx#L59)) |
| Semantics | names the **anchored edge** | names the **anchored edge** (JSDoc: "Direction of the drawer. Can be `top` or `bottom`, `left`, `right`", [L101–L105](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L101-L105)) |

**The fixed lookup is the identity map**: `top→'top'`, `right→'right'`, `bottom→'bottom'`, `left→'left'`. Simpler than base, where Drawer's `swipeDirection` named the *closing swipe* and needed `bottom→'down'`/`top→'up'`. Same axis semantics both sides (a `right` sheet and a `direction="right"` drawer both hug the right edge; horizontal drawers skip Vaul's scroll-lock heuristics and are always draggable, [L296–L298](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L296-L298)). Same structural caveat as base: the value moves from a Content prop (desktop) to a Root prop (mobile), so the generator must hoist it; and the *defaults* differ (`right` vs `bottom`), so "forward `side` verbatim" changes the mobile default edge unless the spec decides otherwise.

### 3.3 PopoverDrawer (Popover → Drawer)

Export sets: popover **7**, drawer **10**. Pair 1:1: Root, Trigger, Content, Header, Title, Description (6).

| Desktop (Popover) | Mobile (Drawer) | Notes |
|---|---|---|
| `Popover` (Root) | `Drawer` (Root) | ⚠ **`modal` default mismatch persists on radix**: Popover `false` ([L63](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L63)) vs Vaul `true` ([L156](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L156)) — **and** non-modal behavior differs in kind (§5.1) |
| `PopoverTrigger` | `DrawerTrigger` | both plain click-toggle buttons — *no* hover props to drop (unlike base, where `openOnHover`/`delay`/`closeDelay` existed desktop-side) |
| `PopoverContent` | `DrawerContent` | the **entire Popper surface** (`side`, `sideOffset=4`, `align`, `alignOffset`, `avoidCollisions`, `collisionBoundary`, `collisionPadding`, `arrowPadding`, `sticky`, `hideWhenDetached`, `updatePositionStrategy`) is desktop-only and meaningless on an edge-anchored drawer → explicit per-prop drop list, larger than base's 4 lifted props; dismissal callbacks (`onEscapeKeyDown`, `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`, `onOpenAutoFocus`, `onCloseAutoFocus`) are shared and identically typed on both sides |
| `PopoverHeader`/`PopoverTitle`/`PopoverDescription` | `DrawerHeader`/`DrawerTitle`/`DrawerDescription` | ⚠ **a11y asymmetry inverted vs base**: desktop side is bare styled divs (no Radix primitive behind them, §1.3); mobile side is real `DialogPrimitive.Title`/`Description` wired to `aria-labelledby`/`aria-describedby`. The *mobile* rendering is the semantically richer one — the pair upgrades a11y on mobile rather than losing it |
| `PopoverAnchor` | — | **new orphan, absent on base** (base wrapper exports no Anchor). Anchoring has no drawer meaning. Fallback options: render children via plain `<div>` on mobile (layout survives), or omit from the pair surface; never `null`-with-children-lost |
| — | `DrawerClose` | desktop fallback exists as a **hidden primitive part**: Radix `Popover.Close` is real ([L455–L468](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/popover/src/popover.tsx#L455-L468)), shadcn just doesn't export it — same fallback route as base |
| — | `DrawerFooter` | desktop fallback: plain styled `<div>` (DropDrawer's precedented policy; shadcn `PopoverHeader` is already exactly that) |
| — | `DrawerPortal`/`DrawerOverlay` | popover side bundles Portal inside Content and has no overlay concept (non-modal default); drawer shows overlay when modal |
| — (root) | `drawer={{ direction, snapPoints, … }}` | as 3.1 |

### 3.4 TooltipPopover (Tooltip → Popover)

Export sets: tooltip **4**, popover **7**. Pair 1:1: Root, Trigger, Content (3).

| Desktop (Tooltip) | Mobile (Popover) | Notes |
|---|---|---|
| `TooltipProvider` | — | no Popover equivalent; **app-level convention on radix too** — the registry install note wraps `app/layout.tsx` ([_registry.ts L940–L957](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/ui/_registry.ts#L940-L957)). The pair can assume it exists and must not render one on mobile |
| `Tooltip` (Root) | `Popover` (Root) | shared: `open`/`defaultOpen`/`onOpenChange` (identical types). Desktop-only: `delayDuration`, `disableHoverableContent` (drop on mobile). Mobile-only: `modal` → `popover={{ modal }}`. Tooltip has **no `modal`**, same as base |
| `TooltipTrigger` | `PopoverTrigger` | hover/focus semantics → press semantics. ⚠ Unlike base, **there is no hover-open option on the mobile side**: Radix Popover.Trigger is click-only (§1.3). Base UI's documented infotip recipe ("Popover with `openOnHover`") cannot be reproduced — the radix pair is strictly "hover tooltip on desktop / press popover on mobile" |
| `TooltipContent` (Portal+Content+**Arrow baked**, `sideOffset=0`) | `PopoverContent` (Portal+Content, **no Arrow**, `sideOffset=4`) | ⚠ default `side` differs: tooltip `'top'` vs popover `'bottom'` (both Radix defaults, kept by shadcn); default `sideOffset` differs too (0 vs 4). Desktop Content also renders the hidden `role="tooltip"` copy; popover content is `role="dialog"` |
| — | `PopoverHeader`/`PopoverTitle`/`PopoverDescription` | mobile-only exports, but note they are bare styled elements on radix (§1.3) — a desktop fallback of identical plain elements is *semantically lossless*, easier than base (where Popover.Title/Description were real parts that a desktop-side div could not fully imitate) |
| — | `PopoverAnchor` | mobile-only export; on desktop the tooltip trigger is always the anchor (Radix Tooltip has no Anchor part) |
| (touch) | | Radix disables tooltip opening for touch pointers **in source** ([tooltip.tsx L294–L319](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L294-L319)); docs say only "Opens when the trigger is focused or hovered. Closes when the trigger is activated or when pressing escape" ([tooltip docs](https://www.radix-ui.com/primitives/docs/components/tooltip)) — no touch statement, no documented alternative. The pair's *reason to exist* is identical to base; its *citation basis* is source-only |
| (styling) | | tooltip `data-state ∈ {closed, delayed-open, instant-open}` vs popover `{open, closed}` (§1.4) — shared classNames must not assume `data-state="open"` on the desktop side |

---

## 4. shadcn responsive patterns today (radix base)

1. **`use-mobile` hook** — the radix registry ships the same hook as base: `MOBILE_BREAKPOINT = 768`, `matchMedia("(max-width: 767px)")`, state starts `undefined`, returns `!!isMobile` → **desktop-first on SSR/first render** ([bases/radix/hooks/use-mobile.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/radix/hooks/use-mobile.ts)).
2. **Official "Responsive Dialog" recipe** — radix drawer docs: "You can combine the `Dialog` and `Drawer` components to create a responsive dialog. This renders a `Dialog` component on desktop and a `Drawer` on mobile." ([drawer.mdx L119–L123](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/content/docs/components/radix/drawer.mdx)). The demo ([examples/radix/drawer-dialog.tsx](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/examples/radix/drawer-dialog.tsx)) is the two-tree fork already dissected in [responsive-pair-libs.md §2](./responsive-pair-libs.md): app-level `useMediaQuery("(min-width: 768px)")` (mobile-first SSR — opposite bias to `use-mobile`), hoisted `open` + `onOpenChange={setOpen}` on both roots, `DrawerFooter`/`DrawerClose` only in the mobile branch.
3. **Still no packaged responsive component** in the radix registry — the recipe is a docs example only; nothing changed vs the base-side finding.

---

## 5. Divergent gotchas (the #16 feed)

### 5.1 `modal` semantics matrix

| | default | non-modal: overlay | non-modal: outside press | non-modal: scroll lock / focus trap / aria-hide |
|---|---|---|---|---|
| Radix Dialog / Sheet | `true` | Overlay renders `null` | **dismisses** | none |
| Radix Popover | **`false`** | (no overlay part in wrapper) | **dismisses** | none |
| Radix Tooltip | no prop | — | closes (`onPointerDownOutside`) | never |
| Vaul Drawer | `true` | Overlay renders `null` | **does NOT dismiss** — Content `preventDefault()`s `onPointerDownOutside` and `onFocusOutside` when `!modal` ([L932–L949](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L932-L949)); body `pointer-events` force-restored ([L739–L746](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L739-L746)) | scroll lock disabled (`usePreventScroll` `isDisabled: … \|\| !modal`, [L244–L247](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L244-L247)) |

For PopoverDrawer this is a *double* divergence: forwarding nothing makes mobile modal while desktop isn't (same as base); forwarding `modal: false` via `drawer={{}}` yields a drawer that **stays open on outside taps** — behaviorally unlike the non-modal popover it replaces. The spec must pick and document a policy, not just a default.

### 5.2 Tooltip touch behavior

Effective behavior matches Base UI (no tooltip for touch users) but is **undocumented**: Radix docs have no touch statement; the guarantee lives in `TooltipTrigger` source — touch pointer-moves ignored ([L294–L303](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L294-L303)), pointer-down suppresses focus-open and click closes ([L308–L319](https://github.com/radix-ui/primitives/blob/e4e06649716b0134ece0df9e067403992cfeb47d/packages/react/tooltip/src/tooltip.tsx#L294-L319)). Being source-only, it is an implementation detail Radix could change without a docs breach — pin the version when the spec cites it. Also: no Radix-blessed "accessible alternative" doc exists (Base UI prescribed Popover-with-hover); the TooltipPopover pair is *responsivecn's own* prescription on radix.

### 5.3 Focus on open: the Vaul `autoFocus` trap

Radix Dialog auto-focuses the content on open (FocusScope `onMountAutoFocus`); **Vaul suppresses that by default** — `autoFocus=false` → `onOpenAutoFocus` is `preventDefault()`ed ([L925–L931](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L925-L931)) — so focus stays on the trigger, which `hideOthers` then marks `aria-hidden` → the console error both Credenza and DropDrawer patch by hard-coding `autoFocus: true` on the mobile branch ([Credenza #15](https://github.com/redpangilinan/credenza/issues/15); [responsive-pair-libs.md §7.4](./responsive-pair-libs.md)). On base this workaround was unnecessary. **The radix DialogDrawer/SheetDrawer/PopoverDrawer generators should either default `autoFocus: true` on the Vaul side or document `drawer={{ autoFocus: true }}` as the first recipe.**

### 5.4 Portals, z-index, styling hooks

- Vaul portals through **Radix's Portal** (default `document.body`); the portal target is configurable at the Vaul **Root** (`container`) *and* per-`Portal` — vs Radix desktop side where `container` exists only on the Portal part. A `container` forwarded 1:1 from the desktop root does not exist; a `drawer={{ container }}` does. Nested drawers (`NestedRoot`) portal independently and coordinate via context ([L1098–L1126](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L1098-L1126)).
- shadcn applies `z-50` to overlay + content on both sides of every pair — no z-index divergence at the wrapper level.
- Styling attribute vocabularies differ per side: Radix `data-state`/`data-side`/`data-align` + `--radix-popover-*`/`--radix-tooltip-*` vars; Vaul `data-vaul-*` + `--snap-point-height`; and Vaul's background-scale requires the user-placed `[data-vaul-drawer-wrapper]` app-shell attribute ([L377](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L377)) — the base side did this with Provider/Indent *parts*. An app-level attribute cannot be owned by the generated component; document it as an opt-in.

### 5.5 Doc-vs-source drift inside Vaul (spec hygiene)

- [vaul.emilkowal.ski/api](https://vaul.emilkowal.ski/api) documents ~15 Root props; the source has ~28. Undocumented: `closeThreshold`, `scrollLockTimeout`, `noBodyStyles`, `shouldScaleBackground`, `setBackgroundColorOnScale`, `fixed`, `nested`, `onClose`, `onDrag`, `onRelease`, `disablePreventScroll`, `preventScrollRestoration`, `autoFocus`. The docs also type `activeSnapPoint` as `boolean` (source: `number | string | null`).
- In-source JSDoc contradictions: `disablePreventScroll` — JSDoc "@default false", code `= true` ([L112–L115 vs L162](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx#L112-L115)); `repositionInputs` — JSDoc "default true when snapPoints is defined", code unconditionally `= true`.
- Since the package is unmaintained (TL;DR), these will not be fixed. The `drawer={{}}` type must come from `vaul`'s shipped `.d.ts`; the pair's docs should not link Vaul's API page as authoritative.

### 5.6 Controlled snap points: different shape than base

Vaul: `activeSnapPoint` + `setActiveSnapPoint(snapPoint: number | string | null)` — a value+setter pair, no `default*` prop (uncontrolled default is `snapPoints[0]`). Base UI: `snapPoint` + `onSnapPointChange(snapPoint, eventDetails)` + `defaultSnapPoint`. Typed 1:1 per base this is fine, but examples, docs, and any shared TypeScript helper for "controlled snap point" **cannot be shared verbatim across bases** — prop names and callback arities differ. Same story as `onOpenChange` details: cross-base parity is conceptual, not literal.

---

## 6. Implications for responsivecn (radix base) — vs the base-side decisions

1. **The 1:1 desktop-props contract is safe on radix too** — shadcn radix wrappers type roots exactly as `ComponentProps<typeof Primitive.Root>`, and Vaul.Root ⊇ Radix Dialog.Root with identical shared types. Confirms base-side implication #1.
2. **`onOpenChange` typing: drop the union machinery on radix.** Plain `(open: boolean) => void` shared type; zero casts by construction. **Contradicts the letter of base-side implication #2** (per-pair `ChangeEventDetails` union) — and removes the information that union carried. Ticket #16 must decide whether the responsivecn public API documents `onOpenChange` per base (accurate, asymmetric) or as the `(open) => void` intersection (portable, lossy on base).
3. **Map at the shadcn wrapper level — even more profitable on radix**: DialogDrawer pairs 10↔10 with zero orphan parts, and four of the drawer-side parts are literally the same Radix components. Confirms base implication #3.
4. **Per-pair prop-drop lists change shape**: radix PopoverContent's drop list is the full Popper surface (11 positioning props) instead of base's 4 lifted ones; PopoverTrigger has nothing to drop (no hover props); `SheetContent.side → drawer.direction` becomes an **identity** lookup but keeps the Content→Root hoist and gains a defaults question (`right` vs `bottom`). Amends base implication #4.
5. **`modal` policy is more urgent on radix** — not just a default mismatch (Popover `false` / Vaul `true`) but a semantics fork: non-modal Vaul doesn't dismiss on outside press. Sharpens base implication #5.
6. **TooltipPopover survives, with weaker footing**: touch-disable is source-only, Radix names no alternative, and the mobile side cannot offer hover-open at all. The pair should be documented as responsivecn's own a11y prescription, citing Radix source and Base UI's guideline as corroboration. Amends base implication #6.
7. **SSR bias findings carry over unchanged** — same `use-mobile` (desktop-first) vs docs-demo `useMediaQuery` (mobile-first) disagreement exists in the radix tree. Confirms base implication #7.
8. **Registry dependencies (radix flavor)**: generated radix items need `registryDependencies: ["use-mobile"]` plus the underlying wrapper items; npm deps arrive via shadcn's radix style (`radix-ui`) and the drawer item (`vaul`). Note for #16: **pinning a pair to `vaul` inherits an unmaintained dependency** — the one radix-side risk with no base-side analog.
9. **Whitelist sanity check passes on radix**: all four pairs are constructible from what `bases/radix/ui` ships (`dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `popover.tsx`, `tooltip.tsx`), and the legacy `new-york-v4` tree is structurally identical for all five, so one generated source serves both trees' users.
10. **New radix-only decisions the base spec never had to make**: (a) `PopoverAnchor` orphan policy in PopoverDrawer; (b) Vaul `autoFocus` default (bake `true` vs document the override); (c) whether `drawer={{}}` preserves Vaul's `snapPoints`/`fadeFromIndex` union constraint (§2.3); (d) how to document "after animation" behavior with no desktop callback (§2.2.4).

---

## Confidence & gaps

High confidence — every prop/type/default quotes the pinned sources (`radix-ui/primitives@e4e0664`, `vaul@3e97aac` = npm 1.1.2, `shadcn-ui/ui@3cdaa6e`), cross-checked against the live docs pages. Remaining gaps:

1. **Radix docs vs npm-published types**: the monorepo tip (`e4e0664`) is ahead of the published `1.1.19`/`1.2.12` tarballs by whatever merged since their release; prop surfaces read here matched the docs and the published versions' majors, but re-verify `.d.ts` from the actual npm tarball before freezing generated templates.
2. **`radix-ui` monolith version skew**: shadcn pins `^1.4.3`, latest is `1.6.2`; both re-export the same primitives, and no prop-surface difference is expected within the 1.x line, but the exact bundled primitive versions per monolith release were not audited.
3. **Duplicate `@radix-ui/react-dialog` instances** (Vaul's own dep vs the monolith's) were analyzed for *typing* (structural, no casts) but not for *runtime* interplay (two `DismissableLayer` stacks coexisting when a Radix popover opens inside a Vaul drawer, or vice versa). Escape-key layering across the two copies is untested.
4. **Vaul touch/gesture edge cases** (`scrollLockTimeout`, iOS `touchend` handling, keyboard repositioning) were read but not behavior-tested; the doc reports the code's stated logic, not device verification.
5. The base-side doc's `styles/base-rhea` caveat applies analogously: the radix demo imports `@/styles/radix-nova/ui/*` style builds of the same `bases/radix/ui` sources; assumed structurally identical, not diffed.
