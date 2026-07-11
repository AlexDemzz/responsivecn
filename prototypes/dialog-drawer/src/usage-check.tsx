// PROTOTYPE — typed usage cases for the DialogDrawer API.
// Every case below must typecheck (or fail where @ts-expect-error says so).
// This file is the "test suite": `npm run typecheck` is the verdict.

import * as React from "react"

import {
  DialogDrawer,
  DialogDrawerClose,
  DialogDrawerContent,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
  DialogDrawerTrigger,
} from "@/components/ui/dialog-drawer"

// Case 1 — basic uncontrolled, all parts, children written ONCE
// (vs the copy-paste conditional recipe in the shadcn docs).
export function BasicUsage() {
  return (
    <DialogDrawer>
      <DialogDrawerTrigger>Edit profile</DialogDrawerTrigger>
      <DialogDrawerContent>
        <DialogDrawerHeader>
          <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
          <DialogDrawerDescription>
            Make changes to your profile here.
          </DialogDrawerDescription>
        </DialogDrawerHeader>
        <form>{/* shared children — no duplication */}</form>
        <DialogDrawerFooter>
          <DialogDrawerClose>Cancel</DialogDrawerClose>
          <button type="submit">Save</button>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 2 — controlled with plain setState: TS allows callbacks that
// declare fewer params, exactly like shadcn's own responsive demo.
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <DialogDrawer open={open} onOpenChange={setOpen}>
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 3 — onOpenChange with eventDetails: the union survives, `reason`
// narrowing works, and Drawer-only reasons ("swipe") are reachable.
export function OpenChangeDetailsNarrowing() {
  return (
    <DialogDrawer
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
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 4 — mobile={{}} namespace: Drawer-only root props (snapPoints,
// swipeDirection, showSwipeHandle) plus overriding a shared prop (modal).
export function MobileOverrides() {
  return (
    <DialogDrawer
      modal
      mobile={{
        snapPoints: [0.5, 1],
        defaultSnapPoint: 0.5,
        swipeDirection: "down",
        showSwipeHandle: true,
        modal: false,
        onSnapPointChange: (snapPoint) => console.log(snapPoint),
      }}
    >
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 5 — per-part mobile={{}}: every part exposes the real Drawer-side
// API of its counterpart. className MERGES (cn(shared, mobile)) — the
// shared one still applies on mobile, the mobile one wins on conflicts.
export function PerPartOverrides() {
  return (
    <DialogDrawer>
      <DialogDrawerTrigger
        className="w-full"
        mobile={{ className: "h-12", nativeButton: true }}
      >
        Open
      </DialogDrawerTrigger>
      <DialogDrawerContent
        className="sm:max-w-lg"
        showCloseButton={false}
        mobile={{ className: "max-h-[80dvh]" }}
      >
        <DialogDrawerHeader mobile={{ className: "text-center" }}>
          <DialogDrawerTitle mobile={{ className: "text-lg" }}>
            Title
          </DialogDrawerTitle>
        </DialogDrawerHeader>
        <DialogDrawerFooter showCloseButton>
          <DialogDrawerClose mobile={{ className: "h-12" }}>
            Cancel
          </DialogDrawerClose>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 6 — shared className/style callbacks over the union state: common
// members (open, transitionStatus) are direct; side-specific members
// (Drawer's `expanded`) need an `in` narrowing, no cast.
export function StateCallbacks() {
  return (
    <DialogDrawer>
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent
        className={(state) =>
          state.open && "expanded" in state && state.expanded
            ? "h-dvh"
            : undefined
        }
        style={(state) => ({ opacity: state.transitionStatus ? 0.99 : 1 })}
      >
        …
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 7 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — snapPoints is mobile-only: must live in mobile={{}} */}
      <DialogDrawer snapPoints={[0.5, 1]}>
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      {/* @ts-expect-error — swipeDirection typo'd value rejected inside mobile */}
      <DialogDrawer mobile={{ swipeDirection: "diagonal" }}>
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      <DialogDrawer>
        {/* @ts-expect-error — showCloseButton is desktop-only, not a Drawer prop */}
        <DialogDrawerContent mobile={{ showCloseButton: false }}>
          …
        </DialogDrawerContent>
      </DialogDrawer>
    </>
  )
}
