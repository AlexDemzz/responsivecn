import { useIsMobile } from "@/hooks/use-mobile"
import { buttonVariants } from "@/components/ui/button"
import {
  DialogDrawer,
  DialogDrawerContent,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
  DialogDrawerTrigger,
} from "../../../registry/dialog-drawer/dialog-drawer"

export function DialogDrawerPreview() {
  const isMobile = useIsMobile()

  return (
    <div className="not-prose flex flex-col items-center gap-4 rounded-xl border p-10">
      <DialogDrawer>
        <DialogDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Edit profile
        </DialogDrawerTrigger>
        <DialogDrawerContent
          className="sm:max-w-sm"
          drawer={{ className: "max-w-none" }}
        >
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
          <DialogDrawerFooter showCloseButton />
        </DialogDrawerContent>
      </DialogDrawer>
      <p className="text-xs text-muted-foreground">
        {isMobile
          ? "Below 768px — opens as a Drawer."
          : "At 768px and up — opens as a Dialog."}{" "}
        Resize the window across 768px while it is open: it stays open on the
        other side.
      </p>
    </div>
  )
}
