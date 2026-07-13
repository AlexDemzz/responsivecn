"use client"

import * as React from "react"

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

// TooltipProvider stays an app-level convention (shadcn radix): keep your
// <TooltipProvider> from "@/components/ui/tooltip" at the root of your app to
// get delay=0 grouping on desktop. It renders no DOM and is harmless around the
// mobile Popover branch, so the pair assumes it exists and never renders one.
//
// Why the swap exists on radix: Radix tooltips are touch-dead in source — the
// trigger ignores touch pointer-moves and a tap closes an open tooltip
// (tooltip.tsx L294–L319) — so hover users get a tooltip, touch users get
// nothing. Below the breakpoint we swap to a press-to-open Popover. Note this
// is responsivecn's own a11y prescription on radix (Radix documents no
// alternative), and unlike Base UI's infotip recipe the mobile Radix Popover
// has NO hover-open option (Popover.Trigger is click-only) — the swap is
// strictly hover-tooltip-desktop / press-popover-mobile (research §1.4, §5.2).

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

// On radix, className is a plain string on every part (Radix has no
// state-function className form — that was a Base UI capability). So the merge
// is a straight cn(shared, popover): below the breakpoint the shared className
// still applies and the popover-side one is layered on top.

// Popover-side root overrides, applied only below the breakpoint. Matches the
// Radix Popover wrapper API 1:1: Popover-only props (modal — Radix Tooltip has
// none) plus overrides of the shared open/state props.
type TooltipPopoverPopoverProps = Omit<
  React.ComponentProps<typeof Popover>,
  "children"
>

// Desktop (Tooltip) root props 1:1, plus the `popover` namespace — named after
// the mobile side of the pair. onOpenChange is (open: boolean) => void on both
// sides: radix has no ChangeEventDetails, so there is no union and no reason/
// cancel()/eventDetails. Cross-base parity is prop-NAME parity, not prop-TYPE
// parity. (Radix Tooltip.Root has no handle/triggerId concepts to drop; its
// desktop-only delayDuration/disableHoverableContent stay in ...props and are
// ignored by the mobile Popover root, which renders no DOM.)
type TooltipPopoverProps = Omit<
  React.ComponentProps<typeof Tooltip>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void
  popover?: TooltipPopoverPopoverProps
}

// State callbacks COMPOSE at the root: shared runs first, then the mobile
// override. (Value props like `modal` still replace via the spread.)
function composeCallbacks<Args extends unknown[]>(
  shared: ((...args: Args) => void) | undefined,
  override: ((...args: Args) => void) | undefined
): ((...args: Args) => void) | undefined {
  if (!shared) return override
  if (!override) return shared
  return (...args) => {
    shared(...args)
    override(...args)
  }
}

function TooltipPopover({ popover, children, ...props }: TooltipPopoverProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <TooltipPopoverContext.Provider value={contextValue}>
      {isMobile ? (
        <Popover
          {...props}
          {...popover}
          onOpenChange={composeCallbacks(
            props.onOpenChange,
            popover?.onOpenChange
          )}
        >
          {children}
        </Popover>
      ) : (
        <Tooltip {...props}>{children}</Tooltip>
      )}
    </TooltipPopoverContext.Provider>
  )
}

// `popover` is also a native HTML global attribute (the Popover API:
// `popover="auto" | "manual" | "hint"`), present on every element's props. Our
// override namespace claims that name, so drop the native attribute from the
// desktop props before adding it — otherwise the two collide into an unusable
// intersection. Same omit on every part below whose props carry HTML attributes.
type TooltipPopoverTriggerProps = Omit<
  React.ComponentProps<typeof TooltipTrigger>,
  "popover"
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
        className={cn(props.className, popover?.className)}
      />
    )
  }
  return <TooltipTrigger {...props} />
}

// Desktop (TooltipContent) props 1:1, plus Popover-side overrides. Both wrappers
// share the Radix Popper positioning surface (side/align/sideOffset/…), so it
// forwards to whichever side renders and each keeps its own native default
// `side` (Tooltip "top", Popover "bottom") when unset.
type TooltipPopoverContentProps = Omit<
  React.ComponentProps<typeof TooltipContent>,
  "popover"
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
        className={cn(props.className, popover?.className)}
      >
        {children}
      </PopoverContent>
    )
  }
  return <TooltipContent {...props}>{children}</TooltipContent>
}

// The Radix Tooltip primitive has no Title part, so on desktop this is a styled
// element (functional fallback — never `null`); below the breakpoint it is the
// real PopoverTitle. Plain element attributes (no `ref`) — the desktop side is
// synthetic, and this keeps one type assignable to both. Note: on radix the
// PopoverTitle is itself a bare styled <div> with no aria wiring (research
// §1.3), so the swap is structural, not an a11y upgrade as it was on Base UI.
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
        className={cn(className, popover?.className)}
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
// PopoverDescription below the breakpoint.
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
        className={cn(className, popover?.className)}
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
  TooltipPopoverPopoverProps,
  TooltipPopoverProps,
}
