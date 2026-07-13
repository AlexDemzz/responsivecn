import { useIsMobile } from "@/hooks/use-mobile"
import { buttonVariants } from "@/components/ui/button"
import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerDescription,
  PopoverDrawerFooter,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "../../../registry/base/popover-drawer/popover-drawer"

// Live preview for the PopoverDrawer docs page. It renders the real registry
// component (Base UI side): a filter popover with a Footer — the part that is
// a styled div at desktop and a real DrawerFooter below 768px.
export function PopoverDrawerPreview() {
  const isMobile = useIsMobile()

  return (
    <div className="not-prose flex flex-col items-center gap-4 rounded-xl border p-10">
      <PopoverDrawer>
        <PopoverDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Filters
        </PopoverDrawerTrigger>
        <PopoverDrawerContent>
          <PopoverDrawerHeader>
            <PopoverDrawerTitle>Filters</PopoverDrawerTitle>
            <PopoverDrawerDescription>
              Narrow down the results.
            </PopoverDrawerDescription>
          </PopoverDrawerHeader>
          <div className="grid gap-2 px-4 text-sm md:px-0">
            {["Open issues", "Assigned to me", "Has label"].map((label) => (
              <label key={label} className="flex items-center gap-2">
                <input type="checkbox" className="accent-primary" />
                {label}
              </label>
            ))}
          </div>
          <PopoverDrawerFooter>
            <button type="button" className={buttonVariants({ size: "sm" })}>
              Apply
            </button>
          </PopoverDrawerFooter>
        </PopoverDrawerContent>
      </PopoverDrawer>
      <p className="text-xs text-muted-foreground">
        {isMobile
          ? "Below 768px — opens as a modal Drawer (the Drawer's own default)."
          : "At 768px and up — opens as a non-modal anchored Popover."}{" "}
        Resize the window across 768px and reopen to see the swap.
      </p>
    </div>
  )
}
