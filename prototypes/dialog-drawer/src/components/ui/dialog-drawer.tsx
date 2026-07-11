"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

const DialogDrawerContext = React.createContext<{ isMobile: boolean } | null>(
  null
)

function useDialogDrawer() {
  const context = React.useContext(DialogDrawerContext)

  if (!context) {
    throw new Error("DialogDrawer parts must be used within a DialogDrawer.")
  }

  return context
}

// On mobile the shared className still applies; the mobile one is merged on
// top via cn. Callbacks compose: both are resolved against the Drawer-side
// state, then merged.
function mergeMobileClassName<State>(
  shared: string | ((state: State) => string | undefined) | undefined,
  mobile: string | ((state: State) => string | undefined) | undefined
): string | ((state: State) => string | undefined) | undefined {
  if (shared == null) return mobile
  if (mobile == null) return shared
  if (typeof shared === "string" && typeof mobile === "string") {
    return cn(shared, mobile)
  }
  return (state: State) =>
    cn(
      typeof shared === "function" ? shared(state) : shared,
      typeof mobile === "function" ? mobile(state) : mobile
    )
}

// Union of both primitives' event details: assignable to both roots via
// function-parameter contravariance, and `reason` narrowing still works
// (e.g. reason === "swipe" only exists on the Drawer side).
type DialogDrawerOpenChangeDetails =
  | DialogPrimitive.Root.ChangeEventDetails
  | DrawerPrimitive.Root.ChangeEventDetails

// Widens the state-parameterized props (className, style, render) to a
// union State — same contravariance trick as onOpenChange, so one value
// is assignable to both the Dialog and the Drawer side of a part.
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
// the Drawer wrapper API 1:1: the mobile-only props (snapPoints,
// swipeDirection, showSwipeHandle, …) plus overrides of shared props
// (e.g. modal).
type DialogDrawerMobileProps = Omit<
  React.ComponentProps<typeof Drawer>,
  "children"
>

// Desktop (Dialog) root props 1:1, plus the `mobile` namespace.
// `handle`/`triggerId` are unsupported: Dialog.Handle and Drawer.Handle are
// distinct classes — a desktop handle cannot drive the mobile primitive.
type DialogDrawerProps = Omit<
  React.ComponentProps<typeof Dialog>,
  "onOpenChange" | "handle" | "triggerId" | "defaultTriggerId"
> & {
  onOpenChange?: (
    open: boolean,
    eventDetails: DialogDrawerOpenChangeDetails
  ) => void
  mobile?: DialogDrawerMobileProps
}

function DialogDrawer({ mobile, children, ...props }: DialogDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <DialogDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer {...props} {...mobile}>
          {children}
        </Drawer>
      ) : (
        <Dialog {...props}>{children}</Dialog>
      )}
    </DialogDrawerContext.Provider>
  )
}

type DialogDrawerTriggerProps = React.ComponentProps<typeof DialogTrigger> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerTrigger>, "children">
}

function DialogDrawerTrigger({
  mobile,
  ...props
}: DialogDrawerTriggerProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger
        {...props}
        {...mobile}
        className={mergeMobileClassName(props.className, mobile?.className)}
      />
    )
  }
  return <DialogTrigger {...props} />
}

// Desktop (DialogContent) props 1:1, plus Drawer-side overrides.
// `showCloseButton` is desktop-only (a drawer dismisses by swipe).
type DialogDrawerContentProps = SharedPartProps<
  React.ComponentProps<typeof DialogContent>,
  DialogPrimitive.Popup.State | DrawerPrimitive.Popup.State
> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerContent>, "children">
}

function DialogDrawerContent({
  mobile,
  showCloseButton,
  children,
  ...props
}: DialogDrawerContentProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerContent
        {...props}
        {...mobile}
        className={mergeMobileClassName(props.className, mobile?.className)}
      >
        {children}
      </DrawerContent>
    )
  }
  return (
    <DialogContent showCloseButton={showCloseButton} {...props}>
      {children}
    </DialogContent>
  )
}

type DialogDrawerHeaderProps = React.ComponentProps<typeof DialogHeader> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerHeader>, "children">
}

function DialogDrawerHeader({ mobile, ...props }: DialogDrawerHeaderProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerHeader
        {...props}
        {...mobile}
        className={cn(props.className, mobile?.className)}
      />
    )
  }
  return <DialogHeader {...props} />
}

// `showCloseButton` is desktop-only (DrawerFooter has no close button slot).
type DialogDrawerFooterProps = React.ComponentProps<typeof DialogFooter> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerFooter>, "children">
}

function DialogDrawerFooter({
  mobile,
  showCloseButton,
  ...props
}: DialogDrawerFooterProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerFooter
        {...props}
        {...mobile}
        className={cn(props.className, mobile?.className)}
      />
    )
  }
  return <DialogFooter showCloseButton={showCloseButton} {...props} />
}

type DialogDrawerTitleProps = React.ComponentProps<typeof DialogTitle> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerTitle>, "children">
}

function DialogDrawerTitle({ mobile, ...props }: DialogDrawerTitleProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerTitle
        {...props}
        {...mobile}
        className={mergeMobileClassName(props.className, mobile?.className)}
      />
    )
  }
  return <DialogTitle {...props} />
}

type DialogDrawerDescriptionProps = React.ComponentProps<
  typeof DialogDescription
> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerDescription>, "children">
}

function DialogDrawerDescription({
  mobile,
  ...props
}: DialogDrawerDescriptionProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerDescription
        {...props}
        {...mobile}
        className={mergeMobileClassName(props.className, mobile?.className)}
      />
    )
  }
  return <DialogDescription {...props} />
}

type DialogDrawerCloseProps = React.ComponentProps<typeof DialogClose> & {
  mobile?: Omit<React.ComponentProps<typeof DrawerClose>, "children">
}

function DialogDrawerClose({ mobile, ...props }: DialogDrawerCloseProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerClose
        {...props}
        {...mobile}
        className={mergeMobileClassName(props.className, mobile?.className)}
      />
    )
  }
  return <DialogClose {...props} />
}

export {
  DialogDrawer,
  DialogDrawerClose,
  DialogDrawerContent,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
  DialogDrawerTrigger,
}
export type {
  DialogDrawerContentProps,
  DialogDrawerMobileProps,
  DialogDrawerOpenChangeDetails,
  DialogDrawerProps,
}
