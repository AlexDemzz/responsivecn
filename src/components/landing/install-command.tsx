import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export function InstallCommand({
  command,
  className,
}: {
  command: string
  className?: string
}) {
  const { copied, copy } = useCopyToClipboard()
  const isCopied = copied === command

  return (
    <div
      className={cn(
        "flex h-10 min-w-0 items-center gap-1 rounded-lg bg-muted ps-3.5 pe-1 font-mono text-sm",
        className
      )}
    >
      <code className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto py-2 whitespace-nowrap">
        {command}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isCopied ? "Copied" : "Copy install command"}
        onClick={() => copy(command)}
      >
        <span className="relative size-4">
          <CopyIcon
            className={cn(
              "absolute inset-0 transition-[opacity,scale] duration-150 ease-out",
              isCopied ? "scale-75 opacity-0" : "scale-100 opacity-100"
            )}
          />
          <CheckIcon
            className={cn(
              "absolute inset-0 transition-[opacity,scale] duration-150 ease-out",
              isCopied ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )}
          />
        </span>
      </Button>
    </div>
  )
}
