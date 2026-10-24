// Type-level tests for DialogDrawer, compiled (never run) against BOTH shadcn
// bases: in-repo against the site's Base UI wrappers (`pnpm typecheck`), and
// by scripts/verify-registry.sh inside a fresh Base UI and a fresh Radix
// project. Every case must typecheck on both, or fail on both where an
// expect-error directive says so. Not shipped: registry.json lists only the
// component.

import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

type SameProps<A, B> = [A, keyof A] extends [B, keyof B]
  ? [B, keyof B] extends [A, keyof A]
    ? true
    : false
  : false
type Expect<T extends true> = T
type DesktopProps<Part extends React.ElementType> = Omit<
  React.ComponentProps<Part>,
  "drawer"
>

// The drop-in contract: every part takes exactly the installed desktop
// wrapper's props (render on Base UI, asChild on Radix), whatever the base.
export type DropIn = [
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawer>,
      Omit<
        React.ComponentProps<typeof Dialog>,
        "handle" | "triggerId" | "defaultTriggerId"
      >
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerTrigger>,
      Omit<React.ComponentProps<typeof DialogTrigger>, "handle">
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerContent>,
      React.ComponentProps<typeof DialogContent>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerHeader>,
      React.ComponentProps<typeof DialogHeader>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerFooter>,
      React.ComponentProps<typeof DialogFooter>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerTitle>,
      React.ComponentProps<typeof DialogTitle>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerDescription>,
      React.ComponentProps<typeof DialogDescription>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof DialogDrawerClose>,
      React.ComponentProps<typeof DialogClose>
    >
  >,
]

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
        <form />
        <DialogDrawerFooter>
          <DialogDrawerClose>Cancel</DialogDrawerClose>
          <button type="submit">Save</button>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <DialogDrawer open={open} onOpenChange={setOpen}>
      <DialogDrawerTrigger>Open</DialogDrawerTrigger>
      <DialogDrawerContent>…</DialogDrawerContent>
    </DialogDrawer>
  )
}

export function MobileOverrides() {
  return (
    <DialogDrawer
      modal
      onOpenChange={(open) => console.log("shared", open)}
      drawer={{
        snapPoints: [0.5, 1],
        modal: false,
        onOpenChange: (open) => console.log("drawer", open),
      }}
    >
      <DialogDrawerTrigger className="w-full" drawer={{ className: "h-12" }}>
        Open
      </DialogDrawerTrigger>
      <DialogDrawerContent
        className="sm:max-w-lg"
        showCloseButton={false}
        drawer={{ className: "max-h-[80dvh]" }}
      >
        <DialogDrawerHeader drawer={{ className: "text-center" }}>
          <DialogDrawerTitle drawer={{ className: "text-lg" }}>
            Title
          </DialogDrawerTitle>
        </DialogDrawerHeader>
        <DialogDrawerFooter showCloseButton>
          <DialogDrawerClose drawer={{ className: "h-12" }}>
            Cancel
          </DialogDrawerClose>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error snapPoints is mobile-only: it lives in drawer={{}} */}
      <DialogDrawer snapPoints={[0.5, 1]}>
        <DialogDrawerContent>…</DialogDrawerContent>
      </DialogDrawer>

      <DialogDrawer>
        {/* @ts-expect-error showCloseButton is desktop-only, not a Drawer prop */}
        <DialogDrawerContent drawer={{ showCloseButton: false }}>
          …
        </DialogDrawerContent>
      </DialogDrawer>
    </>
  )
}
