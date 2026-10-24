// Type-level tests for SheetDrawer, compiled (never run) against BOTH shadcn
// bases: in-repo against the site's Base UI wrappers (`pnpm typecheck`), and
// by scripts/verify-registry.sh inside a fresh Base UI and a fresh Radix
// project. Every case must typecheck on both, or fail on both where an
// expect-error directive says so. Not shipped: registry.json lists only the
// component.

import * as React from "react"

import { Button } from "@/components/ui/button"
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
      React.ComponentProps<typeof Sheet>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof SheetDrawerTrigger>,
      React.ComponentProps<typeof SheetTrigger>
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

// shadcn's Sheet docs make the Trigger and Close a Button: with
// render={<Button />} on Base UI, with asChild on Radix. The spread carries
// both spellings; each base type-checks the one it declares.
const asButton = { asChild: true, render: <Button variant="outline" /> }

export function ShadcnSheetDocsExample() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger {...asButton}>Open</SheetDrawerTrigger>
      <SheetDrawerContent className="w-[400px] sm:w-[540px]">
        <SheetDrawerHeader>
          <SheetDrawerTitle>Edit profile</SheetDrawerTitle>
          <SheetDrawerDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDrawerDescription>
        </SheetDrawerHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <label htmlFor="sheet-name">Name</label>
          <input id="sheet-name" defaultValue="Pedro Duarte" />
        </div>
        <SheetDrawerFooter>
          <Button type="submit">Save changes</Button>
          <SheetDrawerClose {...asButton}>Close</SheetDrawerClose>
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

      {/* @ts-expect-error open belongs to the root, not to one side */}
      <SheetDrawer drawer={{ open: true }}>
        <SheetDrawerContent>…</SheetDrawerContent>
      </SheetDrawer>

      {/* @ts-expect-error defaultOpen belongs to the root, not to one side */}
      <SheetDrawer drawer={{ defaultOpen: true }}>
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
