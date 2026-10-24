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

type Override<Props> = Props extends unknown ? Omit<Props, "children"> : never

const ROOT_CALLBACKS = ["onOpenChange", "onOpenChangeComplete"]

function mergeClassNames(shared: unknown, override: unknown): unknown {
  if (shared == null) return override
  if (override == null) return shared
  if (typeof shared === "string" && typeof override === "string") {
    return cn(shared, override)
  }
  const resolve = (value: unknown, state: unknown) =>
    typeof value === "function"
      ? (value as (state: unknown) => string | undefined)(state)
      : (value as string | undefined)
  return (state: unknown) =>
    cn(resolve(shared, state), resolve(override, state))
}

function composeRootCallbacks(shared: object, override: object | undefined) {
  const sharedProps = shared as Record<string, unknown>
  const overrideProps = (override ?? {}) as Record<string, unknown>
  const composed: Record<string, unknown> = {}
  for (const key of ROOT_CALLBACKS) {
    const sharedCallback = sharedProps[key]
    const overrideCallback = overrideProps[key]
    if (
      typeof sharedCallback === "function" &&
      typeof overrideCallback === "function"
    ) {
      composed[key] = (...args: unknown[]) => {
        sharedCallback(...args)
        overrideCallback(...args)
      }
    }
  }
  return composed
}

function omitKeys(props: object, keys: readonly string[]) {
  const rest: Record<string, unknown> = { ...props }
  for (const key of keys) delete rest[key]
  return rest
}

function toMobileRootProps<Props extends object>(
  shared: object,
  override: Props | undefined
) {
  return {
    ...shared,
    ...override,
    ...composeRootCallbacks(shared, override),
  } as Props
}

function toMobileProps<Props extends object>(
  shared: object,
  override: Props | undefined,
  desktopOnly: readonly string[] = []
) {
  const forwarded = omitKeys(shared, desktopOnly)
  const overrideProps: Record<string, unknown> = { ...override }
  const className = mergeClassNames(
    forwarded.className,
    overrideProps.className
  )
  return {
    ...forwarded,
    ...overrideProps,
    ...(className === undefined ? {} : { className }),
  } as Props
}

const TRIGGER_DESKTOP_ONLY = ["openOnHover", "delay", "closeDelay"]

const CONTENT_DESKTOP_ONLY = [
  "side",
  "align",
  "sideOffset",
  "alignOffset",
  "avoidCollisions",
  "collisionBoundary",
  "collisionPadding",
  "arrowPadding",
  "sticky",
  "hideWhenDetached",
  "updatePositionStrategy",
]

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

type PopoverDrawerProps = Omit<
  React.ComponentProps<typeof Popover>,
  "handle" | "triggerId" | "defaultTriggerId"
> & {
  drawer?: Override<React.ComponentProps<typeof Drawer>>
}

function PopoverDrawer({ drawer, children, ...props }: PopoverDrawerProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <PopoverDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer {...toMobileRootProps(props, drawer)}>{children}</Drawer>
      ) : (
        <Popover {...props}>{children}</Popover>
      )}
    </PopoverDrawerContext.Provider>
  )
}

type PopoverDrawerTriggerProps = Omit<
  React.ComponentProps<typeof PopoverTrigger>,
  "handle"
> & {
  drawer?: Override<React.ComponentProps<typeof DrawerTrigger>>
}

function PopoverDrawerTrigger({ drawer, ...props }: PopoverDrawerTriggerProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerTrigger {...toMobileProps(props, drawer, TRIGGER_DESKTOP_ONLY)} />
    )
  }
  return <PopoverTrigger {...props} />
}

type PopoverDrawerContentProps = React.ComponentProps<typeof PopoverContent> & {
  drawer?: Override<React.ComponentProps<typeof DrawerContent>>
}

function PopoverDrawerContent({
  drawer,
  children,
  ...props
}: PopoverDrawerContentProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return (
      <DrawerContent {...toMobileProps(props, drawer, CONTENT_DESKTOP_ONLY)}>
        {children}
      </DrawerContent>
    )
  }
  return <PopoverContent {...props}>{children}</PopoverContent>
}

type PopoverDrawerHeaderProps = React.ComponentProps<typeof PopoverHeader> & {
  drawer?: Override<React.ComponentProps<typeof DrawerHeader>>
}

function PopoverDrawerHeader({ drawer, ...props }: PopoverDrawerHeaderProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return <DrawerHeader {...toMobileProps(props, drawer)} />
  }
  return <PopoverHeader {...props} />
}

type PopoverDrawerFooterProps = React.ComponentProps<"div"> & {
  drawer?: Override<React.ComponentProps<typeof DrawerFooter>>
}

function PopoverDrawerFooter({
  drawer,
  className,
  ...props
}: PopoverDrawerFooterProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return <DrawerFooter {...toMobileProps({ className, ...props }, drawer)} />
  }
  return (
    <div
      data-slot="popover-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

type PopoverDrawerTitleProps = React.ComponentProps<typeof PopoverTitle> & {
  drawer?: Override<React.ComponentProps<typeof DrawerTitle>>
}

function PopoverDrawerTitle({ drawer, ...props }: PopoverDrawerTitleProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return <DrawerTitle {...toMobileProps(props, drawer)} />
  }
  return <PopoverTitle {...props} />
}

type PopoverDrawerDescriptionProps = React.ComponentProps<
  typeof PopoverDescription
> & {
  drawer?: Override<React.ComponentProps<typeof DrawerDescription>>
}

function PopoverDrawerDescription({
  drawer,
  ...props
}: PopoverDrawerDescriptionProps) {
  const { isMobile } = usePopoverDrawer()

  if (isMobile) {
    return <DrawerDescription {...toMobileProps(props, drawer)} />
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
  PopoverDrawerDescriptionProps,
  PopoverDrawerFooterProps,
  PopoverDrawerHeaderProps,
  PopoverDrawerProps,
  PopoverDrawerTitleProps,
  PopoverDrawerTriggerProps,
}
