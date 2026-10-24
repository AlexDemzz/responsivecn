import type * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ICON_CLASS =
  "absolute inset-0 size-full transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-opacity"
const SHOWN = "scale-100 opacity-100 blur-none"
const HIDDEN =
  "scale-25 opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none"

export function CopyStateIcon({
  copied,
  className,
  ...props
}: React.ComponentProps<"span"> & { copied: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("relative size-4 shrink-0", className)}
      {...props}
    >
      <CopyIcon className={cn(ICON_CLASS, copied ? HIDDEN : SHOWN)} />
      <CheckIcon className={cn(ICON_CLASS, copied ? SHOWN : HIDDEN)} />
    </span>
  )
}

// Rendered empty first, outside the button, so screen readers announce the
// text when it appears.
export function CopyStatus({ copied }: { copied: boolean }) {
  return (
    <span role="status" className="sr-only">
      {copied ? "Copied" : ""}
    </span>
  )
}
