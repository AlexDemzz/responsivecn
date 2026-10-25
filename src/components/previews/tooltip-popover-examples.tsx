import { InfoIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PreviewFrame } from "@/components/previews/preview-frame"
import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverTrigger,
} from "@/components/ui/tooltip-popover"

const iconTriggerClassName = buttonVariants({
  variant: "ghost",
  size: "icon-sm",
})

export function TooltipPopoverContentBoxExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: hover or focus the icon for a Tooltip."
      mobile="Below 768px: tap the icon for a Popover that opens on top and fits its text."
    >
      <TooltipProvider>
        <div className="flex items-center gap-1 text-sm">
          Storage used: 4.2 GB
          <TooltipPopover>
            <TooltipPopoverTrigger
              aria-label="About storage used"
              className={iconTriggerClassName}
            >
              <InfoIcon />
            </TooltipPopoverTrigger>
            <TooltipPopoverContent
              popover={{ className: "w-auto max-w-xs", side: "top" }}
            >
              Includes files in the trash.
            </TooltipPopoverContent>
          </TooltipPopover>
        </div>
      </TooltipProvider>
    </PreviewFrame>
  )
}

export function TooltipPopoverOverrideExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: a Tooltip. The override applies below 768px only."
      mobile="Below 768px: a modal Popover 8px below the button. Tap outside to close it."
    >
      <TooltipProvider>
        <TooltipPopover popover={{ modal: true }}>
          <TooltipPopoverTrigger
            className={buttonVariants({ variant: "outline" })}
          >
            Info
          </TooltipPopoverTrigger>
          <TooltipPopoverContent popover={{ side: "bottom", sideOffset: 8 }}>
            Drafts are saved every 30 seconds.
          </TooltipPopoverContent>
        </TooltipPopover>
      </TooltipProvider>
    </PreviewFrame>
  )
}

export function TooltipPopoverAriaLabelExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: screen readers announce the label, then the Tooltip."
      mobile="Below 768px: screen readers announce the label before anything opens."
    >
      <TooltipProvider>
        <div className="flex items-center gap-1 text-sm">
          Response rate: 98%
          <TooltipPopover>
            <TooltipPopoverTrigger
              aria-label="About response rate"
              className={iconTriggerClassName}
            >
              <InfoIcon />
            </TooltipPopoverTrigger>
            <TooltipPopoverContent>
              The share of messages you reply to within 24 hours.
            </TooltipPopoverContent>
          </TooltipPopover>
        </div>
      </TooltipProvider>
    </PreviewFrame>
  )
}
