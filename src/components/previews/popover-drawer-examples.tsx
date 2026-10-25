import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import {
  PreviewFrame,
  previewInputClassName,
} from "@/components/previews/preview-frame"
import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerFooter,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "@/components/ui/popover-drawer"

const STATUSES = ["Open", "In review", "Closed"]

function StatusFilters({ idPrefix }: { idPrefix: string }) {
  return (
    <fieldset className="grid gap-2 text-sm">
      <legend className="mb-2 font-medium">Status</legend>
      {STATUSES.map((status) => {
        const id = `${idPrefix}-${status}`
        return (
          <label key={status} htmlFor={id} className="flex items-center gap-2">
            <input
              id={id}
              type="checkbox"
              defaultChecked={status !== "Closed"}
              className="size-4 accent-primary"
            />
            {status}
          </label>
        )
      })}
    </fieldset>
  )
}

export function PopoverDrawerContentBoxExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: a 320px Popover."
      mobile="Below 768px: the w-80 box sits centered in a full-width Drawer."
    >
      <PopoverDrawer>
        <PopoverDrawerTrigger
          className={buttonVariants({ variant: "outline" })}
        >
          Share
        </PopoverDrawerTrigger>
        <PopoverDrawerContent
          className="w-80"
          drawer={{ className: "max-h-[80dvh]" }}
        >
          <PopoverDrawerHeader>
            <PopoverDrawerTitle>Share link</PopoverDrawerTitle>
            <PopoverDrawerDescription>
              Anyone with the link can view this page.
            </PopoverDrawerDescription>
          </PopoverDrawerHeader>
          <label htmlFor="popover-drawer-content-box-link" className="sr-only">
            Link
          </label>
          <input
            id="popover-drawer-content-box-link"
            readOnly
            defaultValue="https://example.com/p/4f2a"
            className={previewInputClassName}
          />
        </PopoverDrawerContent>
      </PopoverDrawer>
    </PreviewFrame>
  )
}

export function PopoverDrawerNonModalExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: the Popover keeps its non-modal default."
      mobile="Below 768px: a Drawer with no overlay, so the page behind stays usable."
    >
      <PopoverDrawer drawer={{ modal: false }}>
        <PopoverDrawerTrigger
          className={buttonVariants({ variant: "outline" })}
        >
          Notifications
        </PopoverDrawerTrigger>
        <PopoverDrawerContent>
          <PopoverDrawerHeader>
            <PopoverDrawerTitle>Notifications</PopoverDrawerTitle>
            <PopoverDrawerDescription>
              You have no unread notifications.
            </PopoverDrawerDescription>
          </PopoverDrawerHeader>
        </PopoverDrawerContent>
      </PopoverDrawer>
    </PreviewFrame>
  )
}

export function PopoverDrawerFooterExample() {
  const [open, setOpen] = React.useState(false)

  return (
    <PreviewFrame
      desktop="At 768px and up: Apply sits at the end of a row and closes the Popover."
      mobile="Below 768px: Apply sits in the Drawer footer and closes the Drawer."
    >
      <PopoverDrawer open={open} onOpenChange={setOpen}>
        <PopoverDrawerTrigger
          className={buttonVariants({ variant: "outline" })}
        >
          Filters
        </PopoverDrawerTrigger>
        <PopoverDrawerContent>
          <PopoverDrawerHeader>
            <PopoverDrawerTitle>Filters</PopoverDrawerTitle>
            <PopoverDrawerDescription>
              Show only the issues you need.
            </PopoverDrawerDescription>
          </PopoverDrawerHeader>
          <StatusFilters idPrefix="popover-drawer-footer" />
          <PopoverDrawerFooter>
            <button
              type="button"
              className={buttonVariants()}
              onClick={() => setOpen(false)}
            >
              Apply
            </button>
          </PopoverDrawerFooter>
        </PopoverDrawerContent>
      </PopoverDrawer>
    </PreviewFrame>
  )
}

export function PopoverDrawerHiddenTitleExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: the hidden title names the Popover."
      mobile="Below 768px: the hidden title names the Drawer for screen readers."
    >
      <PopoverDrawer>
        <PopoverDrawerTrigger
          className={buttonVariants({ variant: "outline" })}
        >
          Filters
        </PopoverDrawerTrigger>
        <PopoverDrawerContent>
          <PopoverDrawerTitle className="sr-only">Filters</PopoverDrawerTitle>
          <StatusFilters idPrefix="popover-drawer-hidden-title" />
        </PopoverDrawerContent>
      </PopoverDrawer>
    </PreviewFrame>
  )
}
