// Typed usage cases for the PopoverDrawer API — the type-level test suite.
// Every case below must typecheck (or fail where @ts-expect-error says so);
// `npm run typecheck` is the verdict. This file is compiled, never run, and
// is not shipped by the registry (registry.json lists only popover-drawer.tsx).

import * as React from "react"

import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerFooter,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "./popover-drawer"

// Case 1 — basic uncontrolled, all seven parts, children written ONCE.
// Popover has no Close/Footer parts of its own; Footer is a functional
// desktop fallback (plain div) that maps to DrawerFooter on mobile.
export function BasicUsage() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>
        <PopoverDrawerHeader>
          <PopoverDrawerTitle>Dimensions</PopoverDrawerTitle>
          <PopoverDrawerDescription>
            Set the dimensions for the layer.
          </PopoverDrawerDescription>
        </PopoverDrawerHeader>
        <form>{/* shared children — no duplication */}</form>
        <PopoverDrawerFooter>
          <button type="submit">Save</button>
        </PopoverDrawerFooter>
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 2 — controlled with plain setState: TS allows callbacks that
// declare fewer params (shadcn's own responsive demo does this).
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverDrawer open={open} onOpenChange={setOpen}>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 3 — onOpenChange with eventDetails: the union survives, `reason`
// narrowing works, and BOTH sides' disjoint reasons are reachable
// (Popover-only "focus-out"/"trigger-hover", Drawer-only "swipe").
export function OpenChangeDetailsNarrowing() {
  return (
    <PopoverDrawer
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === "swipe") {
          // Drawer-only close reason — narrowed, no cast
          console.log("dismissed by swipe", open)
        }
        if (eventDetails.reason === "focus-out") {
          // Popover-only close reason — narrowed, no cast
          console.log("dismissed by focus-out", open)
        }
        if (eventDetails.reason === "trigger-hover") {
          // Popover-only reason (hover popover) — narrowed, no cast
          console.log("hover", open)
        }
        if (eventDetails.reason === "escape-key") {
          eventDetails.cancel()
        }
      }}
    >
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 4 — the modal divergence, surfaced not masked. `modal` on the root
// is a shared prop: an explicit value forwards to BOTH sides. Native
// defaults per side are respected when it is omitted (Popover false,
// Drawer true) — proven at runtime, documented in the component.
export function ExplicitModalForwarding() {
  return (
    <>
      {/* explicit modal → forwarded to both Popover and Drawer */}
      <PopoverDrawer modal>
        <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      {/* omitted on root, overridden on the mobile side only */}
      <PopoverDrawer drawer={{ modal: false }}>
        <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>
    </>
  )
}

// Case 5 — drawer={{}} root namespace: Drawer-only root props (snapPoints,
// swipeDirection, showSwipeHandle, snap callbacks) plus overriding a shared
// prop (modal). None of these exist on the desktop Popover side.
export function MobileOverrides() {
  return (
    <PopoverDrawer
      drawer={{
        snapPoints: [0.5, 1],
        defaultSnapPoint: 0.5,
        swipeDirection: "down",
        showSwipeHandle: true,
        modal: false,
        onSnapPointChange: (snapPoint) => console.log(snapPoint),
      }}
    >
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 6 — desktop-only positioning props on Content (side/align/offsets)
// are lifted from the Popover Positioner. They are meaningless on a drawer
// (edge-anchored, not anchor-positioned) and are dropped on mobile.
export function DesktopPositioning() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent
        side="top"
        align="start"
        sideOffset={8}
        alignOffset={4}
      >
        …
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 7 — Popover-only trigger props (openOnHover/delay/closeDelay) are
// accepted on the desktop Trigger (1:1 with the shadcn Popover) and dropped
// on mobile — a drawer has no hover-to-open semantics.
export function DesktopTriggerHover() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger openOnHover delay={200} closeDelay={100}>
        Hover me
      </PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 8 — per-part drawer={{}}: every part exposes the real Drawer-side
// API of its counterpart. className MERGES (cn(shared, drawer)) — the shared
// one still applies on mobile, the drawer one wins on conflicts. The Footer
// orphan carries its own drawer override onto DrawerFooter.
export function PerPartOverrides() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger
        className="w-full"
        drawer={{ className: "h-12", nativeButton: true }}
      >
        Open
      </PopoverDrawerTrigger>
      <PopoverDrawerContent
        className="w-80"
        side="bottom"
        drawer={{ className: "max-h-[80dvh]" }}
      >
        <PopoverDrawerHeader drawer={{ className: "text-center" }}>
          <PopoverDrawerTitle drawer={{ className: "text-lg" }}>
            Title
          </PopoverDrawerTitle>
          <PopoverDrawerDescription drawer={{ className: "text-xs" }}>
            Description
          </PopoverDrawerDescription>
        </PopoverDrawerHeader>
        <PopoverDrawerFooter drawer={{ className: "pt-2" }}>
          <button type="submit">Save</button>
        </PopoverDrawerFooter>
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 9 — shared className/style callbacks over the union state: common
// members (open) are direct; side-specific members (Drawer's `expanded`)
// need an `in` narrowing, no cast.
export function StateCallbacks() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent
        className={(state) =>
          state.open && "expanded" in state && state.expanded
            ? "h-dvh"
            : undefined
        }
        style={(state) => ({ opacity: state.open ? 1 : 0.99 })}
      >
        …
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 10 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — snapPoints is mobile-only: must live in drawer={{}} */}
      <PopoverDrawer snapPoints={[0.5, 1]}>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      {/* @ts-expect-error — swipeDirection typo'd value rejected inside drawer */}
      <PopoverDrawer drawer={{ swipeDirection: "diagonal" }}>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      <PopoverDrawer>
        {/* @ts-expect-error — side is a desktop positioning prop, not a Drawer prop */}
        <PopoverDrawerContent drawer={{ side: "top" }}>…</PopoverDrawerContent>
      </PopoverDrawer>

      <PopoverDrawer>
        {/* @ts-expect-error — openOnHover is Popover-trigger-only, not a Drawer prop */}
        <PopoverDrawerTrigger drawer={{ openOnHover: true }}>
          Open
        </PopoverDrawerTrigger>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>
    </>
  )
}
