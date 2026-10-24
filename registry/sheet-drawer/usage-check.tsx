// Type-level tests for SheetDrawer, compiled (never run) against BOTH shadcn
// bases: in-repo against the site's Base UI wrappers (`pnpm typecheck`), and
// by scripts/verify-registry.sh inside a fresh Base UI and a fresh Radix
// project. Every case must typecheck on both, or fail on both where an
// expect-error directive says so. Not shipped: registry.json lists only the
// component.

import * as React from "react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
      DesktopProps<typeof SheetDrawer>,
      Omit<
        React.ComponentProps<typeof Sheet>,
        "handle" | "triggerId" | "defaultTriggerId"
      >
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerTrigger>,
      Omit<React.ComponentProps<typeof SheetTrigger>, "handle">
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerContent>,
      React.ComponentProps<typeof SheetContent>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerHeader>,
      React.ComponentProps<typeof SheetHeader>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerFooter>,
      React.ComponentProps<typeof SheetFooter>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerTitle>,
      React.ComponentProps<typeof SheetTitle>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerDescription>,
      React.ComponentProps<typeof SheetDescription>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerClose>,
      React.ComponentProps<typeof SheetClose>
    >
  >,
]

export function BasicUsage() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger>Open menu</SheetDrawerTrigger>
      <SheetDrawerContent>
        <SheetDrawerHeader>
          <SheetDrawerTitle>Workspace</SheetDrawerTitle>
          <SheetDrawerDescription>
            Switch between projects.
          </SheetDrawerDescription>
        </SheetDrawerHeader>
        <nav />
        <SheetDrawerFooter>
          <SheetDrawerClose>Close</SheetDrawerClose>
        </SheetDrawerFooter>
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <SheetDrawer open={open} onOpenChange={setOpen}>
      <SheetDrawerTrigger>Open</SheetDrawerTrigger>
      <SheetDrawerContent side="left">…</SheetDrawerContent>
    </SheetDrawer>
  )
}

export function MobileOverrides() {
  return (
    <SheetDrawer
      onOpenChange={(open) => console.log("shared", open)}
      drawer={{
        snapPoints: [0.5, 1],
        onOpenChange: (open) => console.log("drawer", open),
      }}
    >
      <SheetDrawerTrigger className="w-full" drawer={{ className: "h-12" }}>
        Open
      </SheetDrawerTrigger>
      <SheetDrawerContent
        side="right"
        showCloseButton={false}
        className="sm:max-w-md"
        drawer={{ className: "max-h-[80dvh]" }}
      >
        <SheetDrawerHeader drawer={{ className: "text-center" }}>
          <SheetDrawerTitle>Title</SheetDrawerTitle>
        </SheetDrawerHeader>
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error snapPoints is mobile-only: it lives in drawer={{}} */}
      <SheetDrawer snapPoints={[0.5, 1]}>
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error side is desktop-only, not a Drawer prop */}
        <SheetDrawerContent drawer={{ side: "left" }}>…</SheetDrawerContent>
      </SheetDrawer>

      <SheetDrawer>
        {/* @ts-expect-error a Sheet only opens from its four edges */}
        <SheetDrawerContent side="center">…</SheetDrawerContent>
      </SheetDrawer>
    </>
  )
}
