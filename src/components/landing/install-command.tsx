import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export function InstallCommand({ command }: { command: string }) {
  const { copied, copy } = useCopyToClipboard()
  const isCopied = copied === command

  return (
    <div className="flex h-10 max-w-full items-center gap-1 rounded-lg border bg-muted/40 pr-1 pl-2.5 font-mono text-[11px] sm:pl-4 sm:text-[13px]">
      <code className="[scrollbar-width:none] overflow-x-auto py-2 whitespace-nowrap [&::-webkit-scrollbar]:hidden">
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
              "absolute inset-0 size-4 transition-[opacity,scale] duration-150 ease-out",
              isCopied ? "scale-75 opacity-0" : "scale-100 opacity-100"
            )}
          />
          <CheckIcon
            className={cn(
              "absolute inset-0 size-4 transition-[opacity,scale] duration-150 ease-out",
              isCopied ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )}
          />
        </span>
      </Button>
    </div>
  )
}
