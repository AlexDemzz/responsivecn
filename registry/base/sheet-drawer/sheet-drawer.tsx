"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const SheetDrawerContext = React.createContext<{ isMobile: boolean } | null>(
  null
)

function useSheetDrawer() {
  const context = React.useContext(SheetDrawerContext)

  if (!context) {
    throw new Error("SheetDrawer parts must be used within a SheetDrawer.")
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

// Sheet's `side` is a CSS-only Content prop; the Drawer's `swipeDirection`
// is a Root prop driving gesture physics. Fixed mechanical lookup. Applied
// only when the consumer sets `side` explicitly — no default auto-map, so an
// unset side leaves the Drawer at its native "down" default.
type SheetSide = NonNullable<React.ComponentProps<typeof SheetContent>["side"]>
type SwipeDirection = NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>

const SIDE_TO_SWIPE_DIRECTION: Record<SheetSide, SwipeDirection> = {
  top: "up",
  right: "right",
  bottom: "down",
  left: "left",
}

// Union of both primitives' event details: assignable to both roots via
// function-parameter contravariance, and `reason` narrowing still works
// (e.g. reason === "swipe" only exists on the Drawer side).
type SheetDrawerOpenChangeDetails =
  | SheetPrimitive.Root.ChangeEventDetails
  | DrawerPrimitive.Root.ChangeEventDetails

// Widens the state-parameterized props (className, style, render) to a
// union State — same contravariance trick as onOpenChange, so one value
// is assignable to both the Sheet and the Drawer side of a part.
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
type SheetDrawerDrawerProps = Omit<
  React.ComponentProps<typeof Drawer>,
  "children"
>

// Desktop (Sheet) root props 1:1, plus the `drawer` namespace — named after
// the mobile side of the pair. `handle`/`triggerId` are unsupported:
// Dialog.Handle and Drawer.Handle are distinct classes — a desktop handle
// cannot drive the mobile primitive. `side` is a Content prop, not a root
// prop: it maps to the Drawer's `swipeDirection` via SIDE_TO_SWIPE_DIRECTION.
type SheetDrawerProps = Omit<
  React.ComponentProps<typeof Sheet>,
  "onOpenChange" | "handle" | "triggerId" | "defaultTriggerId"
> & {
  onOpenChange?: (
    open: boolean,
    eventDetails: SheetDrawerOpenChangeDetails
  ) => void
  drawer?: SheetDrawerDrawerProps
}

// `side` lives on the Content, but `swipeDirection` lives on the Drawer
// Root — a child prop the root must read. Walk the direct children for the
// Content part and pick up an explicitly-set `side`. Base UI's Dialog root
// also accepts a render-function child; there are no elements to inspect
// there, so it resolves to no explicit side.
function findExplicitSide(
  children: SheetDrawerProps["children"]
): SheetSide | undefined {
  if (typeof children === "function") return undefined

  let side: SheetSide | undefined

  React.Children.forEach(children, (child) => {
    if (
      React.isValidElement<SheetDrawerContentProps>(child) &&
      child.type === SheetDrawerContent &&
      child.props.side != null
    ) {
      side = child.props.side
    }
  })

  return side
}

function SheetDrawer({ drawer, children, ...props }: SheetDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])
  const explicitSide = findExplicitSide(children)
  // Undefined when no explicit side → Drawer keeps its "down" default.
  // Placed before the spreads so an explicit drawer={{ swipeDirection }} wins.
  const swipeDirection = explicitSide
    ? SIDE_TO_SWIPE_DIRECTION[explicitSide]
    : undefined

  // Compose the state-lifecycle callbacks the Sheet and Drawer roots share;
  // the remaining drawer overrides keep replace semantics via {...drawerRest}.
  const {
    onOpenChange: overrideOnOpenChange,
    onOpenChangeComplete: overrideOnOpenChangeComplete,
    ...drawerRest
  } = drawer ?? {}

  return (
    <SheetDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer
          swipeDirection={swipeDirection}
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
        <Sheet {...props}>{children}</Sheet>
      )}
    </SheetDrawerContext.Provider>
  )
}

type SheetDrawerTriggerProps = Omit<
  React.ComponentProps<typeof SheetTrigger>,
  "handle"
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTrigger>, "children">
}

function SheetDrawerTrigger({ drawer, ...props }: SheetDrawerTriggerProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger
        {...props}
        {...drawer}
        className={mergeClassNames(props.className, drawer?.className)}
      />
    )
  }
  return <SheetTrigger {...props} />
}

// Desktop (SheetContent) props 1:1, plus Drawer-side overrides. `side` and
// `showCloseButton` are desktop-only: `side` maps to the root swipeDirection
// (consumed by SheetDrawer), `showCloseButton` has no Drawer slot (a drawer
// dismisses by swipe). Both are stripped from the mobile branch.
type SheetDrawerContentProps = SharedPartProps<
  React.ComponentProps<typeof SheetContent>,
  SheetPrimitive.Popup.State | DrawerPrimitive.Popup.State
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerContent>, "children">
}

function SheetDrawerContent({
  drawer,
  side,
  showCloseButton,
  children,
  ...props
}: SheetDrawerContentProps) {
  const { isMobile } = useSheetDrawer()

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
    <SheetContent side={side} showCloseButton={showCloseButton} {...props}>
      {children}
    </SheetContent>
  )
}

type SheetDrawerHeaderProps = React.ComponentProps<typeof SheetHeader> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerHeader>, "children">
}

function SheetDrawerHeader({ drawer, ...props }: SheetDrawerHeaderProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerHeader
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <SheetHeader {...props} />
}

type SheetDrawerFooterProps = React.ComponentProps<typeof SheetFooter> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerFooter>, "children">
}

function SheetDrawerFooter({ drawer, ...props }: SheetDrawerFooterProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerFooter
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <SheetFooter {...props} />
}

type SheetDrawerTitleProps = React.ComponentProps<typeof SheetTitle> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTitle>, "children">
}

function SheetDrawerTitle({ drawer, ...props }: SheetDrawerTitleProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerTitle
        {...props}
        {...drawer}
        className={mergeClassNames(props.className, drawer?.className)}
      />
    )
  }
  return <SheetTitle {...props} />
}

type SheetDrawerDescriptionProps = React.ComponentProps<
  typeof SheetDescription
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerDescription>, "children">
}

function SheetDrawerDescription({
  drawer,
  ...props
}: SheetDrawerDescriptionProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerDescription
        {...props}
        {...drawer}
        className={mergeClassNames(props.className, drawer?.className)}
      />
    )
  }
  return <SheetDescription {...props} />
}

type SheetDrawerCloseProps = React.ComponentProps<typeof SheetClose> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerClose>, "children">
}

function SheetDrawerClose({ drawer, ...props }: SheetDrawerCloseProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerClose
        {...props}
        {...drawer}
        className={mergeClassNames(props.className, drawer?.className)}
      />
    )
  }
  return <SheetClose {...props} />
}

export {
  SheetDrawer,
  SheetDrawerClose,
  SheetDrawerContent,
  SheetDrawerDescription,
  SheetDrawerFooter,
  SheetDrawerHeader,
  SheetDrawerTitle,
  SheetDrawerTrigger,
}
export type {
  SheetDrawerContentProps,
  SheetDrawerDrawerProps,
  SheetDrawerOpenChangeDetails,
  SheetDrawerProps,
}
