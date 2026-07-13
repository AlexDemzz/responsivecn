import { InfoIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { buttonVariants } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
} from "../../../registry/base/tooltip-popover/tooltip-popover"

// Live preview for the TooltipPopover docs page. It renders the real registry
// component (Base UI side): an icon-button infotip — hover Tooltip at desktop,
// press-to-open Popover below 768px, where hover does not exist. The
// TooltipProvider wrapper is the app-level shadcn convention.
export function TooltipPopoverPreview() {
  const isMobile = useIsMobile()

  return (
    <div className="not-prose flex flex-col items-center gap-4 rounded-xl border p-10">
      <TooltipProvider>
        <div className="flex items-center gap-1 text-sm">
          Response rate: 98%
          <TooltipPopover>
            <TooltipPopoverTrigger
              aria-label="About response rate"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <InfoIcon />
            </TooltipPopoverTrigger>
            <TooltipPopoverContent>
              <TooltipPopoverTitle>Response rate</TooltipPopoverTitle>
              <TooltipPopoverDescription>
                The share of messages you reply to within 24 hours.
              </TooltipPopoverDescription>
            </TooltipPopoverContent>
          </TooltipPopover>
        </div>
      </TooltipProvider>
      <p className="text-xs text-muted-foreground">
        {isMobile
          ? "Below 768px — tap the icon to open a Popover (hover does not exist on touch)."
          : "At 768px and up — hover or focus the icon for a Tooltip."}{" "}
        Resize the window across 768px to see the swap.
      </p>
    </div>
  )
}
