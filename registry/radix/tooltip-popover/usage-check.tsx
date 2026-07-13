// Typed usage cases for the radix TooltipPopover API — the type-level test
// suite. Every case below must typecheck (or fail where @ts-expect-error says
// so); `npx tsc --noEmit -p registry/radix/tsconfig.json` is the verdict. This
// file is compiled, never run, and is not shipped by the registry (registry.json
// lists only tooltip-popover.tsx).
//
// The parts keep the SAME names as the Base UI side (TooltipPopover, …) — only
// the registry item is suffixed (tooltip-popover-radix). Cross-base parity here
// is prop-NAME parity, not prop-TYPE parity: on radix onOpenChange is
// (open: boolean) => void with no ChangeEventDetails, and the popover={{}}
// namespace is typed 1:1 on the Radix Popover (not Base UI Popover).

import * as React from "react"

import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
} from "./tooltip-popover"

// Case 1 — basic uncontrolled, all parts, children written ONCE. A hover
// tooltip at desktop; a press-to-open popover with Title/Description below
// 768px (hover doesn't exist on touch — the tooltip→popover swap).
export function BasicUsage() {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>What is this?</TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <TooltipPopoverTitle>Response rate</TooltipPopoverTitle>
        <TooltipPopoverDescription>
          The share of messages you reply to within 24h.
        </TooltipPopoverDescription>
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 2 — controlled with plain setState: onOpenChange={setOpen} works
// unchanged (both roots are (open: boolean) => void).
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipPopover open={open} onOpenChange={setOpen}>
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 3 — onOpenChange is (open: boolean) => void on radix: a single boolean,
// no eventDetails. No reason/cancel()/ChangeEventDetails (research §2.2).
export function OpenChangeNoDetails() {
  return (
    <TooltipPopover
      onOpenChange={(open) => {
        console.log("open changed", open)
      }}
    >
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 4 — popover={{}} root namespace typed 1:1 on Radix Popover.Root:
// Popover-only root props (modal — Radix Tooltip has none, Radix Popover
// defaults `false`) applied only below the breakpoint.
export function MobileRootOverrides() {
  return (
    <TooltipPopover
      popover={{
        modal: true,
      }}
    >
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 5 — per-part popover={{}}: every part exposes the real Popover-side API
// of its counterpart. The Content can override positioning; className MERGES
// (cn(shared, popover)) on mobile. Unlike the Base UI side there is no
// openOnHover on the Radix Popover trigger — the mobile side is click-only.
export function PerPartOverrides() {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger
        className="underline"
        popover={{ className: "font-medium" }}
      >
        Info
      </TooltipPopoverTrigger>
      <TooltipPopoverContent
        className="max-w-xs"
        side="top"
        popover={{ className: "w-72", side: "bottom", sideOffset: 8 }}
      >
        <TooltipPopoverTitle
          className="text-sm"
          popover={{ className: "text-base" }}
        >
          Response rate
        </TooltipPopoverTitle>
        <TooltipPopoverDescription popover={{ className: "leading-snug" }}>
          The share of messages you reply to within 24h.
        </TooltipPopoverDescription>
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 6 — Title/Description as plain styled elements on desktop (the Radix
// Tooltip primitive has no such parts) and real Popover parts on mobile. They
// accept standard element attributes and never render `null`. Note: on radix
// the mobile Popover Title/Description are themselves bare styled divs with no
// aria wiring, so the swap is structural, not an a11y upgrade (research §3.4).
export function FallbackParts() {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <TooltipPopoverTitle id="rate-title" aria-label="Response rate">
          Response rate
        </TooltipPopoverTitle>
        <TooltipPopoverDescription className="mt-1">
          The share of messages you reply to within 24h.
        </TooltipPopoverDescription>
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 7 — state callbacks COMPOSE at the root. A shared onOpenChange AND a
// popover-side override both provided: both typecheck and BOTH run at runtime
// (shared first, then the override). Value props like `modal` still replace.
export function ComposedOpenChange() {
  return (
    <TooltipPopover
      onOpenChange={(open) => console.log("shared", open)}
      popover={{ onOpenChange: (open) => console.log("override", open) }}
    >
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 8 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — modal is a Popover-only root prop; Radix Tooltip has none, so it must live in popover={{}} */}
      <TooltipPopover modal>
        <TooltipPopoverContent>…</TooltipPopoverContent>
      </TooltipPopover>

      {/* @ts-expect-error — delayDuration is a Tooltip-only root prop: not a prop of the mobile Radix Popover, so it is rejected inside popover={{}} */}
      <TooltipPopover popover={{ delayDuration: 100 }}>
        <TooltipPopoverContent>…</TooltipPopoverContent>
      </TooltipPopover>

      <TooltipPopover>
        {/* @ts-expect-error — side typo'd value rejected inside the Popover content override */}
        <TooltipPopoverContent popover={{ side: "diagonal" }}>
          …
        </TooltipPopoverContent>
      </TooltipPopover>

      <TooltipPopover
        // @ts-expect-error — radix onOpenChange takes only (open: boolean): no eventDetails
        onOpenChange={(open: boolean, eventDetails: boolean) => {
          console.log(open, eventDetails)
        }}
      >
        <TooltipPopoverContent>…</TooltipPopoverContent>
      </TooltipPopover>

      <TooltipPopover>
        <TooltipPopoverContent
          // @ts-expect-error — radix className is a plain string, not (state) => string
          className={(state: { open: boolean }) =>
            state.open ? "shadow-lg" : undefined
          }
        >
          …
        </TooltipPopoverContent>
      </TooltipPopover>
    </>
  )
}
