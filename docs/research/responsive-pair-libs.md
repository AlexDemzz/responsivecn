# Existing Responsive Dialog/Drawer Libraries — Subcomponent-Surface Design

Research date: **2026-07-12**. Primary sources only: each library's source on GitHub (fetched via `raw.githubusercontent.com` / the GitHub REST API), its README, its registry JSON, its issue tracker, and the shadcn design discussion. Blog posts and third-party summaries were used only to locate repos, never cited for facts.

Purpose: inform ticket #9 / "Q4" — **which subcomponents each responsivecn pair should export when a part exists on only ONE side of the pair**, and validate the prototype's prop model (`prototypes/dialog-drawer/src/components/ui/dialog-drawer.tsx`).

Commits / versions read:
- **Credenza** — `redpangilinan/credenza`, branch `main`, `commits/main` = [`843ebbd`](https://github.com/redpangilinan/credenza/commit/843ebbdd9165fae1f79ab53dc837d2a15b388c30) (commit date 2025-09-01; repo `pushed_at` 2025-11-15), 899★. Deployed registry `https://credenza.rdev.pro/r/credenza.json` re-verified to match `main`.
- **DropDrawer** — `jiaweing/DropDrawer`, branch `main`, `commits/main` = [`4a829b9`](https://github.com/jiaweing/DropDrawer/commit/4a829b95ed4e21b6545d87eca15ffcb9565bfa99) (`pushed_at` 2026-06-01), 204★.
- **pushmodal** — `lindesvard/pushmodal`, branch `main` (`pushed_at` 2025-05-20), 202★.
- **shadcn-ui/ui** — branch `main`, tip [`3cdaa6e`](https://github.com/shadcn-ui/ui/commit/3cdaa6eb2f0da27aca8598cb752c32d840e06940) (same commit as `base-ui-component-apis.md`).
- **Hervepoh/shadcn-modal-responsiv** — `main` (`pushed_at` 2024-07-05), 0★ — a Credenza clone (see §5).

---

## TL;DR — per-library orphan policy + surface model

| Library | Primitives (desktop → mobile) | Surface model | Orphan-part policy (part on one side only) |
|---|---|---|---|
| **Credenza** | shadcn Radix Dialog → shadcn Vaul Drawer | Compound parts, single shared `isMobile` context; each part swaps `DialogX`↔`DrawerX` | **Avoids the problem by construction** — only exports the intersection of shadcn's *symmetric* Dialog/Drawer wrappers. Its one non-primitive part, `CredenzaBody`, is an **invented plain `<div>` rendered identically on both breakpoints**, responsive purely via a Tailwind `md:` class. |
| **shadcn official example** | Radix/Base Dialog → Vaul/Base Drawer | **No unified surface** — two hand-written JSX trees chosen by `if (isDesktop)` | **Omit per branch**: `DrawerFooter`/`DrawerClose` appear only in the mobile tree; the desktop tree simply doesn't render them. Duplicated markup around one shared child. |
| **DropDrawer** | shadcn Radix DropdownMenu → shadcn Vaul Drawer | Compound parts, single shared `isMobile` context | **Full spectrum in one file**: *omit* (Checkbox/Radio/Shortcut never exported), *render-null* (`Separator`, `SubContent` on mobile), *plain-div functional fallback* (`Footer` on desktop — "No direct equivalent in DropdownMenu, so we'll just render a div"), *cross-part remap* (`Label` → `DrawerHeader`/`DrawerTitle` on mobile), *full reimplementation* (`Sub`/`SubTrigger`/`SubContent` → in-drawer page navigation). |
| **pushmodal** | Radix Dialog → Vaul Drawer (imperative) | **Swap the shell only** — `createResponsiveWrapper({mobile, desktop})` returns just `{Wrapper, Content}`; everything inside `Content` is user-authored and shared | **No orphan surface** — the library never owns Trigger/Footer/Title/Close, so there is nothing to reconcile. Per-side parts are the user's problem. |

Cross-cutting: **no existing library offers a namespaced per-side override prop** like responsivecn's `drawer={{}}`. All spread ONE shared props object + ONE shared `className` to whichever primitive is active, and hard-code the few unavoidable per-side quirks (e.g. Vaul's `autoFocus`). responsivecn's `drawer={{}}` is genuinely novel prior-art-wise (see §7.3).

---

## 1. Credenza (THE priority)

`redpangilinan/credenza`, one file: [`src/components/ui/credenza.tsx`](https://github.com/redpangilinan/credenza/blob/main/src/components/ui/credenza.tsx) @ `843ebbd`. Also read: [`README.md`](https://github.com/redpangilinan/credenza/blob/main/README.md), [`public/r/credenza.json`](https://github.com/redpangilinan/credenza/blob/main/public/r/credenza.json), and the issue tracker.

**Primitive mapping**: desktop = shadcn/ui `Dialog` (Radix `@radix-ui/react-dialog`), mobile = shadcn/ui `Drawer` (Vaul `emilkowalski/vaul`). README: "This component is built using shadcn/ui's dialog and drawer component, which is built on top of Vaul." Registry declares `"registryDependencies": ["dialog", "drawer", "use-mobile"]` ([credenza.json](https://credenza.rdev.pro/r/credenza.json)).

### 1.1 Full export surface (9 parts)

`Credenza`, `CredenzaTrigger`, `CredenzaClose`, `CredenzaContent`, `CredenzaDescription`, `CredenzaHeader`, `CredenzaTitle`, `CredenzaBody`, `CredenzaFooter` (verbatim from the `export { … }` block, credenza.tsx).

Maps 1:1 onto shadcn's Radix Dialog *and* Drawer wrappers, **which are symmetric** — both expose `Trigger`/`Close`/`Content`/`Description`/`Header`/`Title`/`Footer`. The only export with no primitive backing on either side is `CredenzaBody`.

### 1.2 Render mechanism — desktop vs mobile

Each part reads a single `isMobile` boolean from context and picks the primitive:

```tsx
const Credenza = ({ children, ...props }: RootCredenzaProps) => {
  const isMobile = useIsMobile()
  const Credenza = isMobile ? Drawer : Dialog
  return (
    <CredenzaContext.Provider value={{ isMobile }}>
      <Credenza {...props} {...(isMobile && { autoFocus: true })}>
        {children}
      </Credenza>
    </CredenzaContext.Provider>
  )
}

const CredenzaTitle = ({ className, children, ...props }: CredenzaProps) => {
  const { isMobile } = useCredenzaContext()
  const CredenzaTitle = isMobile ? DrawerTitle : DialogTitle
  return <CredenzaTitle className={className} {...props}>{children}</CredenzaTitle>
}
```

Mechanism = **JS conditional on the `isMobile` hook**, resolved to two component trees; the inactive primitive is not mounted. It is NOT CSS-only and NOT two simultaneous trees. Every child part reads the SAME `isMobile` from `CredenzaContext` — this is load-bearing (see §1.6, issue #12/#16).

### 1.3 Orphan-part handling — `CredenzaBody` (the one interesting case)

shadcn's Dialog and Drawer wrappers are symmetric, so Credenza has no true orphan among primitive parts. But it *adds* one part that neither primitive has — a content-padding wrapper — and implements it as a **plain `<div>` rendered identically on both breakpoints, differing only by a Tailwind class**:

```tsx
const CredenzaBody = ({ className, children, ...props }: CredenzaProps) => {
  return (
    <div className={cn("px-4 md:px-0", className)} {...props}>
      {children}
    </div>
  )
}
```

This is the single most transferable idea for responsivecn's Q4: rather than branch, `CredenzaBody` renders one element for both sizes and pushes the responsive difference into CSS (`px-4` on mobile, `md:px-0` on desktop). No `isMobile`, no context read.

### 1.4 Prop model

- **Root**: `RootCredenzaProps = { children, open?, onOpenChange?: (open: boolean) => void }`. `open`/`onOpenChange` are **shared** and spread via `{...props}` to whichever primitive is active — no per-side handling. `onOpenChange` is typed as the plain `(open: boolean) => void`, i.e. it does NOT expose or type any `eventDetails` (Radix/Vaul don't have Base UI's event-details object).
- **Every other part**: `CredenzaProps = { children, className?, asChild?: true }`. A **single shared `className`** goes to both sides; there is **no per-side override**, no `drawer={{}}`-style namespace. `asChild` is forwarded to Radix/Vaul.
- **Desktop-only props** (`showCloseButton`, Sheet's `side`, etc.): **not handled at all** — Credenza doesn't model them. The only per-side prop it injects is Vaul-specific `autoFocus: true`, hard-coded on the mobile branch (`{...(isMobile && { autoFocus: true })}`) to work around a Vaul a11y bug (§1.6, issue #15).

### 1.5 Breakpoint mechanism

**Current shipped code** (`main` + deployed registry, re-verified 2026-07-12): imports `useIsMobile` from `@/hooks/use-mobile` (shadcn's `use-mobile`, a `registryDependency`). README's copy shows `MOBILE_BREAKPOINT = 768`, `matchMedia("(max-width: 767px)")`, state starts `undefined`, returns `!!isMobile`. So during **SSR and first client render `isMobile === false` → renders `Dialog` (desktop) first**, flipping in an effect. Value: **768px**.

> **Doc-vs-source drift (worth flagging):** the live docs prose at `credenza.rdev.pro` and the body of issue [#15](https://github.com/redpangilinan/credenza/issues/15) still describe the *pre-registry* single-file version — `const isDesktop = useMediaQuery("(min-width: 768px)"); const Credenza = isDesktop ? Dialog : Drawer`. That older form is **mobile-first** on SSR (a `useMediaQuery` that defaults `false` → `isDesktop=false` → `Drawer`). The migration to `useIsMobile` **flipped the SSR bias from mobile-first to desktop-first.** The registry JSON (what users actually install) is authoritative and uses `useIsMobile`.

### 1.6 Notable issues (primary — validate/challenge responsivecn)

- **Single-context is the fix, not an optimization** — issue [#12 "`DialogTrigger` must be used within `Dialog`"](https://github.com/redpangilinan/credenza/issues/12) (closed) + PR [#16](https://github.com/redpangilinan/credenza/pull/16) "fixes … by using a React Context to pass the isDesktop boolean to the components". Before #16, each part evaluated the media query independently, so a child could resolve to a different primitive than its parent (`DialogTrigger` mounted inside a `Drawer`) → runtime crash. **This directly validates responsivecn's `DialogDrawerContext` with a single `isMobile`** — the prototype already does exactly this (`DialogDrawerContext.Provider value={{ isMobile }}`). Do not let any part read the breakpoint independently.
- **Vaul `aria-hidden` bug forces a mobile-only prop** — issue [#15](https://github.com/redpangilinan/credenza/issues/15) (open): Vaul's Drawer throws an `aria-hidden` focus error on open; the fix is `autoFocus: true` on the Drawer only. This is why even Credenza, which has *no* general per-side override mechanism, hard-codes one mobile-only prop. **responsivecn's `drawer={{}}` namespace generalizes exactly this need.**
- **Users want a Sheet variant** — issue [#21 "Using credenza with sheets as well"](https://github.com/redpangilinan/credenza/issues/21) (open): "I don't like creating complex forms with a dialog, so I do that with sheets on desktop." Credenza can't; **validates responsivecn's Sheet→Drawer pair as a real, unmet want.**
- Other open issues, less design-relevant: [#22](https://github.com/redpangilinan/credenza/issues/22) outside-click not closing on desktop; [#18](https://github.com/redpangilinan/credenza/issues/18) nested modals; [#10](https://github.com/redpangilinan/credenza/issues/10) mobile overflow; [#6](https://github.com/redpangilinan/credenza/issues/6) background-scaling color. No issue anywhere raises an orphan-part *design* debate — because Credenza sidestepped it (§1.1).

---

## 2. shadcn official responsive combo

Two example files exist at [`3cdaa6e`](https://github.com/shadcn-ui/ui/commit/3cdaa6eb2f0da27aca8598cb752c32d840e06940): the Radix-era [`apps/v4/examples/radix/drawer-dialog.tsx`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/examples/radix/drawer-dialog.tsx) and the Base-UI-era `apps/v4/examples/base/drawer-dialog.tsx` (the latter dissected in `base-ui-component-apis.md` §4). Both are **docs examples, not installable registry items** — there is no packaged responsive dialog in shadcn's registry.

### 2.1 Surface model = none (two hand-written trees)

The Radix-era demo is the clearest statement of the "just fork the markup" philosophy:

```tsx
export function DrawerDialogDemo() {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>…</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle/><DialogDescription/></DialogHeader>
          <ProfileForm />
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>…</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">…</DrawerHeader>
        <ProfileForm className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

### 2.2 Orphan handling = omit per branch

`DrawerFooter` and `DrawerClose` **exist only in the mobile branch**; the desktop `Dialog` tree simply omits them (a Vaul drawer needs an explicit Cancel affordance; the Radix dialog relies on its baked-in `×`). The only shared node is `<ProfileForm>`, and even *it* is size-tuned by prop (`className="px-4"` on mobile only — the same CSS-responsive trick as `CredenzaBody`, done at the call site). This is the boilerplate responsivecn's generated components collapse into a single compound component.

### 2.3 Prop model / breakpoint

Root `open` state is hoisted and `onOpenChange={setOpen}` is passed to **both** roots unchanged (works because Radix Dialog and Vaul Drawer share the `(open: boolean) => void` shape — the Base-era demo does the same with Base UI's richer callback). Breakpoint: app-level `useMediaQuery("(min-width: 768px)")` → `isDesktop`, **mobile-first SSR** (defaults `false`). Note this is the *opposite* SSR bias from shadcn's own `use-mobile` hook (`base-ui-component-apis.md` §5 documents both).

---

## 3. DropDrawer (the orphan-parts goldmine)

`jiaweing/DropDrawer`, [`components/ui/dropdrawer.tsx`](https://github.com/jiaweing/DropDrawer/blob/main/components/ui/dropdrawer.tsx) @ `4a829b9`; [`README.md`](https://github.com/jiaweing/DropDrawer/blob/main/README.md). **Pair: DropdownMenu → Drawer** (desktop = shadcn Radix `DropdownMenu`; mobile = shadcn Vaul `Drawer`). README: "A drop-in replacement for shadcn/ui's DropdownMenu component … automatically switching between a dropdown menu on desktop [and] a native-feeling drawer interface on mobile."

This is the most valuable non-Credenza case because DropdownMenu and Drawer are **profoundly asymmetric** — dropdown has submenus, separators, labels, checkbox/radio items, shortcuts; drawer has none of these but has footers and swipe. DropDrawer therefore has to *decide an orphan policy for almost every part*, and it uses a different one for each.

### 3.1 Full export surface (11 parts)

`DropDrawer`, `DropDrawerContent`, `DropDrawerFooter`, `DropDrawerGroup`, `DropDrawerItem`, `DropDrawerLabel`, `DropDrawerSeparator`, `DropDrawerSub`, `DropDrawerSubContent`, `DropDrawerSubTrigger`, `DropDrawerTrigger` (from the `export { … }` block).

### 3.2 Architecture

Same as Credenza-post-#16: single `DropDrawerContext = { isMobile }`, `useIsMobile()` (768px), root injects `autoFocus: true` on mobile (identical Vaul workaround). Adds a *second* internal context, `SubmenuContext`, to drive the mobile submenu navigation stack.

### 3.3 Orphan-part policies — every variant, with excerpts

**(a) Omit entirely** — DropDrawer imports only 9 of shadcn's ~15 DropdownMenu parts. `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuRadioGroup`, `DropdownMenuShortcut`, `DropdownMenuPortal`, and the real `DropdownMenuGroup` are **never imported and never exported** — silently dropped from the responsive surface (visible in the single `import { … } from "@/components/ui/dropdown-menu"` — it lists exactly `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger`).

**(b) Render-null on the side that lacks meaning** — `DropDrawerSeparator` renders nothing on mobile (the mobile `Group` draws its own dividers, §3.3e):

```tsx
function DropDrawerSeparator({ className, ...props }) {
  const { isMobile } = useDropDrawerContext();
  // For mobile, render a simple divider
  if (isMobile) {
    return null;
  }
  return <DropdownMenuSeparator data-slot="drop-drawer-separator" className={className} {...props} />;
}
```

Same policy for `DropDrawerSubContent` on mobile (`if (isMobile) { … return null; }` — its content is hoisted and re-rendered by `DropDrawerContent`'s navigation stack instead).

**(c) Plain-div functional fallback for a part the desktop side lacks** — DropdownMenu has no footer; DropDrawer renders one anyway, as a `<div>` on desktop, with an explicit comment:

```tsx
function DropDrawerFooter({ className, children, ...props }) {
  const { isMobile } = useDropDrawerContext();
  if (isMobile) {
    return <DrawerFooter data-slot="drop-drawer-footer" className={cn("p-4", className)} {...props}>{children}</DrawerFooter>;
  }
  // No direct equivalent in DropdownMenu, so we'll just render a div
  return <div data-slot="drop-drawer-footer" className={cn("p-2", className)} {...props}>{children}</div>;
}
```

**(d) Cross-part remap** — `DropDrawerLabel` is a `DropdownMenuLabel` on desktop but a `DrawerHeader` + `DrawerTitle` on mobile (a label is promoted to the drawer's accessible title):

```tsx
if (isMobile) {
  return (
    <DrawerHeader className="p-0">
      <DrawerTitle data-slot="drop-drawer-label" className={cn("text-muted-foreground px-4 py-2 …", className)} {...props}>
        {children}
      </DrawerTitle>
    </DrawerHeader>
  );
}
return <DropdownMenuLabel data-slot="drop-drawer-label" className={className} {...props}>{children}</DropdownMenuLabel>;
```

**(e) Invented shared part with divergent per-side rendering** — `DropDrawerGroup` uses neither primitive's group; it's a `<div role="group">` on both sides, but on mobile it gets card styling *and* injects `<div class="bg-border h-px">` separators between children (`childrenWithSeparators`). Cf. `CredenzaBody`, but here the two branches render materially different DOM.

**(f) Full functional reimplementation** — the desktop-only *submenu* concept is rebuilt from scratch on mobile. `DropDrawerSub`/`DropDrawerSubTrigger`/`DropDrawerSubContent` are real Radix parts on desktop; on mobile they become plain `<div>`s wired to `SubmenuContext` + `framer-motion` slide animations that turn the drawer into a multi-page stack (`navigateToSubmenu`, `goBack`, `submenuStack`, `extractSubmenuContent`). `DropDrawerItem` similarly wraps its children in `<DrawerClose asChild>` on mobile (tap-to-close) but a `DropdownMenuItem` on desktop, and adds an `icon` prop that exists on neither primitive.

### 3.4 Prop model

Each part types its props as the **union of both sides' component props**, e.g. `React.ComponentProps<typeof DrawerContent> | React.ComponentProps<typeof DropdownMenuContent>`, and spreads them to the active primitive. `className` is a single shared string merged with per-side base classes via `cn`. Desktop-only positioning (`align="end"`, `sideOffset={4}`) is **hard-coded inside the desktop branch** of `DropDrawerContent`, not exposed as a mapping. **No per-side override prop** (no `drawer={{}}`).

---

## 4. pushmodal (imperative contrast)

`lindesvard/pushmodal`, [`src/lib/responsive.tsx`](https://github.com/lindesvard/pushmodal/blob/main/src/lib/responsive.tsx), [`src/index.ts`](https://github.com/lindesvard/pushmodal/blob/main/src/index.ts). Different paradigm entirely: you *register* modal components once and open them imperatively (`pushModal("Name")`). Radix Dialog + Vaul Drawer + Radix Sheet under the hood (`src/components/{dialog,drawer,sheet}.tsx`).

### 4.1 Surface model = swap the shell only

Its responsive helper is a factory, not a compound-component set:

```tsx
export function createResponsiveWrapper({ mobile, desktop, breakpoint = 640 }: Options) {
  function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useLayoutEffect(() => {
      const checkDevice = (e) => setIsMobile(e.matches);
      const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
      checkDevice(mql);
      mql.addEventListener("change", checkDevice);
      return () => mql.removeEventListener("change", checkDevice);
    }, []);
    return isMobile;
  }
  function Wrapper(props) { const isMobile = useIsMobile(); return isMobile ? <mobile.Wrapper {...props}/> : <desktop.Wrapper {...props}/>; }
  function Content(props) { const isMobile = useIsMobile(); return isMobile ? <mobile.Content {...props}/> : <desktop.Content {...props}/>; }
  return { Wrapper, Content };
}
```

It returns **only `{ Wrapper, Content }`**. Trigger/Header/Title/Footer/Close are not the library's concern — everything inside `Content` is user-authored JSX, shared verbatim across breakpoints. **So there is no orphan-part surface: the problem is delegated to the user.**

### 4.2 Notable points

- **No shared context** — `Wrapper` and `Content` each call `useIsMobile()` independently. This is the very split Credenza had to fix in #16; pushmodal gets away with it because `Wrapper` and `Content` are composed together by the factory (not user-nested as sibling parts), but a breakpoint change mid-open can still momentarily disagree. **Counter-evidence for skipping the shared context; responsivecn is right to keep one.**
- **Breakpoint default 640px** (not 768), `matchMedia("(max-width: 640px)")`, `useLayoutEffect` (fewer flashes than `useEffect`), `useState(false)` → **desktop-first SSR**.
- **Prop types** are Radix `DialogProps` / `DialogContentProps` (minus `onAnimationEnd`) for both sides — one shared shape, no per-side typing.

---

## 5. Long-tail (brief)

- **Hervepoh/shadcn-modal-responsiv** (0★, 2024-07) — confirmed **Credenza clone**: has `src/components/ui/credenza.tsx`, same "Ready-made responsive modal component for shadcn/ui" description. From before Credenza's registry migration, so it embodies the historical `useMediaQuery`/`isDesktop` form (§1.5). No independent design choices; mentioned only as evidence the Credenza pattern is copied verbatim across the ecosystem.
- **Named-but-not-found** — `MurshidAzher/responsive-dialog` and `whatif-dev/ui-shadcn-modal` return 404 (deleted/renamed/private as of 2026-07-12). Skipped per the "no toys" instruction.
- **DropDrawer's sibling idea generalized** — DropDrawer proves the pattern isn't Dialog-specific: any "rich desktop primitive → drawer" pair meets the orphan problem, and the community answer is per-part policy, not a single rule.

---

## 6. shadcn community design debate — Discussion [#2669](https://github.com/shadcn-ui/ui/discussions/2669)

"Combined Drawer and Dialog - Standalone Component Proposal" (proposer *lukasjoho*). Primary because it's the closest thing to a maintainer-facing spec for exactly responsivecn's component.

- **Proposed API**: a compound `ResponsiveDialog.Provider` / `.Trigger` / `.Content` / `.Footer` that "automatically get[s] different Triggers, Footers, Content, etc. for mobile and for desktop." Breakpoint mechanism unspecified.
- **Orphan-part handling**: **not addressed** — snap points, drawer handle, and close-button differences never come up.
- **Maintainer response**: **shadcn does not reply**; no official combined component is proposed, and no rationale for preferring copy-paste is given in-thread. A community member (*sourcebert*) points to Credenza as "already an attempt to do this."
- **State loss / SSR / a11y across the breakpoint**: **not raised.**

Takeaway: the orphan-part policy is a **genuinely open, unspecified problem** — the official channel neither solved it nor shipped a component, and the most-cited solution (Credenza) only avoids it by construction. responsivecn is designing into a real gap.

---

## 7. Cross-cutting findings

### 7.1 Breakpoint mechanisms compared

| Library | Hook | Query | Value | SSR first render |
|---|---|---|---|---|
| Credenza (current) | `useIsMobile` (shadcn `use-mobile`) | `max-width: 767px` | 768 | **desktop** (`!!undefined`) |
| Credenza (historical / docs) | `useMediaQuery` | `min-width: 768px` → `isDesktop` | 768 | mobile |
| DropDrawer | `useIsMobile` | `max-width: 767px` | 768 | **desktop** |
| shadcn radix/base example | `useMediaQuery` | `min-width: 768px` → `isDesktop` | 768 | mobile |
| pushmodal | inline `useIsMobile` | `max-width: 640px` | **640** | **desktop** (`useState(false)`) |

All conditionally render one tree; **all therefore unmount the other on a breakpoint crossing → uncontrolled state is lost, and an open modal can glitch mid-resize.** No library solves this; #2669 doesn't even mention it. responsivecn inherits the same limitation (the prototype uses the same conditional render) — a known, shared trade-off, not a regression. Hoisting `open` (controlled) survives the crossing; internal focus/scroll/snap state does not.

### 7.2 Single shared context is validated

Credenza PR #16 and DropDrawer both centralize the breakpoint in ONE context consumed by every part; pushmodal's independent reads are the anti-pattern that motivated #16. responsivecn's `DialogDrawerContext { isMobile }` (prototype lines 31–43, 110–124) is the correct, precedented choice.

### 7.3 responsivecn's `drawer={{}}` per-side override has no prior art

Every library reviewed passes ONE shared props object + ONE shared `className` to both sides, and hard-codes the unavoidable per-side quirks inline (`autoFocus` on mobile in both Credenza and DropDrawer; `align`/`sideOffset` baked into DropDrawer's desktop branch; `side`/snap-points simply unsupported). **None expose a typed, namespaced escape hatch for mobile-only props.** responsivecn's `drawer={{ snapPoints, swipeDirection, modal, … }}` (and the mirrored `className` merge via `mergeClassNames`) is strictly more expressive than all prior art and directly answers the exact needs these libraries met with hacks. This is a differentiator, not a risk — but it is unproven in the wild, so lean on it for the *documented* per-side props (snap points, swipe direction, `modal`) rather than as an open-ended `{...spread}`.

### 7.4 The Vaul `autoFocus` tell

Both Credenza and DropDrawer independently inject `autoFocus: true` on the **mobile (Vaul)** side only. responsivecn is on Base UI Drawer, not Vaul, so this specific workaround shouldn't be needed — but it demonstrates that **a per-side prop override is not optional in practice**; primitives diverge on required props, and a pair component must be able to set one side's prop without the other's. `drawer={{}}` covers this.

---

## 8. Implications for responsivecn Q4

### 8.1 The four orphan policies, as observed

| Policy | Seen in | What it does | Cost |
|---|---|---|---|
| **Omit** (don't export) | DropDrawer (Checkbox/Radio/Shortcut); shadcn example (no desktop footer) | Part simply absent from the pair's surface | Smallest surface; user must reach for the raw primitive if they need it |
| **No-op / render-null** | DropDrawer `Separator`, `SubContent` on mobile | Export exists; returns `null` on the side lacking it | Stable JSX across breakpoints (no conditional in user code); silent no-op can surprise |
| **Plain-div functional fallback** | DropDrawer `Footer` on desktop; Credenza `CredenzaBody`; shadcn `ProfileForm className="px-4"` | Render a styled `<div>` (or hidden primitive part) on the side lacking a native part | Keeps layout parity; div carries no primitive a11y semantics |
| **Cross-part remap** | DropDrawer `Label` → `DrawerTitle` | Route to a *different* native part on one side | Best a11y fit; requires a semantic judgement per part |

Nobody uses "render the hidden Base UI part" specifically, but the plain-div fallback is its spiritual equivalent (and Base UI parts like `Popover.Close` *can* be rendered even where the desktop primitive has no such part — see the TooltipPopover note below).

### 8.2 Comparison table — library × orphan-part policy

| | Credenza | shadcn example | DropDrawer | pushmodal |
|---|---|---|---|---|
| Surface | intersection + 1 invented div | none (2 trees) | per-part, mixed | shell only |
| Part on one side → default | avoided (symmetric primitives) | omit-per-branch | **mix**: omit / null / div / remap | delegated to user |
| Invented shared part | `CredenzaBody` (CSS-responsive) | — | `Group` | — |
| Per-side prop override | none (hard-codes `autoFocus`) | none | none (hard-codes `autoFocus`, `align`) | none |
| Shared `className` | yes, one | at call site | yes, one + per-side base | pass-through |
| Breakpoint context | single (post-#16) | n/a (example) | single | none (independent reads) |

### 8.3 What each policy means for responsivecn's four pairs

- **DialogDrawer / SheetDrawer** — the *symmetric* pairs (Base UI Drawer ⊇ Dialog per `base-ui-component-apis.md`). Like Credenza, almost no orphan decisions: every shadcn Dialog/Sheet part has a Drawer counterpart. Genuine orphans are **mobile-only** (`DrawerSwipeHandle`, snap-point props) → these belong in `drawer={{}}`, not as separate exported parts. Desktop-only `showCloseButton` (a `DialogContent` prop) and Sheet's `side` are **props, not parts** — the prototype already handles `showCloseButton` by consuming it only on the desktop branch (dialog-drawer.tsx lines 157–181), which matches the observed "omit the prop on the side that lacks it" behavior. **Recommendation: intersection for parts; per-side props via `drawer={{}}` / branch-consumed desktop props. Strongly precedented.**

- **PopoverDrawer** — first real orphan case: shadcn's Popover exports **no `PopoverClose` and no `PopoverFooter`**, but Drawer has `DrawerClose`/`DrawerFooter`. Precedent says:
  - `Close`: Base UI *does* have `Popover.Close` even though shadcn's wrapper doesn't re-export it — so the **cross-part / functional-fallback** route is available (render Base UI `Popover.Close` on desktop, `DrawerClose` on mobile) rather than omit. DropDrawer's `Footer` shows the pattern.
  - `Footer`: no native Popover footer → **plain-div functional fallback** on desktop (exactly DropDrawer's `DropDrawerFooter`), or an invented CSS-responsive `Body`/`Footer` à la `CredenzaBody`.
  - Reconcile the `modal` default mismatch (Popover `false` vs Drawer `true`) explicitly, as `base-ui-component-apis.md` §5 already flags.

- **TooltipPopover** — the hard case, and the one with the least prior art: the **desktop side (Tooltip) physically has no `Title`/`Description`/`Close`/`Backdrop` parts** (`base-ui-component-apis.md` §1.4), while the mobile side (Popover) has all of them. This inverts DropDrawer's usual direction (there the *mobile* side was poorer). Options, mapped to observed policies:
  - **Omit** `Title`/`Description`/`Close` from the pair → smallest surface, but throws away the accessible structure Popover offers on touch, contradicting Base UI's own guidance that touch/SR users need the Popover semantics.
  - **Functional fallback / render-the-hidden-part**: on the desktop *tooltip* side, render a plain styled `<div>`/`<span>` (or nothing visible) in place of `Title`/`Description`, and drop `Close` (a tooltip is dismissed by pointer-leave, not a button) — the DropDrawer `Footer`-on-desktop precedent. This keeps one JSX shape while letting the mobile Popover be fully structured.
  - **Cross-context recommendation** (consistent with `base-ui-component-apis.md` §6): treat TooltipPopover as a *semantics* change, not a layout swap — "tooltip on pointer-fine desktop, accessible popover on touch." Export `Title`/`Description` (backed by real Popover parts on mobile; plain styled elements on desktop so the visible label survives), and **omit `Close`** on the tooltip side (no analog, and the tooltip never takes focus). This is the DropDrawer "mix" policy applied to the inverted-asymmetry pair.

### 8.4 One concrete recommendation

Adopt DropDrawer's **per-part policy, not a single global rule** — that is the only approach that has actually shipped against asymmetric pairs. Encode the choice explicitly in the generator per (pair, part): `intersection` where both sides have the part; `drawer={{}}`/branch-prop for per-side props; **plain-div (or hidden-native-part) functional fallback** for a part missing on one side where layout/semantics should survive (PopoverDrawer `Footer`, TooltipPopover `Title`/`Description`); **omit** only where the part is meaningless on the poorer side and has no accessible value (TooltipPopover `Close`). Keep the single `isMobile` context (validated by Credenza #16 vs pushmodal). Keep `drawer={{}}` — it is more expressive than any prior art and is the clean home for every per-side quirk the other libraries hard-code.

---

## Confidence & gaps

High confidence on all source facts — every code excerpt is verbatim from the fetched raw files at the pinned commits, and issue/discussion quotes are from the GitHub API / discussion page. Gaps:

1. **Credenza docs prose lags its source** (§1.5). Treated the registry JSON + `main` as authoritative; the `credenza.rdev.pro` marketing prose still describes the pre-registry `useMediaQuery`/`isDesktop` implementation.
2. **Discussion #2669** was read via a rendered fetch; author handles (*lukasjoho*, *sourcebert*) and the "no maintainer reply" finding are from that render — reasonably reliable but not the GitHub GraphQL API. The design conclusion (orphan handling unaddressed, nothing shipped) is robust regardless.
3. **pushmodal `factory.tsx`** (the imperative store) was not read in full — only `responsive.tsx` + `index.ts`, which are the parts relevant to the responsive swap. Its conclusion (shell-only, no orphan surface) stands on `responsive.tsx` returning just `{Wrapper, Content}`.
4. **DropDrawer's omitted DropdownMenu parts** were inferred from its single `import { … }` list (what it never imports it cannot export); not cross-checked against shadcn's current `dropdown-menu.tsx` export list, though that set is stable.
5. All pairs here are Radix/Vaul-based; **none exercise Base UI primitives or Base UI's event-details callback**. The *design* choices (orphan policy, single context, per-side override) transfer, but Base-UI-specific ergonomics (union `eventDetails` typing, `Viewport`/`Positioner` parts) are covered only in `base-ui-component-apis.md`, not validated against a shipping responsive library (none exists on Base UI yet).
