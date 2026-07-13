import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

// A demo block shared by every component page: the real registry component in a
// bordered box with a copy button, and its userland code collapsed below. The
// code lives in the DOM even while collapsed so the copy button can read it.
type ComponentDemoContextValue = {
  codeRef: React.RefObject<HTMLDivElement | null>
  expanded: boolean
  toggle: () => void
}

const ComponentDemoContext =
  React.createContext<ComponentDemoContextValue | null>(null)

function useComponentDemo() {
  const context = React.useContext(ComponentDemoContext)
  if (!context) {
    throw new Error("ComponentDemo parts must be used within <ComponentDemo>")
  }
  return context
}

const COPY_KEY = "component-demo"

function ComponentDemo({ className, ...props }: React.ComponentProps<"div">) {
  const codeRef = React.useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = React.useState(false)
  const value = React.useMemo(
    () => ({ codeRef, expanded, toggle: () => setExpanded((open) => !open) }),
    [expanded],
  )

  return (
    <ComponentDemoContext.Provider value={value}>
      <div
        data-slot="component-demo"
        className={cn("not-prose my-6 flex flex-col gap-2", className)}
        {...props}
      />
    </ComponentDemoContext.Provider>
  )
}

function ComponentDemoRender({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { codeRef } = useComponentDemo()
  const { copied, copy } = useCopyToClipboard()

  return (
    <div
      data-slot="component-demo-render"
      className={cn("relative", className)}
      {...props}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={copied === COPY_KEY ? "Copied" : "Copy code"}
        className="absolute top-3 right-3 z-10 text-muted-foreground"
        onClick={() => copy(codeRef.current?.textContent ?? "", COPY_KEY)}
      >
        {copied === COPY_KEY ? <CheckIcon /> : <CopyIcon />}
      </Button>
      {children}
    </div>
  )
}

function ComponentDemoCode({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { codeRef, expanded, toggle } = useComponentDemo()

  return (
    <div
      data-slot="component-demo-code-wrapper"
      className="flex flex-col items-start gap-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={expanded}
        onClick={toggle}
        className="text-muted-foreground"
      >
        {expanded ? "Collapse code" : "Expand code"}
      </Button>
      <div
        ref={codeRef}
        data-slot="component-demo-code"
        hidden={!expanded}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

export { ComponentDemo, ComponentDemoRender, ComponentDemoCode }
