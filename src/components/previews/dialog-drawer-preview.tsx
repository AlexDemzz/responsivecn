import { useIsMobile } from "@/hooks/use-mobile"
import { buttonVariants } from "@/components/ui/button"
import {
  DialogDrawer,
  DialogDrawerClose,
  DialogDrawerContent,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
  DialogDrawerTrigger,
} from "../../../registry/base/dialog-drawer/dialog-drawer"

// Live preview for the DialogDrawer docs page. It renders the real registry
// component (Base UI side), so the preview swaps for real: the hook reads the
// window width, and the caption reflects the side currently rendered.
export function DialogDrawerPreview() {
  const isMobile = useIsMobile()

  return (
    <div className="not-prose flex flex-col items-center gap-4 rounded-xl border p-10">
      <DialogDrawer>
        <DialogDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Edit profile
        </DialogDrawerTrigger>
        <DialogDrawerContent>
          <DialogDrawerHeader>
            <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
            <DialogDrawerDescription>
              The same children render on both sides: a Dialog at 768px and up,
              a Drawer below.
            </DialogDrawerDescription>
          </DialogDrawerHeader>
          <form className="grid gap-4 p-4 md:p-0">
            <label
              className="grid gap-1.5 text-sm font-medium"
              htmlFor="dialog-drawer-preview-name"
            >
              Name
              <input
                id="dialog-drawer-preview-name"
                defaultValue="Pedro Duarte"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          </form>
          <DialogDrawerFooter>
            <DialogDrawerClose
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </DialogDrawerClose>
          </DialogDrawerFooter>
        </DialogDrawerContent>
      </DialogDrawer>
      <p className="text-xs text-muted-foreground">
        {isMobile
          ? "Below 768px — opens as a Drawer."
          : "At 768px and up — opens as a Dialog."}{" "}
        Resize the window across 768px and reopen to see the swap.
      </p>
    </div>
  )
}
