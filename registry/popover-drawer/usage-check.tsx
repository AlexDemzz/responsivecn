// Type-level tests for PopoverDrawer, compiled (never run) against BOTH shadcn
// bases: in-repo against the site's Base UI wrappers (`pnpm typecheck`), and
// by scripts/verify-registry.sh inside a fresh Base UI and a fresh Radix
// project. Every case must typecheck on both, or fail on both where an
// expect-error directive says so. Not shipped: registry.json lists only the
// component.

import * as React from "react"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerFooter,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "./popover-drawer"

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
      DesktopProps<typeof PopoverDrawer>,
      Omit<
        React.ComponentProps<typeof Popover>,
        "handle" | "triggerId" | "defaultTriggerId"
      >
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof PopoverDrawerTrigger>,
      Omit<React.ComponentProps<typeof PopoverTrigger>, "handle">
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof PopoverDrawerContent>,
      React.ComponentProps<typeof PopoverContent>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof PopoverDrawerHeader>,
      React.ComponentProps<typeof PopoverHeader>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof PopoverDrawerTitle>,
      React.ComponentProps<typeof PopoverTitle>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof PopoverDrawerDescription>,
      React.ComponentProps<typeof PopoverDescription>
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof PopoverDrawerFooter>,
      React.ComponentProps<"div">
    >
  >,
]

export function BasicUsage() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger>Filters</PopoverDrawerTrigger>
      <PopoverDrawerContent>
        <PopoverDrawerHeader>
          <PopoverDrawerTitle>Filters</PopoverDrawerTitle>
          <PopoverDrawerDescription>
            Narrow down the list.
          </PopoverDrawerDescription>
        </PopoverDrawerHeader>
        <PopoverDrawerFooter>
          <button type="button">Apply</button>
        </PopoverDrawerFooter>
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverDrawer open={open} onOpenChange={setOpen}>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent side="top" align="start" sideOffset={8}>
        …
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

export function MobileOverrides() {
  return (
    <PopoverDrawer
      modal={false}
      drawer={{
        snapPoints: [0.5, 1],
        modal: true,
        onOpenChange: (open) => console.log("drawer", open),
      }}
    >
      <PopoverDrawerTrigger drawer={{ className: "w-full" }}>
        Open
      </PopoverDrawerTrigger>
      <PopoverDrawerContent className="w-80" drawer={{ className: "p-4" }}>
        <PopoverDrawerFooter drawer={{ className: "pt-0" }} />
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error snapPoints is mobile-only: it lives in drawer={{}} */}
      <PopoverDrawer snapPoints={[0.5, 1]}>
        <PopoverDrawerContent>…</PopoverDrawerContent>
      </PopoverDrawer>

      <PopoverDrawer>
        {/* @ts-expect-error sideOffset is anchor positioning, not a Drawer prop */}
        <PopoverDrawerContent drawer={{ sideOffset: 4 }}>
          …
        </PopoverDrawerContent>
      </PopoverDrawer>
    </>
  )
}
