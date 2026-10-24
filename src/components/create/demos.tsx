import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DialogDrawer,
  DialogDrawerClose,
  DialogDrawerContent,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
  DialogDrawerTrigger,
} from "../../../registry/dialog-drawer/dialog-drawer"
import {
  SheetDrawer,
  SheetDrawerClose,
  SheetDrawerContent,
  SheetDrawerDescription,
  SheetDrawerFooter,
  SheetDrawerHeader,
  SheetDrawerTitle,
  SheetDrawerTrigger,
} from "../../../registry/sheet-drawer/sheet-drawer"
import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "../../../registry/popover-drawer/popover-drawer"
import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
} from "../../../registry/tooltip-popover/tooltip-popover"
import type { PairSlug } from "./pairs"

// Live demos wired to the REAL registry components. They render inside the
// /preview iframe, so their use-mobile hook reads the iframe window — the
// canvas width on /create is the viewport that decides which side renders.
// Free-standing children (the fields) pad themselves per side: the mobile
// Drawer doesn't pad its children while the desktop counterparts do, and
// `md:` inside the iframe flips at the exact same 768px as the swap.

function Field({
  id,
  label,
  defaultValue,
}: {
  id: string
  label: string
  defaultValue: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        defaultValue={defaultValue}
        className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
    </div>
  )
}

function DialogDrawerDemo() {
  return (
    <DialogDrawer>
      <DialogDrawerTrigger render={<Button variant="outline" />}>
        Edit profile
      </DialogDrawerTrigger>
      <DialogDrawerContent>
        <DialogDrawerHeader>
          <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
          <DialogDrawerDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDrawerDescription>
        </DialogDrawerHeader>
        <div className="flex flex-col gap-4 p-4 md:p-0">
          <Field id="name" label="Name" defaultValue="Pedro Duarte" />
          <Field id="username" label="Username" defaultValue="@peduarte" />
        </div>
        <DialogDrawerFooter>
          <DialogDrawerClose render={<Button variant="outline" />}>
            Cancel
          </DialogDrawerClose>
          <DialogDrawerClose render={<Button />}>
            Save changes
          </DialogDrawerClose>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

function SheetDrawerDemo() {
  return (
    <SheetDrawer>
      <SheetDrawerTrigger render={<Button variant="outline" />}>
        Open sheet
      </SheetDrawerTrigger>
      <SheetDrawerContent side="right">
        <SheetDrawerHeader>
          <SheetDrawerTitle>Edit profile</SheetDrawerTitle>
          <SheetDrawerDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDrawerDescription>
        </SheetDrawerHeader>
        <div className="flex flex-col gap-4 p-4 md:py-0">
          <Field id="sheet-name" label="Name" defaultValue="Pedro Duarte" />
          <Field
            id="sheet-username"
            label="Username"
            defaultValue="@peduarte"
          />
        </div>
        <SheetDrawerFooter>
          <SheetDrawerClose render={<Button />}>Save changes</SheetDrawerClose>
        </SheetDrawerFooter>
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

function PopoverDrawerDemo() {
  return (
    <PopoverDrawer>
      <PopoverDrawerTrigger render={<Button variant="outline" />}>
        Open popover
      </PopoverDrawerTrigger>
      <PopoverDrawerContent className="w-80">
        <PopoverDrawerHeader>
          <PopoverDrawerTitle>Dimensions</PopoverDrawerTitle>
          <PopoverDrawerDescription>
            Set the dimensions for the layer.
          </PopoverDrawerDescription>
        </PopoverDrawerHeader>
        <div className="flex flex-col gap-3">
          {(
            [
              ["width", "Width", "100%"],
              ["height", "Height", "25px"],
            ] as const
          ).map(([id, label, defaultValue]) => (
            <div
              key={id}
              className="grid grid-cols-[4rem_1fr] items-center gap-2"
            >
              <label htmlFor={id} className="text-sm font-medium">
                {label}
              </label>
              <input
                id={id}
                defaultValue={defaultValue}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>
          ))}
        </div>
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

function TooltipPopoverDemo() {
  return (
    <TooltipProvider>
      <TooltipPopover>
        <TooltipPopoverTrigger render={<Button variant="outline" />}>
          Hover or tap
        </TooltipPopoverTrigger>
        <TooltipPopoverContent>
          <TooltipPopoverTitle>Response rate</TooltipPopoverTitle>
          <TooltipPopoverDescription>
            The share of messages you reply to within 24 hours.
          </TooltipPopoverDescription>
        </TooltipPopoverContent>
      </TooltipPopover>
    </TooltipProvider>
  )
}

const DEMOS: Record<PairSlug, () => React.JSX.Element> = {
  "dialog-drawer": DialogDrawerDemo,
  "sheet-drawer": SheetDrawerDemo,
  "popover-drawer": PopoverDrawerDemo,
  "tooltip-popover": TooltipPopoverDemo,
}

export function PairDemo({ slug }: { slug: PairSlug }) {
  const Demo = DEMOS[slug]
  return <Demo />
}
