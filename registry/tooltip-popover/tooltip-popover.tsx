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

const TooltipPopoverContext = React.createContext<{ isMobile: boolean } | null>(
  null
)

function useTooltipPopover() {
  const context = React.useContext(TooltipPopoverContext)

  if (!context) {
    throw new Error(
      "TooltipPopover parts must be used within a TooltipPopover."
    )
  }

  return context
}

type TooltipPopoverProps = Omit<
  React.ComponentProps<typeof Tooltip>,
  "handle" | "triggerId" | "defaultTriggerId"
> & {
  popover?: Override<React.ComponentProps<typeof Popover>>
}

function TooltipPopover({ popover, children, ...props }: TooltipPopoverProps) {
  const isMobile = useIsMobile()
  const contextValue = React.useMemo(() => ({ isMobile }), [isMobile])

  return (
    <TooltipPopoverContext.Provider value={contextValue}>
      {isMobile ? (
        <Popover {...toMobileRootProps(props, popover)}>{children}</Popover>
      ) : (
        <Tooltip {...props}>{children}</Tooltip>
      )}
    </TooltipPopoverContext.Provider>
  )
}

type TooltipPopoverTriggerProps = Omit<
  React.ComponentProps<typeof TooltipTrigger>,
  "handle" | "popover"
> & {
  popover?: Override<React.ComponentProps<typeof PopoverTrigger>>
}

function TooltipPopoverTrigger({
  popover,
  ...props
}: TooltipPopoverTriggerProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return <PopoverTrigger {...toMobileProps(props, popover)} />
  }
  return <TooltipTrigger {...props} />
}

type TooltipPopoverContentProps = Omit<
  React.ComponentProps<typeof TooltipContent>,
  "popover"
> & {
  popover?: Override<React.ComponentProps<typeof PopoverContent>>
}

function TooltipPopoverContent({
  popover,
  children,
  ...props
}: TooltipPopoverContentProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return (
      <PopoverContent {...toMobileProps(props, popover)}>
        {children}
      </PopoverContent>
    )
  }
  return <TooltipContent {...props}>{children}</TooltipContent>
}

type TooltipPopoverTitleProps = Omit<React.ComponentProps<"div">, "popover"> & {
  popover?: Override<React.ComponentProps<typeof PopoverTitle>>
}

function TooltipPopoverTitle({
  popover,
  className,
  ...props
}: TooltipPopoverTitleProps) {
  const { isMobile } = useTooltipPopover()

  if (isMobile) {
    return <PopoverTitle {...toMobileProps({ className, ...props }, popover)} />
  }
  return (
    <div
      data-slot="tooltip-popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

type TooltipPopoverDescriptionProps = Omit<
  React.ComponentProps<"div">,
  "popover"
> & {
  popover?: Override<React.ComponentProps<typeof PopoverDescription>>
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
        {...toMobileProps({ className, ...props }, popover)}
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
  TooltipPopoverDescriptionProps,
  TooltipPopoverProps,
  TooltipPopoverTitleProps,
  TooltipPopoverTriggerProps,
}
