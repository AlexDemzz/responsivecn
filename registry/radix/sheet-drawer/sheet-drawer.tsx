"use client"

import * as React from "react"

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
// dismissible, handleOnly, autoFocus, onDrag/onRelease, …) plus overrides of
// shared props (e.g. modal).
type SheetDrawerDrawerProps = OmitChildren<React.ComponentProps<typeof Drawer>>

// Sheet's `side` is a CSS-only Content prop; Vaul's `direction` is a Root prop
// driving gesture physics and placement. Fixed mechanical lookup — but on radix
// it is the IDENTITY map (Vaul's `direction` names the anchored edge exactly
// like Sheet's `side`), simpler than the base side's bottom→"down" swipe table.
// Applied only when the consumer sets `side` explicitly — no default auto-map,
// so an unset side leaves the Vaul Drawer at its native "bottom" default.
type SheetSide = NonNullable<React.ComponentProps<typeof SheetContent>["side"]>
type DrawerDirection = NonNullable<
  React.ComponentProps<typeof Drawer>["direction"]
>

const SIDE_TO_DIRECTION: Record<SheetSide, DrawerDirection> = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
}

// Desktop (Sheet) root props 1:1, plus the `drawer` namespace — named after the
// mobile side of the pair. onOpenChange is (open: boolean) => void on both
// sides: radix has no ChangeEventDetails, so there is no union and no reason/
// cancel()/eventDetails. Cross-base parity is prop-NAME parity, not prop-TYPE
// parity. `side` is a Content prop, not a root prop: it maps to the Vaul Drawer
// `direction` via SIDE_TO_DIRECTION. (Radix Dialog.Root has no handle/triggerId
// concepts to drop.)
type SheetDrawerProps = Omit<
  React.ComponentProps<typeof Sheet>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void
  drawer?: SheetDrawerDrawerProps
}

// `side` lives on the Content, but `direction` lives on the Vaul Root — a child
// prop the root must read. Walk the direct children for the Content part and
// pick up an explicitly-set `side`. Radix Dialog.Root children is plain
// ReactNode (no render-function child to skip, unlike Base UI).
function findExplicitSide(
  children: SheetDrawerProps["children"]
): SheetSide | undefined {
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

function SheetDrawer({ drawer, children, ...props }: SheetDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])
  const explicitSide = findExplicitSide(children)
  // Undefined when no explicit side → Vaul keeps its "bottom" default.
  // Placed before the spreads so an explicit drawer={{ direction }} wins.
  const direction = explicitSide ? SIDE_TO_DIRECTION[explicitSide] : undefined

  return (
    <SheetDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer
          direction={direction}
          {...props}
          {...drawer}
          onOpenChange={composeCallbacks(
            props.onOpenChange,
            drawer?.onOpenChange
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

type SheetDrawerTriggerProps = React.ComponentProps<typeof SheetTrigger> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTrigger>, "children">
}

function SheetDrawerTrigger({ drawer, ...props }: SheetDrawerTriggerProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <SheetTrigger {...props} />
}

// Desktop (SheetContent) props 1:1, plus Drawer-side overrides. `side` and
// `showCloseButton` are desktop-only: `side` maps to the root direction
// (consumed by SheetDrawer), `showCloseButton` has no Drawer slot (a drawer
// dismisses by swipe). Both are stripped from the mobile branch.
type SheetDrawerContentProps = React.ComponentProps<typeof SheetContent> & {
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
        className={cn(props.className, drawer?.className)}
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
        className={cn(props.className, drawer?.className)}
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
        className={cn(props.className, drawer?.className)}
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
        className={cn(props.className, drawer?.className)}
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
  SheetDrawerProps,
}
