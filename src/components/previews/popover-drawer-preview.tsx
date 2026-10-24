import { useIsMobile } from "@/hooks/use-mobile"
import { buttonVariants } from "@/components/ui/button"
import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "../../../registry/popover-drawer/popover-drawer"

const DIMENSIONS = [
  { id: "popover-drawer-preview-width", label: "Width", value: "100%" },
  { id: "popover-drawer-preview-height", label: "Height", value: "25px" },
]

// Live preview for the PopoverDrawer docs page. It renders the real registry
// component with the children of the shadcn Popover demo, unchanged: the
// Content pads them on both sides.
export function PopoverDrawerPreview() {
  const isMobile = useIsMobile()

  return (
    <div className="not-prose flex flex-col items-center gap-4 rounded-xl border p-10">
      <PopoverDrawer>
        <PopoverDrawerTrigger
          className={buttonVariants({ variant: "outline" })}
        >
          Open popover
        </PopoverDrawerTrigger>
        <PopoverDrawerContent className="w-80">
          <PopoverDrawerHeader>
            <PopoverDrawerTitle>Dimensions</PopoverDrawerTitle>
            <PopoverDrawerDescription>
              Set the dimensions for the layer.
            </PopoverDrawerDescription>
          </PopoverDrawerHeader>
          <div className="grid gap-2">
            {DIMENSIONS.map(({ id, label, value }) => (
              <div
                key={id}
                className="grid grid-cols-3 items-center gap-4 text-sm"
              >
                <label htmlFor={id} className="font-medium">
                  {label}
                </label>
                <input
                  id={id}
                  defaultValue={value}
                  className="col-span-2 h-8 rounded-md border border-input bg-transparent px-2.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            ))}
          </div>
        </PopoverDrawerContent>
      </PopoverDrawer>
      <p className="text-xs text-muted-foreground">
        {isMobile
          ? "Below 768px — opens as a modal Drawer."
          : "At 768px and up — opens as a non-modal anchored Popover."}{" "}
        Resize the window across 768px while it is open: it stays open on the
        other side.
      </p>
    </div>
  )
}
