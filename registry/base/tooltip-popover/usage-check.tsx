// Typed usage cases for the TooltipPopover API — the type-level test suite.
// Every case below must typecheck (or fail where @ts-expect-error says so);
// `npm run typecheck` is the verdict. This file is compiled, never run, and
// is not shipped by the registry (registry.json lists only tooltip-popover.tsx).

import * as React from "react"

import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
} from "./tooltip-popover"

// Case 1 — basic uncontrolled, all parts, children written ONCE. A hover
// tooltip at desktop; a press-to-open popover with real Title/Description
// below 768px (hover doesn't exist on touch — the Base UI infotip swap).
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

// Case 2 — controlled with plain setState: TS allows callbacks that declare
// fewer params, so a bare setter is assignable to the union onOpenChange.
export function ControlledWithSetState() {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipPopover open={open} onOpenChange={setOpen}>
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 3 — onOpenChange with eventDetails: the union survives, `reason`
// narrowing works, and reasons unique to each side are reachable without a
// cast — Popover-only (`focus-out`) and Tooltip-only (`trigger-hover`).
export function OpenChangeDetailsNarrowing() {
  return (
    <TooltipPopover
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === "trigger-hover") {
          // Tooltip-only open reason (desktop) — narrowed, no cast
          console.log("shown on hover", open)
        }
        if (eventDetails.reason === "focus-out") {
          // Popover-only close reason (mobile) — narrowed, no cast
          console.log("dismissed by focus-out", open)
        }
        if (eventDetails.reason === "escape-key") {
          eventDetails.cancel()
        }
      }}
    >
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 4 — popover={{}} root namespace: Popover-only root props (modal —
// Tooltip has no modal, Popover defaults `false`) applied only below the
// breakpoint. onOpenChangeComplete is shared and stays at the root.
export function MobileRootOverrides() {
  return (
    <TooltipPopover
      onOpenChangeComplete={(open) => console.log(open)}
      popover={{
        modal: true,
      }}
    >
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 5 — per-part popover={{}}: every part exposes the real Popover-side
// API of its counterpart. The Trigger can opt into Base UI's infotip
// recommendation (openOnHover on the mobile Popover); Content can override
// positioning; className MERGES (cn(shared, popover)) on mobile.
export function PerPartOverrides() {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger
        className="underline"
        popover={{ openOnHover: true, delay: 200, nativeButton: true }}
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

// Case 6 — shared className/style callbacks over the union Popup state:
// common members (open, transitionStatus) are direct; a side-specific member
// needs an `in` narrowing, no cast. Contravariance makes the union-state
// callback assignable to both the Tooltip and the Popover popup.
export function StateCallbacks() {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent
        className={(state) => (state.open ? "shadow-lg" : undefined)}
        style={(state) => ({ opacity: state.transitionStatus ? 0.99 : 1 })}
      >
        …
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 7 — Title/Description as plain styled elements on desktop (the
// Tooltip primitive has no such parts) and real Popover parts on mobile.
// They accept standard element attributes and never render `null`.
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

// Case 8 — composed root callbacks: a shared onOpenChange (union details,
// reason narrowing) AND a mobile override in popover={{}} both compile. Per the
// contract the shared handler runs first, then the popover override on mobile.
export function ComposedRootCallbacks() {
  return (
    <TooltipPopover
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === "trigger-hover") {
          console.log("shared open change", open)
        }
      }}
      onOpenChangeComplete={(open) => console.log("shared complete", open)}
      popover={{
        onOpenChange: (open, eventDetails) => {
          // Popover-side details on the mobile override — narrowed, no cast
          if (eventDetails.reason === "focus-out") {
            console.log("popover open change", open)
          }
        },
        onOpenChangeComplete: (open) => console.log("popover complete", open),
      }}
    >
      <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
      <TooltipPopoverContent>…</TooltipPopoverContent>
    </TooltipPopover>
  )
}

// Case 9 — things that must NOT typecheck.
export function InvalidUsages() {
  return (
    <>
      {/* @ts-expect-error — modal is a Popover-only root prop; Tooltip has none, so it must live in popover={{}} */}
      <TooltipPopover modal>
        <TooltipPopoverContent>…</TooltipPopoverContent>
      </TooltipPopover>

      {/* @ts-expect-error — trackCursorAxis is Tooltip-only: not a prop of the mobile Popover, so it is rejected inside popover={{}} */}
      <TooltipPopover popover={{ trackCursorAxis: "x" }}>
        <TooltipPopoverContent>…</TooltipPopoverContent>
      </TooltipPopover>

      <TooltipPopover>
        {/* @ts-expect-error — side typo'd value rejected inside the Popover content override */}
        <TooltipPopoverContent popover={{ side: "diagonal" }}>
          …
        </TooltipPopoverContent>
      </TooltipPopover>
    </>
  )
}
