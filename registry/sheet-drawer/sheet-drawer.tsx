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

const CONTENT_DESKTOP_ONLY = ["side", "showCloseButton"]

type SheetSide = NonNullable<React.ComponentProps<typeof SheetContent>["side"]>

const SIDE_TO_DRAWER_EDGE: Record<SheetSide, object> = {
  top: { swipeDirection: "up", direction: "top" },
  right: { swipeDirection: "right", direction: "right" },
  bottom: { swipeDirection: "down", direction: "bottom" },
  left: { swipeDirection: "left", direction: "left" },
}

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

type SheetDrawerProps = Omit<
  React.ComponentProps<typeof Sheet>,
  "handle" | "triggerId" | "defaultTriggerId"
> & {
  drawer?: Override<React.ComponentProps<typeof Drawer>>
}

function findExplicitSide(children: SheetDrawerProps["children"]) {
  let side: SheetSide | undefined
  if (typeof children === "function") return side
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
  const side = findExplicitSide(children)
  const drawerEdge = side ? SIDE_TO_DRAWER_EDGE[side] : {}

  return (
    <SheetDrawerContext.Provider value={contextValue}>
      {isMobile ? (
        <Drawer {...toMobileRootProps({ ...drawerEdge, ...props }, drawer)}>
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
  drawer?: Override<React.ComponentProps<typeof DrawerTrigger>>
}

function SheetDrawerTrigger({ drawer, ...props }: SheetDrawerTriggerProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return <DrawerTrigger {...toMobileProps(props, drawer)} />
  }
  return <SheetTrigger {...props} />
}

type SheetDrawerContentProps = React.ComponentProps<typeof SheetContent> & {
  drawer?: Override<React.ComponentProps<typeof DrawerContent>>
}

function SheetDrawerContent({
  drawer,
  children,
  ...props
}: SheetDrawerContentProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return (
      <DrawerContent {...toMobileProps(props, drawer, CONTENT_DESKTOP_ONLY)}>
        {children}
      </DrawerContent>
    )
  }
  return <SheetContent {...props}>{children}</SheetContent>
}

type SheetDrawerHeaderProps = React.ComponentProps<typeof SheetHeader> & {
  drawer?: Override<React.ComponentProps<typeof DrawerHeader>>
}

function SheetDrawerHeader({ drawer, ...props }: SheetDrawerHeaderProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return <DrawerHeader {...toMobileProps(props, drawer)} />
  }
  return <SheetHeader {...props} />
}

type SheetDrawerFooterProps = React.ComponentProps<typeof SheetFooter> & {
  drawer?: Override<React.ComponentProps<typeof DrawerFooter>>
}

function SheetDrawerFooter({ drawer, ...props }: SheetDrawerFooterProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return <DrawerFooter {...toMobileProps(props, drawer)} />
  }
  return <SheetFooter {...props} />
}

type SheetDrawerTitleProps = React.ComponentProps<typeof SheetTitle> & {
  drawer?: Override<React.ComponentProps<typeof DrawerTitle>>
}

function SheetDrawerTitle({ drawer, ...props }: SheetDrawerTitleProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return <DrawerTitle {...toMobileProps(props, drawer)} />
  }
  return <SheetTitle {...props} />
}

type SheetDrawerDescriptionProps = React.ComponentProps<
  typeof SheetDescription
> & {
  drawer?: Override<React.ComponentProps<typeof DrawerDescription>>
}

function SheetDrawerDescription({
  drawer,
  ...props
}: SheetDrawerDescriptionProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return <DrawerDescription {...toMobileProps(props, drawer)} />
  }
  return <SheetDescription {...props} />
}

type SheetDrawerCloseProps = React.ComponentProps<typeof SheetClose> & {
  drawer?: Override<React.ComponentProps<typeof DrawerClose>>
}

function SheetDrawerClose({ drawer, ...props }: SheetDrawerCloseProps) {
  const { isMobile } = useSheetDrawer()

  if (isMobile) {
    return <DrawerClose {...toMobileProps(props, drawer)} />
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
  SheetDrawerCloseProps,
  SheetDrawerContentProps,
  SheetDrawerDescriptionProps,
  SheetDrawerFooterProps,
  SheetDrawerHeaderProps,
  SheetDrawerProps,
  SheetDrawerTitleProps,
  SheetDrawerTriggerProps,
}
