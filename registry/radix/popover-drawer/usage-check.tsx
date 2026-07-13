// Typed usage cases for the radix PopoverDrawer API — the type-level test suite.
// Every case below must typecheck (or fail where @ts-expect-error says so);
// `npx tsc --noEmit -p registry/radix/tsconfig.json` is the verdict. This file
// is compiled, never run, and is not shipped by the registry (registry.json
// lists only popover-drawer.tsx).
//
// The parts keep the SAME names as the Base UI side (PopoverDrawer, …) — only
// the registry item is suffixed (popover-drawer-radix). Cross-base parity here
// is prop-NAME parity, not prop-TYPE parity: on radix onOpenChange is
// (open: boolean) => void with no ChangeEventDetails, and the drawer={{}}
// namespace is typed 1:1 on Vaul (not Base UI Drawer).

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

// Case 1 — basic uncontrolled, all seven parts, children written ONCE. Radix
// Popover has no Close/Footer parts of its own; Footer is a functional desktop
// fallback (plain div) that maps to DrawerFooter on mobile.
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

// Case 2 — controlled with plain setState: onOpenChange={setOpen} works
// unchanged (both roots are (open: boolean) => void).
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverDrawer open={open} onOpenChange={setOpen}>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 3 — onOpenChange is (open: boolean) => void on radix: a single boolean,
// no eventDetails. No reason/cancel()/ChangeEventDetails (research §2.2).
export function OpenChangeNoDetails() {
  return (
    <PopoverDrawer
      onOpenChange={(open) => {
        console.log("open changed", open)
      }}
    >
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 4 — the modal divergence, surfaced not masked. `modal` on the root is a
// shared prop: an explicit value forwards to BOTH sides. Native defaults per
// side are respected when it is omitted (Radix Popover false, Vaul Drawer true)
// — and non-modal semantics differ in kind (research §5.1), documented in the
// component.
export function ExplicitModalForwarding() {
  return (
    <>
      {/* explicit modal → forwarded to both Popover and Drawer */}
      <PopoverDrawer modal>
        <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      {/* omitted on root, overridden on the mobile Vaul side only */}
      <PopoverDrawer drawer={{ modal: false }}>
        <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>
    </>
  )
}

// Case 5 — drawer={{}} root namespace typed 1:1 on Vaul.Root: mobile-only props
// (snapPoints, direction, dismissible, autoFocus, the onDrag/onRelease/onClose
// callbacks, the activeSnapPoint/setActiveSnapPoint controlled pair) plus
// overriding a shared prop (modal). None of these exist on the desktop Popover.
export function MobileOverrides() {
  return (
    <PopoverDrawer
      drawer={{
        snapPoints: [0.5, 1],
        activeSnapPoint: 0.5,
        setActiveSnapPoint: (snapPoint) => console.log(snapPoint),
        direction: "bottom",
        dismissible: false,
        autoFocus: true,
        modal: false,
        onDrag: (_event, percentageDragged) => console.log(percentageDragged),
        onRelease: (_event, open) => console.log(open),
        onClose: () => console.log("closed"),
      }}
    >
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 6 — the full Radix Popper positioning surface on Content is desktop-only
// (side/align/offsets + the collision/sticky props). Radix exposes all of it
// directly on PopoverContent (no Positioner part), a larger drop list than the
// Base UI side. All meaningless on an edge-anchored drawer → dropped on mobile.
export function DesktopPositioning() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent
        side="top"
        align="start"
        sideOffset={8}
        alignOffset={4}
        avoidCollisions
        collisionPadding={8}
        sticky="always"
      >
        …
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 7 — Vaul's `fadeFromIndex requires snapPoints` union constraint survives
// on the root drawer={{}} (research §2.3). Legal here because snapPoints is
// present; the illegal shape is asserted in Case 9.
export function FadeFromWithSnapPoints() {
  return (
    <PopoverDrawer drawer={{ snapPoints: [0.3, 0.6, 1], fadeFromIndex: 1 }}>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent>…</PopoverDrawerContent>
    </PopoverDrawer>
  )
}

// Case 8 — per-part drawer={{}}: every part exposes the real Vaul-side API of
// its counterpart. className MERGES (cn(shared, drawer)) — the shared one still
// applies on mobile, the drawer one wins on conflicts. The Footer orphan carries
// its own drawer override onto DrawerFooter; Content forwards a real Vaul/Radix
// Content callback (onPointerDownOutside).
export function PerPartOverrides() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger className="w-full" drawer={{ className: "h-12" }}>
        Open
      </PopoverDrawerTrigger>
      <PopoverDrawerContent
        className="w-80"
        side="bottom"
        drawer={{
          className: "max-h-[80dvh]",
          onPointerDownOutside: (event) => event.preventDefault(),
        }}
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

// Case 9 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — snapPoints is mobile-only: must live in drawer={{}} */}
      <PopoverDrawer snapPoints={[0.5, 1]}>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      {/* @ts-expect-error — direction typo'd value rejected inside drawer */}
      <PopoverDrawer drawer={{ direction: "diagonal" }}>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      {/* @ts-expect-error — fadeFromIndex without snapPoints (Vaul union constraint) */}
      <PopoverDrawer drawer={{ fadeFromIndex: 1 }}>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      <PopoverDrawer
        // @ts-expect-error — radix onOpenChange takes only (open: boolean): no eventDetails
        onOpenChange={(open: boolean, eventDetails: boolean) => {
          console.log(open, eventDetails)
        }}
      >
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      <PopoverDrawer>
        {/* @ts-expect-error — side is a desktop positioning prop, not a Vaul Content prop */}
        <PopoverDrawerContent drawer={{ side: "top" }}>…</PopoverDrawerContent>
      </PopoverDrawer>

      <PopoverDrawer>
        <PopoverDrawerContent
          // @ts-expect-error — radix className is a plain string, not (state) => string
          className={(state: { open: boolean }) =>
            state.open ? "h-dvh" : undefined
          }
        >
          …
        </PopoverDrawerContent>
      </PopoverDrawer>
    </>
  )
}
