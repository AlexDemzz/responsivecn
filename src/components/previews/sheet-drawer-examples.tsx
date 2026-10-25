import { buttonVariants } from "@/components/ui/button"
import { PreviewFrame } from "@/components/previews/preview-frame"
import {
  SheetDrawer,
  SheetDrawerClose,
  SheetDrawerContent,
  SheetDrawerDescription,
  SheetDrawerFooter,
  SheetDrawerHeader,
  SheetDrawerTitle,
  SheetDrawerTrigger,
} from "@/components/ui/sheet-drawer"

const PAGES = ["Dashboard", "Projects", "Members", "Settings"]

function MenuBody() {
  return (
    <>
      <SheetDrawerHeader>
        <SheetDrawerTitle>Workspace</SheetDrawerTitle>
        <SheetDrawerDescription>
          Go to any page in this workspace.
        </SheetDrawerDescription>
      </SheetDrawerHeader>
      <nav className="grid gap-1 px-4 text-sm">
        {PAGES.map((page) => (
          <button
            key={page}
            type="button"
            className="rounded-md px-3 py-2 text-left font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {page}
          </button>
        ))}
      </nav>
      <SheetDrawerFooter>
        <SheetDrawerClose className={buttonVariants({ variant: "outline" })}>
          Close
        </SheetDrawerClose>
      </SheetDrawerFooter>
    </>
  )
}

export function SheetDrawerLeftExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: a Sheet from the left edge."
      mobile="Below 768px: a Drawer from the left edge. Swipe left to close it."
    >
      <SheetDrawer>
        <SheetDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Open menu
        </SheetDrawerTrigger>
        <SheetDrawerContent side="left">
          <MenuBody />
        </SheetDrawerContent>
      </SheetDrawer>
    </PreviewFrame>
  )
}

export function SheetDrawerSwipeDownExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: a Sheet from the left edge."
      mobile="Below 768px: a Drawer from the bottom edge, set by the override."
    >
      <SheetDrawer drawer={{ swipeDirection: "down" }}>
        <SheetDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Open menu
        </SheetDrawerTrigger>
        <SheetDrawerContent side="left">
          <MenuBody />
        </SheetDrawerContent>
      </SheetDrawer>
    </PreviewFrame>
  )
}

export function SheetDrawerSizingExample() {
  return (
    <PreviewFrame
      desktop="At 768px and up: a wider Sheet from the right edge."
      mobile="Below 768px: a right Drawer at its own width, since it has no data-side."
    >
      <SheetDrawer>
        <SheetDrawerTrigger className={buttonVariants({ variant: "outline" })}>
          Open menu
        </SheetDrawerTrigger>
        <SheetDrawerContent
          side="right"
          className="data-[side=right]:sm:max-w-lg"
        >
          <MenuBody />
        </SheetDrawerContent>
      </SheetDrawer>
    </PreviewFrame>
  )
}
