"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// TooltipProvider stays an app-level convention (shadcn): keep your
// <TooltipProvider> from "@/components/ui/tooltip" at the root of your app to
// get delay=0 grouping on desktop. It is optional for correctness — the
// Tooltip primitive works without it (Base UI's 600ms trigger delay applies)
// — and renders no DOM, so it is harmless around the mobile Popover branch.

const TooltipPopoverContext = React.createContext<{ isMobile: boolean } | null>(
  null
)

function useTooltipPopover() {
  const context = React.useContext(TooltipPopoverContext)

  if (!context) {
    throw new Error("TooltipPopover parts must be used within a TooltipPopover.")
  }

  return context
}

// Below the breakpoint the shared className still applies; the popover-side
// one is merged on top via cn. Callbacks compose: both are resolved against
// the Popover-side state, then merged.
function mergeClassNames<State>(
  shared: string | ((state: State) => string | undefined) | undefined,
  override: string | ((state: State) => string | undefined) | undefined
): string | ((state: State) => string | undefined) | undefined {
  if (shared == null) return override
  if (override == null) return shared
  if (typeof shared === "string" && typeof override === "string") {
    return cn(shared, override)
  }
  return (state: State) =>
    cn(
      typeof shared === "function" ? shared(state) : shared,
      typeof override === "function" ? override(state) : override
    )
}

// Union of both primitives' event details: assignable to both roots via
// function-parameter contravariance, and `reason` narrowing still works
// (e.g. reason === "trigger-hover" only exists on the Tooltip side,
// "focus-out" only on the Popover side).
type TooltipPopoverOpenChangeDetails =
  | TooltipPrimitive.Root.ChangeEventDetails
  | PopoverPrimitive.Root.ChangeEventDetails

// Widens the state-parameterized props (className, style, render) to a
// union State — same contravariance trick as onOpenChange, so one value
// is assignable to both the Tooltip and the Popover side of a part.
type SharedPartProps<Props, State> = Omit<
  Props,
  "className" | "style" | "render"
> & {
  className?: string | ((state: State) => string | undefined)
  style?:
    | React.CSSProperties
    | ((state: State) => React.CSSProperties | undefined)
  render?: React.ReactElement | ComponentRenderFn<HTMLProps, State>
}

// Popover-side root overrides, applied only below the breakpoint. Matches
// the Popover wrapper API 1:1: Popover-only props (modal — Tooltip has none)
// plus overrides of the shared open/state props.
type TooltipPopoverPopoverProps = Omit<
  React.ComponentProps<typeof Popover>,
  "children"
>

// Desktop (Tooltip) root props 1:1, plus the `popover` namespace — named
// after the mobile side of the pair. `handle`/`triggerId` are unsupported:
// Tooltip.Handle and Popover.Handle are distinct classes — a desktop handle
// cannot drive the mobile primitive.
type TooltipPopoverProps = Omit<
  React.ComponentProps<typeof Tooltip>,
  "onOpenChange" | "handle" | "triggerId" | "defaultTriggerId"
> & {
  onOpenChange?: (
    open: boolean,
    eventDetails: TooltipPopoverOpenChangeDetails
  ) => void
  popover?: TooltipPopoverPopoverProps
}

function TooltipPopover({ popover, children, ...props }: TooltipPopoverProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <TooltipPopoverContext.Provider value={contextValue}>
      {isMobile ? (
        <Popover {...props} {...popover}>
          {children}
        </Popover>
      ) : (
        <Tooltip {...props}>{children}</Tooltip>
      )}
    </TooltipPopoverContext.Provider>
  )
}

// `popover` is also a native HTML global attribute (the Popover API:
// `popover="auto" | "manual" | "hint"`), present on every element's props.
// Our override namespace claims that name, so drop the native attribute from
// the desktop props before adding it — otherwise the two collide into an
// unusable intersection. Same omit on every part below whose props carry HTML
// attributes.
//
// `handle` is omitted for the same reason as on the root: Tooltip.Handle and
// Popover.Handle are distinct classes with incompatible shapes, so a value
// typed for one is not assignable to the other side's trigger.
type TooltipPopoverTriggerProps = Omit<
  React.ComponentProps<typeof TooltipTrigger>,
  "popover" | "handle"
> & {
  popover?: Omit<React.ComponentProps<typeof PopoverTrigger>, "children">
}

function TooltipPopoverTrigger({
  popover,
  ...props
}: TooltipPopoverTriggerProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return (
      <PopoverTrigger
        {...props}
        {...popover}
        className={mergeClassNames(props.className, popover?.className)}
      />
    )
  }
  return <TooltipTrigger {...props} />
}

// Desktop (TooltipContent) props 1:1, plus Popover-side overrides. Both
// wrappers lift `side`/`align`/`sideOffset`/`alignOffset` and keep their own
// native default `side` (Tooltip `"top"`, Popover `"bottom"`) when unset.
type TooltipPopoverContentProps = SharedPartProps<
  Omit<React.ComponentProps<typeof TooltipContent>, "popover">,
  TooltipPrimitive.Popup.State | PopoverPrimitive.Popup.State
> & {
  popover?: Omit<React.ComponentProps<typeof PopoverContent>, "children">
}

function TooltipPopoverContent({
  popover,
  children,
  ...props
}: TooltipPopoverContentProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return (
      <PopoverContent
        {...props}
        {...popover}
        className={mergeClassNames(props.className, popover?.className)}
      >
        {children}
      </PopoverContent>
    )
  }
  return <TooltipContent {...props}>{children}</TooltipContent>
}

// The Tooltip primitive has no Title part, so on desktop this is a styled
// element (functional fallback — never `null`); below the breakpoint it is
// the real Popover.Title, giving touch users the accessible structure a
// tooltip can't. Plain element attributes (no `ref`) — the desktop side is
// synthetic, and this keeps one type assignable to both.
type TooltipPopoverTitleProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "popover"
> & {
  popover?: Omit<React.ComponentProps<typeof PopoverTitle>, "children">
}

function TooltipPopoverTitle({
  popover,
  className,
  ...props
}: TooltipPopoverTitleProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return (
      <PopoverTitle
        {...props}
        {...popover}
        className={mergeClassNames(className, popover?.className)}
      />
    )
  }
  return (
    <div
      data-slot="tooltip-popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

// Same fallback design as the Title: styled element on desktop, real
// Popover.Description below the breakpoint.
type TooltipPopoverDescriptionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "popover"
> & {
  popover?: Omit<React.ComponentProps<typeof PopoverDescription>, "children">
}

function TooltipPopoverDescription({
  popover,
  className,
  ...props
}: TooltipPopoverDescriptionProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return (
      <PopoverDescription
        {...props}
        {...popover}
        className={mergeClassNames(className, popover?.className)}
      />
    )
  }
  return (
    <div
      data-slot="tooltip-popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
}
export type {
  TooltipPopoverContentProps,
  TooltipPopoverOpenChangeDetails,
  TooltipPopoverPopoverProps,
  TooltipPopoverProps,
}
