// Type-level tests for TooltipPopover, compiled (never run) against BOTH shadcn
// bases: in-repo against the site's Base UI wrappers (`pnpm typecheck`), and
// by scripts/verify-registry.sh inside a fresh Base UI and a fresh Radix
// project. Every case must typecheck on both, or fail on both where an
// expect-error directive says so. Not shipped: registry.json lists only the
// component.

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
} from "./tooltip-popover"

type SameProps<A, B> = [A, keyof A] extends [B, keyof B]
  ? [B, keyof B] extends [A, keyof A]
    ? true
    : false
  : false
type Expect<T extends true> = T
type DesktopProps<Part extends React.ElementType> = Omit<
  React.ComponentProps<Part>,
  "popover"
>

// The drop-in contract: every part takes exactly the installed desktop
// wrapper's props (render on Base UI, asChild on Radix), whatever the base.
export type DropIn = [
  Expect<
    SameProps<
      DesktopProps<typeof TooltipPopover>,
      Omit<
        React.ComponentProps<typeof Tooltip>,
        "handle" | "triggerId" | "defaultTriggerId"
      >
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof TooltipPopoverTrigger>,
      Omit<React.ComponentProps<typeof TooltipTrigger>, "handle" | "popover">
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof TooltipPopoverContent>,
      Omit<React.ComponentProps<typeof TooltipContent>, "popover">
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof TooltipPopoverTitle>,
      Omit<React.ComponentProps<"div">, "popover">
    >
  >,
  Expect<
    SameProps<
      DesktopProps<typeof TooltipPopoverDescription>,
      Omit<React.ComponentProps<"div">, "popover">
    >
  >,
]

export function BasicUsage() {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger aria-label="About response rate">
        i
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <TooltipPopoverTitle>Response rate</TooltipPopoverTitle>
        <TooltipPopoverDescription>
          The share of messages you reply to within 24 hours.
        </TooltipPopoverDescription>
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipPopover open={open} onOpenChange={setOpen}>
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent side="right" sideOffset={8}>
        …
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

export function MobileOverrides() {
  return (
    <TooltipPopover
      onOpenChange={(open) => console.log("shared", open)}
      popover={{
        modal: true,
        onOpenChange: (open) => console.log("popover", open),
      }}
    >
      <TooltipPopoverTrigger
        className="underline"
        popover={{ className: "p-2" }}
      >
        Info
      </TooltipPopoverTrigger>
      <TooltipPopoverContent popover={{ className: "w-64", side: "top" }}>
        <TooltipPopoverTitle popover={{ className: "text-base" }}>
          Title
        </TooltipPopoverTitle>
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error modal is a Popover prop: it lives in popover={{}} */}
      <TooltipPopover modal>
        <TooltipPopoverContent>…</TooltipPopoverContent>
      </TooltipPopover>

      <TooltipPopover>
        {/* @ts-expect-error the override is typed on the Popover, not free-form */}
        <TooltipPopoverContent popover={{ notAProp: true }}>
          …
        </TooltipPopoverContent>
      </TooltipPopover>
    </>
  )
}
