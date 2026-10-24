import { useIsMobile } from "@/hooks/use-mobile"
import { buttonVariants } from "@/components/ui/button"
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

// Live preview for the SheetDrawer docs page. It renders the real registry
// component with an explicit side="right", so the preview also
// demonstrates the side→swipeDirection mapping: a right Sheet at desktop, a
// right-anchored Drawer below 768px.
export function SheetDrawerPreview() {
  const isMobile = useIsMobile()

  return (
    <div className="not-prose flex flex-col items-center gap-4 rounded-xl border p-10">
      <SheetDrawer>
        <SheetDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Open menu
        </SheetDrawerTrigger>
        <SheetDrawerContent side="right">
          <SheetDrawerHeader>
            <SheetDrawerTitle>Workspace</SheetDrawerTitle>
            <SheetDrawerDescription>
              The explicit side=&quot;right&quot; also anchors the mobile Drawer
              to the right.
            </SheetDrawerDescription>
          </SheetDrawerHeader>
          <nav className="grid gap-1 px-4 text-sm">
            {["Dashboard", "Projects", "Members", "Settings"].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-md px-3 py-2 text-left font-medium hover:bg-accent hover:text-accent-foreground"
              >
                {item}
              </button>
            ))}
          </nav>
          <SheetDrawerFooter>
            <SheetDrawerClose
              className={buttonVariants({ variant: "outline" })}
            >
              Close
            </SheetDrawerClose>
          </SheetDrawerFooter>
        </SheetDrawerContent>
      </SheetDrawer>
      <p className="text-xs text-muted-foreground">
        {isMobile
          ? "Below 768px — opens as a right-anchored Drawer (side mapped to swipeDirection)."
          : "At 768px and up — opens as a Sheet from the right."}{" "}
        Resize the window across 768px and reopen to see the swap.
      </p>
    </div>
  )
}
