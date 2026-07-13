// Typed usage cases for the radix DialogDrawer API — the type-level test suite.
// Every case below must typecheck (or fail where @ts-expect-error says so);
// `npx tsc --noEmit -p registry/radix/tsconfig.json` is the verdict. This file
// is compiled, never run, and is not shipped by the registry (registry.json
// lists only dialog-drawer.tsx).
//
// The parts keep the SAME names as the Base UI side (DialogDrawer, …) — only
// the registry item is suffixed (dialog-drawer-radix). Cross-base parity here
// is prop-NAME parity, not prop-TYPE parity: on radix onOpenChange is
// (open: boolean) => void with no ChangeEventDetails, and the drawer={{}}
// namespace is typed 1:1 on Vaul (not Base UI Drawer).

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
} from "./dialog-drawer"

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

// Case 2 — controlled with plain setState: onOpenChange={setOpen} works
// unchanged (both roots are (open: boolean) => void), exactly like shadcn's
// own radix responsive demo.
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <DialogDrawer open={open} onOpenChange={setOpen}>
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 3 — onOpenChange is (open: boolean) => void on radix: a single boolean,
// no eventDetails. Unlike the Base UI side there is no reason/cancel()/
// ChangeEventDetails (radix-vaul research §2.2).
export function OpenChangeNoDetails() {
  return (
    <DialogDrawer
      onOpenChange={(open) => {
        console.log("open changed", open)
      }}
    >
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 4 — drawer={{}} namespace typed 1:1 on Vaul.Root: mobile-only props
// (snapPoints, direction, dismissible, handleOnly, snapToSequentialPoint,
// autoFocus, the onDrag/onRelease/onClose/onAnimationEnd callbacks, the
// activeSnapPoint/setActiveSnapPoint controlled pair) plus overriding a shared
// prop (modal). All names come from vaul's .d.ts, not its docs.
export function MobileOverrides() {
  return (
    <DialogDrawer
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
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 5 — Vaul's `fadeFromIndex requires snapPoints` union constraint survives
// on the root drawer={{}} (preserved by distributing the children omit over
// Vaul's WithFadeFromProps | WithoutFadeFromProps — research §2.3). Legal here
// because snapPoints is present; the illegal shape is asserted in Case 7.
export function FadeFromWithSnapPoints() {
  return (
    <DialogDrawer drawer={{ snapPoints: [0.3, 0.6, 1], fadeFromIndex: 1 }}>
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 6 — per-part drawer={{}}: every part exposes the real Vaul-side API of
// its counterpart. className MERGES (cn(shared, drawer)) — the shared one still
// applies on mobile, the drawer one wins on conflicts. Content also forwards a
// real Vaul/Radix Content callback (onPointerDownOutside) through drawer={{}}.
export function PerPartOverrides() {
  return (
    <DialogDrawer>
      <DialogDrawerTrigger className="w-full" drawer={{ className: "h-12" }}>
        Open
      </DialogDrawerTrigger>
      <DialogDrawerContent
        className="sm:max-w-lg"
        showCloseButton={false}
        drawer={{
          className: "max-h-[80dvh]",
          onPointerDownOutside: (event) => event.preventDefault(),
        }}
      >
        <DialogDrawerHeader drawer={{ className: "text-center" }}>
          <DialogDrawerTitle drawer={{ className: "text-lg" }}>
            Title
          </DialogDrawerTitle>
        </DialogDrawerHeader>
        <DialogDrawerFooter showCloseButton drawer={{ className: "gap-3" }}>
          <DialogDrawerClose drawer={{ className: "h-12" }}>
            Cancel
          </DialogDrawerClose>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 7 — state callbacks COMPOSE at the root. A shared onOpenChange AND a
// drawer-side override both provided: both typecheck and BOTH run at runtime
// (shared first, then the override). Value props like `modal` still replace.
export function ComposedOpenChange() {
  return (
    <DialogDrawer
      onOpenChange={(open) => console.log("shared", open)}
      drawer={{ onOpenChange: (open) => console.log("override", open) }}
    >
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

// Case 8 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — snapPoints is mobile-only: must live in drawer={{}} */}
      <DialogDrawer snapPoints={[0.5, 1]}>
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      {/* @ts-expect-error — direction typo'd value rejected inside drawer */}
      <DialogDrawer drawer={{ direction: "diagonal" }}>
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      {/* @ts-expect-error — fadeFromIndex without snapPoints (Vaul union constraint) */}
      <DialogDrawer drawer={{ fadeFromIndex: 1 }}>
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      <DialogDrawer
        // @ts-expect-error — radix onOpenChange takes only (open: boolean): no eventDetails
        onOpenChange={(open: boolean, eventDetails: boolean) => {
          console.log(open, eventDetails)
        }}
      >
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      <DialogDrawer>
        {/* @ts-expect-error — showCloseButton is desktop-only, not a Vaul Content prop */}
        <DialogDrawerContent drawer={{ showCloseButton: false }}>
          …
        </DialogDrawerContent>
      </DialogDrawer>

      <DialogDrawer>
        <DialogDrawerContent
          // @ts-expect-error — radix className is a plain string, not (state) => string
          className={(state: { open: boolean }) =>
            state.open ? "h-dvh" : undefined
          }
        >
          …
        </DialogDrawerContent>
      </DialogDrawer>
    </>
  )
}
