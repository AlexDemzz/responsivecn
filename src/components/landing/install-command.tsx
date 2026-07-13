import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false)
  const resetTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => () => clearTimeout(resetTimer.current), [])

  function copy() {
    void navigator.clipboard.writeText(command).then(() => {
      setCopied(true)
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex h-10 max-w-full items-center gap-1 rounded-lg border bg-muted/40 pr-1 pl-2.5 font-mono text-[11px] sm:pl-4 sm:text-[13px]">
      <code className="[scrollbar-width:none] overflow-x-auto py-2 whitespace-nowrap [&::-webkit-scrollbar]:hidden">
        {command}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={copied ? "Copied" : "Copy install command"}
        onClick={copy}
      >
        <span className="relative size-4">
          <CopyIcon
            className={cn(
              "absolute inset-0 size-4 transition-[opacity,scale] duration-150 ease-out",
              copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
            )}
          />
          <CheckIcon
            className={cn(
              "absolute inset-0 size-4 transition-[opacity,scale] duration-150 ease-out",
              copied ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )}
          />
        </span>
      </Button>
    </div>
  )
}
