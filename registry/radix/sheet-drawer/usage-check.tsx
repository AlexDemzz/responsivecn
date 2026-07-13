// Typed usage cases for the radix SheetDrawer API — the type-level test suite.
// Every case below must typecheck (or fail where @ts-expect-error says so);
// `npx tsc --noEmit -p registry/radix/tsconfig.json` is the verdict. This file
// is compiled, never run, and is not shipped by the registry (registry.json
// lists only sheet-drawer.tsx).
//
// The parts keep the SAME names as the Base UI side (SheetDrawer, …) — only the
// registry item is suffixed (sheet-drawer-radix). Cross-base parity here is
// prop-NAME parity, not prop-TYPE parity: on radix onOpenChange is
// (open: boolean) => void with no ChangeEventDetails, and the drawer={{}}
// namespace is typed 1:1 on Vaul (not Base UI Drawer).

import * as React from "react"

import {
  SheetDrawer,
  SheetDrawerClose,
  SheetDrawerContent,
  SheetDrawerDescription,
  SheetDrawerFooter,
  SheetDrawerHeader,
  SheetDrawerTitle,
  SheetDrawerTrigger,
} from "./sheet-drawer"

// Case 1 — basic uncontrolled, all eight parts, children written ONCE
// (vs the copy-paste conditional recipe in the shadcn docs).
export function BasicUsage() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger>Open menu</SheetDrawerTrigger>
      <SheetDrawerContent>
        <SheetDrawerHeader>
          <SheetDrawerTitle>Edit profile</SheetDrawerTitle>
          <SheetDrawerDescription>
            Make changes to your profile here.
          </SheetDrawerDescription>
        </SheetDrawerHeader>
        <form>{/* shared children — no duplication */}</form>
        <SheetDrawerFooter>
          <SheetDrawerClose>Cancel</SheetDrawerClose>
          <button type="submit">Save</button>
        </SheetDrawerFooter>
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 2 — controlled with plain setState: onOpenChange={setOpen} works
// unchanged (both roots are (open: boolean) => void), exactly like shadcn's
// own radix responsive demo.
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <SheetDrawer open={open} onOpenChange={setOpen}>
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 3 — onOpenChange is (open: boolean) => void on radix: a single boolean,
// no eventDetails. Unlike the Base UI side there is no reason/cancel()/
// ChangeEventDetails (radix-vaul research §2.2).
export function OpenChangeNoDetails() {
  return (
    <SheetDrawer
      onOpenChange={(open) => {
        console.log("open changed", open)
      }}
    >
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 4 — drawer={{}} namespace typed 1:1 on Vaul.Root: mobile-only props
// (snapPoints, direction, dismissible, handleOnly, snapToSequentialPoint,
// autoFocus, the onDrag/onRelease/onClose/onAnimationEnd callbacks, the
// activeSnapPoint/setActiveSnapPoint controlled pair) plus overriding a shared
// prop (modal). `direction` here wins over any side→direction lookup. All names
// come from vaul's .d.ts, not its docs.
export function MobileOverrides() {
  return (
    <SheetDrawer
      modal
      drawer={{
        snapPoints: [0.5, 1],
        activeSnapPoint: 0.5,
        setActiveSnapPoint: (snapPoint) => console.log(snapPoint),
        direction: "bottom",
        dismissible: false,
        handleOnly: true,
        snapToSequentialPoint: true,
        autoFocus: true,
        modal: false,
        onDrag: (_event, percentageDragged) => console.log(percentageDragged),
        onRelease: (_event, open) => console.log(open),
        onClose: () => console.log("closed"),
        onAnimationEnd: (open) => console.log(open),
      }}
    >
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 5 — Vaul's `fadeFromIndex requires snapPoints` union constraint survives
// on the root drawer={{}} (preserved by distributing the children omit over
// Vaul's WithFadeFromProps | WithoutFadeFromProps — research §2.3). Legal here
// because snapPoints is present; the illegal shape is asserted in Case 8.
export function FadeFromWithSnapPoints() {
  return (
    <SheetDrawer drawer={{ snapPoints: [0.3, 0.6, 1], fadeFromIndex: 1 }}>
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 6 — explicit `side` on the Content (a Sheet prop, drop-in with shadcn's
// SheetContent). All four values typecheck; each drives the fixed identity
// side→direction lookup on the mobile Vaul Drawer root when set explicitly
// (top→top, right→right, bottom→bottom, left→left).
export function ExplicitSide() {
  return (
    <>
      <SheetDrawer>
        <SheetDrawerContent side="left">Left</SheetDrawerContent>
      </SheetDrawer>
      <SheetDrawer>
        <SheetDrawerContent side="right">Right</SheetDrawerContent>
      </SheetDrawer>
      <SheetDrawer>
        <SheetDrawerContent side="top">Top</SheetDrawerContent>
      </SheetDrawer>
      <SheetDrawer>
        <SheetDrawerContent side="bottom">Bottom</SheetDrawerContent>
      </SheetDrawer>
    </>
  )
}

// Case 7 — per-part drawer={{}}: every part exposes the real Vaul-side API of
// its counterpart. className MERGES (cn(shared, drawer)) — the shared one still
// applies on mobile, the drawer one wins on conflicts. Content also forwards a
// real Vaul/Radix Content callback (onPointerDownOutside) through drawer={{}}.
export function PerPartOverrides() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger className="w-full" drawer={{ className: "h-12" }}>
        Open
      </SheetDrawerTrigger>
      <SheetDrawerContent
        className="sm:max-w-md"
        side="left"
        showCloseButton={false}
        drawer={{
          className: "max-h-[80dvh]",
          onPointerDownOutside: (event) => event.preventDefault(),
        }}
      >
        <SheetDrawerHeader drawer={{ className: "text-center" }}>
          <SheetDrawerTitle drawer={{ className: "text-lg" }}>
            Title
          </SheetDrawerTitle>
          <SheetDrawerDescription drawer={{ className: "text-xs" }}>
            Description
          </SheetDrawerDescription>
        </SheetDrawerHeader>
        <SheetDrawerFooter drawer={{ className: "flex-row" }}>
          <SheetDrawerClose drawer={{ className: "h-12" }}>
            Cancel
          </SheetDrawerClose>
        </SheetDrawerFooter>
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 8 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — side is a Content prop, not a root prop */}
      <SheetDrawer side="left">
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      {/* @ts-expect-error — snapPoints is mobile-only: must live in drawer={{}} */}
      <SheetDrawer snapPoints={[0.5, 1]}>
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      {/* @ts-expect-error — direction typo'd value rejected inside drawer */}
      <SheetDrawer drawer={{ direction: "diagonal" }}>
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      {/* @ts-expect-error — fadeFromIndex without snapPoints (Vaul union constraint) */}
      <SheetDrawer drawer={{ fadeFromIndex: 1 }}>
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer
        // @ts-expect-error — radix onOpenChange takes only (open: boolean): no eventDetails
        onOpenChange={(open: boolean, eventDetails: boolean) => {
          console.log(open, eventDetails)
        }}
      >
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error — showCloseButton is desktop-only, not a Vaul Content prop */}
        <SheetDrawerContent drawer={{ showCloseButton: false }}>
          …
        </SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error — side is desktop-only; it maps to direction, it does not forward into drawer={{}} */}
        <SheetDrawerContent drawer={{ side: "left" }}>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error — invalid side value */}
        <SheetDrawerContent side="center">…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        <SheetDrawerContent
          // @ts-expect-error — radix className is a plain string, not (state) => string
          className={(state: { open: boolean }) =>
            state.open ? "h-dvh" : undefined
          }
        >
          …
        </SheetDrawerContent>
      </SheetDrawer>
    </>
  )
}
