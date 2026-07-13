// Harness stub — the real shadcn Button is pulled by the consumer. Only the
// dialog wrapper's Footer close button references it; a minimal typed stub is
// enough for the radix tree to typecheck. Not shipped by registry.json.
import * as React from "react"

function Button({
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & { variant?: string; size?: string }) {
  return <button {...props} />
}

export { Button }
