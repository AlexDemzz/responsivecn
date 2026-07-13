// Typed usage cases for the SheetDrawer API — the type-level test suite.
// Every case below must typecheck (or fail where @ts-expect-error says so);
// `npm run typecheck` is the verdict. This file is compiled, never run, and
// is not shipped by the registry (registry.json lists only sheet-drawer.tsx).

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

// Case 2 — controlled with plain setState: TS allows callbacks that
// declare fewer params, exactly like shadcn's own responsive demo.
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <SheetDrawer open={open} onOpenChange={setOpen}>
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 3 — onOpenChange with eventDetails: the union survives, `reason`
// narrowing works, and Drawer-only reasons ("swipe") are reachable.
export function OpenChangeDetailsNarrowing() {
  return (
    <SheetDrawer
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === "swipe") {
          // Drawer-only close reason — narrowed, no cast
          console.log("dismissed by swipe", open)
        }
        if (eventDetails.reason === "escape-key") {
          eventDetails.cancel()
        }
      }}
    >
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 4 — drawer={{}} namespace on the root: Drawer-only root props
// (snapPoints, swipeDirection, showSwipeHandle) plus overriding a shared
// prop (modal). swipeDirection here wins over any side→swipeDirection lookup.
export function MobileOverrides() {
  return (
    <SheetDrawer
      modal
      drawer={{
        snapPoints: [0.5, 1],
        defaultSnapPoint: 0.5,
        swipeDirection: "down",
        showSwipeHandle: true,
        modal: false,
        onSnapPointChange: (snapPoint) => console.log(snapPoint),
      }}
    >
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 5 — per-part drawer={{}}: every part exposes the real Drawer-side
// API of its counterpart. className MERGES (cn(shared, drawer)) — the
// shared one still applies on mobile, the drawer one wins on conflicts.
export function PerPartOverrides() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger
        className="w-full"
        drawer={{ className: "h-12", nativeButton: true }}
      >
        Open
      </SheetDrawerTrigger>
      <SheetDrawerContent
        className="sm:max-w-md"
        showCloseButton={false}
        drawer={{ className: "max-h-[80dvh]" }}
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

// Case 6 — shared className/style callbacks over the union state: common
// members (open, transitionStatus) are direct; side-specific members
// (Drawer's `expanded`) need an `in` narrowing, no cast.
export function StateCallbacks() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent
        className={(state) =>
          state.open && "expanded" in state && state.expanded
            ? "h-dvh"
            : undefined
        }
        style={(state) => ({ opacity: state.transitionStatus ? 0.99 : 1 })}
      >
        …
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 7 — explicit `side` on the Content (a Sheet prop, drop-in with
// shadcn's SheetContent). All four values typecheck; each drives the fixed
// side→swipeDirection lookup on the mobile Drawer root when set explicitly.
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

// Case 8 — composed root callbacks: a shared onOpenChange (union details,
// reason narrowing) AND a mobile override in drawer={{}} both compile. Per the
// contract the shared handler runs first, then the drawer override on mobile.
export function ComposedRootCallbacks() {
  return (
    <SheetDrawer
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === "swipe") {
          console.log("shared open change", open)
        }
      }}
      onOpenChangeComplete={(open) => console.log("shared complete", open)}
      drawer={{
        onOpenChange: (open, eventDetails) => {
          // Drawer-side details on the mobile override — narrowed, no cast
          if (eventDetails.reason === "swipe") {
            console.log("drawer open change", open)
          }
        },
        onOpenChangeComplete: (open) => console.log("drawer complete", open),
      }}
    >
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent>…</SheetDrawerContent>
    </SheetDrawer>
  )
}

// Case 9 — things that must NOT typecheck.
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

      {/* @ts-expect-error — swipeDirection typo'd value rejected inside drawer */}
      <SheetDrawer drawer={{ swipeDirection: "diagonal" }}>
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error — showCloseButton is desktop-only, not a Drawer prop */}
        <SheetDrawerContent drawer={{ showCloseButton: false }}>
          …
        </SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error — side is desktop-only; it maps to swipeDirection, it does not forward into drawer={{}} */}
        <SheetDrawerContent drawer={{ side: "left" }}>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error — invalid side value */}
        <SheetDrawerContent side="center">…</SheetDrawerContent>
      </SheetDrawer>
    </>
  )
}
