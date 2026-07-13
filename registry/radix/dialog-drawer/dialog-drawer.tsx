"use client"

import * as React from "react"

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
type DialogDrawerDrawerProps = OmitChildren<React.ComponentProps<typeof Drawer>>

// Desktop (Dialog) root props 1:1, plus the `drawer` namespace — named after
// the mobile side of the pair. onOpenChange is (open: boolean) => void on both
// sides: radix has no ChangeEventDetails, so there is no union and no reason/
// cancel()/eventDetails. Cross-base parity is prop-NAME parity, not prop-TYPE
// parity — the Base UI side's onOpenChange carries eventDetails, this one does
// not. (Radix Dialog.Root has no handle/triggerId concepts to drop.)
type DialogDrawerProps = Omit<
  React.ComponentProps<typeof Dialog>,
  "onOpenChange"
> & {
  onOpenChange?: (open: boolean) => void
  drawer?: DialogDrawerDrawerProps
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

function DialogDrawer({ drawer, children, ...props }: DialogDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <DialogDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer
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
        <Dialog {...props}>{children}</Dialog>
      )}
    </DialogDrawerContext.Provider>
  )
}

type DialogDrawerTriggerProps = React.ComponentProps<typeof DialogTrigger> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTrigger>, "children">
}

function DialogDrawerTrigger({ drawer, ...props }: DialogDrawerTriggerProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <DialogTrigger {...props} />
}

// Desktop (DialogContent) props 1:1, plus Drawer-side overrides.
// `showCloseButton` is desktop-only (a drawer dismisses by swipe).
type DialogDrawerContentProps = React.ComponentProps<typeof DialogContent> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerContent>, "children">
}

function DialogDrawerContent({
  drawer,
  showCloseButton,
  children,
  ...props
}: DialogDrawerContentProps) {
  const { isMobile } = useDialogDrawer()

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
    <DialogContent showCloseButton={showCloseButton} {...props}>
      {children}
    </DialogContent>
  )
}

type DialogDrawerHeaderProps = React.ComponentProps<typeof DialogHeader> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerHeader>, "children">
}

function DialogDrawerHeader({ drawer, ...props }: DialogDrawerHeaderProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerHeader
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <DialogHeader {...props} />
}

// `showCloseButton` is desktop-only (DrawerFooter has no close button slot).
type DialogDrawerFooterProps = React.ComponentProps<typeof DialogFooter> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerFooter>, "children">
}

function DialogDrawerFooter({
  drawer,
  showCloseButton,
  ...props
}: DialogDrawerFooterProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerFooter
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <DialogFooter showCloseButton={showCloseButton} {...props} />
}

type DialogDrawerTitleProps = React.ComponentProps<typeof DialogTitle> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerTitle>, "children">
}

function DialogDrawerTitle({ drawer, ...props }: DialogDrawerTitleProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerTitle
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <DialogTitle {...props} />
}

type DialogDrawerDescriptionProps = React.ComponentProps<
  typeof DialogDescription
> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerDescription>, "children">
}

function DialogDrawerDescription({
  drawer,
  ...props
}: DialogDrawerDescriptionProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerDescription
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
      />
    )
  }
  return <DialogDescription {...props} />
}

type DialogDrawerCloseProps = React.ComponentProps<typeof DialogClose> & {
  drawer?: Omit<React.ComponentProps<typeof DrawerClose>, "children">
}

function DialogDrawerClose({ drawer, ...props }: DialogDrawerCloseProps) {
  const { isMobile } = useDialogDrawer()

  if (isMobile) {
    return (
      <DrawerClose
        {...props}
        {...drawer}
        className={cn(props.className, drawer?.className)}
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
  DialogDrawerDrawerProps,
  DialogDrawerProps,
}
