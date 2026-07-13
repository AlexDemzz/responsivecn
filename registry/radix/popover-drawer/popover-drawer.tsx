"use client"

import * as React from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

// Orphan `PopoverAnchor`: the radix shadcn Popover wrapper exports a
// PopoverAnchor (Radix has an Anchor part); the Base UI wrapper does not, and
// anchor positioning has no drawer analog. To keep cross-base name parity (the
// exported part set must match the Base UI counterpart 1:1) it is OMITTED here
// — exposing a radix-only Anchor would break parity and it maps to nothing on
// the mobile Drawer (radix-vaul research §3.3).

const PopoverDrawerContext = React.createContext<{ isMobile: boolean } | null>(
  null
)

function usePopoverDrawer() {
  const context = React.useContext(PopoverDrawerContext)

  if (!context) {
    throw new Error("PopoverDrawer parts must be used within a PopoverDrawer.")
  }

  return context
}

// On radix, className is a plain string on every part (Radix/Vaul have no
// state-function className form — that was a Base UI capability). So the merge
// is a straight cn(shared, drawer): below the breakpoint the shared className
// still applies and the drawer-side one is layered on top.

// Distribute the `children` omit across Vaul's WithFadeFromProps |
// WithoutFadeFromProps union so its "fadeFromIndex requires snapPoints"
// constraint survives — a plain Omit flattens the union and silently drops
// fadeFromIndex (radix-vaul research §2.3).
type OmitChildren<T> = T extends unknown ? Omit<T, "children"> : never

// Drawer-side root overrides, applied only below the breakpoint. Matches the
// Vaul Drawer wrapper API 1:1: the drawer-only props (snapPoints, direction,
// dismissible, autoFocus, onDrag/onRelease, …) plus overrides of shared props
// (e.g. modal).
type PopoverDrawerDrawerProps = OmitChildren<
  React.ComponentProps<typeof Drawer>
>

// Desktop (Popover) root props 1:1, plus the `drawer` namespace — named after
// the mobile side of the pair. onOpenChange is (open: boolean) => void on both
// sides: radix has no ChangeEventDetails, so there is no union and no reason/
// cancel()/eventDetails. Cross-base parity is prop-NAME parity, not prop-TYPE
// parity. (Radix Popover.Root has no handle/triggerId concepts to drop.)
//
// The `modal` divergence is deliberately NOT masked: no default is set here, so
// each side keeps its native default (Radix Popover false, Vaul Drawer true).
// An explicit `modal` sits in `...props` and forwards to both sides. Note the
// non-modal semantics also differ in kind — a non-modal Vaul drawer does NOT
// dismiss on outside press, unlike the popover it replaces (research §5.1).
type PopoverDrawerProps = Omit<
  React.ComponentProps<typeof Popover>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void
  drawer?: PopoverDrawerDrawerProps
}

function PopoverDrawer({ drawer, children, ...props }: PopoverDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <PopoverDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer {...props} {...drawer}>
          {children}
        </Drawer>
      ) : (
        <Popover {...props}>{children}</Popover>
      )}
    </PopoverDrawerContext.Provider>
  )
}

// Radix Popover.Trigger is a plain click-toggle button — there are no
// openOnHover/delay/closeDelay props to drop (those were Base UI), so this
// mirrors the Drawer trigger 1:1 with just a drawer={{}} override.
type PopoverDrawerTriggerProps = React.ComponentProps<typeof PopoverTrigger> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTrigger>, "children">
}

function PopoverDrawerTrigger({ drawer, ...props }: PopoverDrawerTriggerProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <PopoverTrigger {...props} />
}

// Desktop (PopoverContent) props 1:1, plus Drawer-side overrides. Radix exposes
// the ENTIRE Popper positioning surface directly on PopoverContent (no
// Positioner part hides it): side/align/sideOffset/alignOffset plus the
// collision/sticky props. All of it is anchor-positioning, meaningless on an
// edge-anchored drawer, so it is desktop-only and stripped from the mobile
// branch — a larger drop list than the Base UI side's 4 (research §3.3). The
// dismissal callbacks stay in `...props` (shared, identically typed on Vaul).
type PopoverDrawerContentProps = React.ComponentProps<typeof PopoverContent> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerContent>, "children">
}

function PopoverDrawerContent({
  drawer,
  side,
  align,
  sideOffset,
  alignOffset,
  avoidCollisions,
  collisionBoundary,
  collisionPadding,
  arrowPadding,
  sticky,
  hideWhenDetached,
  updatePositionStrategy,
  children,
  ...props
}: PopoverDrawerContentProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerContent
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      >
        {children}
      </DrawerContent>
    )
  }
  return (
    <PopoverContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      collisionBoundary={collisionBoundary}
      collisionPadding={collisionPadding}
      arrowPadding={arrowPadding}
      sticky={sticky}
      hideWhenDetached={hideWhenDetached}
      updatePositionStrategy={updatePositionStrategy}
      {...props}
    >
      {children}
    </PopoverContent>
  )
}

type PopoverDrawerHeaderProps = React.ComponentProps<typeof PopoverHeader> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerHeader>, "children">
}

function PopoverDrawerHeader({ drawer, ...props }: PopoverDrawerHeaderProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerHeader
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <PopoverHeader {...props} />
}

// Orphan part: the shadcn Popover ships no footer. On desktop it is a
// functional fallback — a plain styled <div> (never null, per the pair's
// orphan policy) — that maps to DrawerFooter below the breakpoint.
type PopoverDrawerFooterProps = React.ComponentProps<"div"> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerFooter>, "children">
}

function PopoverDrawerFooter({ drawer, ...props }: PopoverDrawerFooterProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerFooter
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return (
    <div
      data-slot="popover-footer"
      {...props}
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        props.className
      )}
    />
  )
}

type PopoverDrawerTitleProps = React.ComponentProps<typeof PopoverTitle> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTitle>, "children">
}

function PopoverDrawerTitle({ drawer, ...props }: PopoverDrawerTitleProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerTitle
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <PopoverTitle {...props} />
}

type PopoverDrawerDescriptionProps = React.ComponentProps<
  typeof PopoverDescription
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerDescription>, "children">
}

function PopoverDrawerDescription({
  drawer,
  ...props
}: PopoverDrawerDescriptionProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerDescription
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <PopoverDescription {...props} />
}

export {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerFooter,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
}
export type {
  PopoverDrawerContentProps,
  PopoverDrawerDrawerProps,
  PopoverDrawerProps,
}
