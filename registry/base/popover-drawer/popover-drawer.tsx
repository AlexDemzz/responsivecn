"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types"

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

// Below the breakpoint the shared className still applies; the drawer-side
// one is merged on top via cn. (Root state callbacks are a separate concern —
// they compose via composeCallbacks below.)
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

// Root state callbacks compose: the shared handler runs first, then the
// mobile override (spec contract — parts keep replace semantics, roots compose).
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

// Union of both primitives' event details: assignable to both roots via
// function-parameter contravariance, and `reason` narrowing still works.
// Genuinely needed here — the reason sets diverge on both sides (Popover:
// focus-out/trigger-hover/trigger-focus; Drawer: swipe/close-watcher).
type PopoverDrawerOpenChangeDetails =
  | PopoverPrimitive.Root.ChangeEventDetails
  | DrawerPrimitive.Root.ChangeEventDetails

// Widens the state-parameterized props (className, style, render) to a
// union State — same contravariance trick as onOpenChange, so one value
// is assignable to both the Popover and the Drawer side of a part.
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

// Drawer-side root overrides, applied only below the breakpoint. Matches
// the Drawer wrapper API 1:1: the drawer-only props (snapPoints,
// swipeDirection, showSwipeHandle, …) plus overrides of shared props
// (e.g. modal).
type PopoverDrawerDrawerProps = Omit<
  React.ComponentProps<typeof Drawer>,
  "children"
>

// Desktop (Popover) root props 1:1, plus the `drawer` namespace — named
// after the mobile side of the pair. `handle`/`triggerId` are unsupported:
// Popover.Handle and Drawer.Handle are distinct classes.
//
// The `modal` divergence is deliberately NOT masked: no default is set here,
// so each side keeps its native default (Popover false, Drawer true). An
// explicit `modal` sits in `...props` and forwards to both sides.
type PopoverDrawerProps = Omit<
  React.ComponentProps<typeof Popover>,
  "onOpenChange" | "handle" | "triggerId" | "defaultTriggerId"
> & {
  onOpenChange?: (
    open: boolean,
    eventDetails: PopoverDrawerOpenChangeDetails
  ) => void
  drawer?: PopoverDrawerDrawerProps
}

function PopoverDrawer({ drawer, children, ...props }: PopoverDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  // Compose the state-lifecycle callbacks the Popover and Drawer roots share;
  // the remaining drawer overrides keep replace semantics via {...drawerRest}.
  const {
    onOpenChange: overrideOnOpenChange,
    onOpenChangeComplete: overrideOnOpenChangeComplete,
    ...drawerRest
  } = drawer ?? {}

  return (
    <PopoverDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer
          {...props}
          {...drawerRest}
          onOpenChange={composeCallbacks(
            props.onOpenChange,
            overrideOnOpenChange
          )}
          onOpenChangeComplete={composeCallbacks(
            props.onOpenChangeComplete,
            overrideOnOpenChangeComplete
          )}
        >
          {children}
        </Drawer>
      ) : (
        <Popover {...props}>{children}</Popover>
      )}
    </PopoverDrawerContext.Provider>
  )
}

// `openOnHover`/`delay`/`closeDelay` are Popover-trigger-only (hover-to-open
// has no drawer analog): forwarded on desktop, dropped on mobile. `handle` is
// dropped like on the root — Popover.Handle and Drawer.Handle are distinct
// classes, so the multi-trigger handle cannot drive the mobile primitive.
type PopoverDrawerTriggerProps = Omit<
  React.ComponentProps<typeof PopoverTrigger>,
  "handle"
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTrigger>, "children">
}

function PopoverDrawerTrigger({
  drawer,
  openOnHover,
  delay,
  closeDelay,
  ...props
}: PopoverDrawerTriggerProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger
        {...props}
        {...drawer}
        className={mergeClassNames(props.className, drawer?.className)}
      />
    )
  }
  return (
    <PopoverTrigger
      openOnHover={openOnHover}
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

// Desktop (PopoverContent) props 1:1, plus Drawer-side overrides.
// `side`/`align`/`sideOffset`/`alignOffset` are lifted from the Popover
// Positioner — anchor positioning is meaningless on an edge-anchored drawer,
// so they are desktop-only and dropped on mobile.
type PopoverDrawerContentProps = SharedPartProps<
  React.ComponentProps<typeof PopoverContent>,
  PopoverPrimitive.Popup.State | DrawerPrimitive.Popup.State
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerContent>, "children">
}

function PopoverDrawerContent({
  drawer,
  side,
  align,
  sideOffset,
  alignOffset,
  children,
  ...props
}: PopoverDrawerContentProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerContent
        {...props}
        {...drawer}
        className={mergeClassNames(props.className, drawer?.className)}
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
        className={mergeClassNames(props.className, drawer?.className)}
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
        className={mergeClassNames(props.className, drawer?.className)}
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
  PopoverDrawerOpenChangeDetails,
  PopoverDrawerProps,
}
