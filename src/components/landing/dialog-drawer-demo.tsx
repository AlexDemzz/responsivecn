import { Button } from "@/components/ui/button"
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

// The landing hero demo: a real DialogDrawer straight from the registry.
// `drawer={{ showSwipeHandle: true }}` doubles as a live example of the
// override prop.
export function DialogDrawerDemo() {
  return (
    <DialogDrawer drawer={{ showSwipeHandle: true }}>
      <DialogDrawerTrigger render={<Button size="lg" />}>
        Open a DialogDrawer
      </DialogDrawerTrigger>
      <DialogDrawerContent>
        <DialogDrawerHeader>
          <DialogDrawerTitle>One component, two overlays</DialogDrawerTitle>
          <DialogDrawerDescription>
            At 768px and above this is the shadcn Dialog. Below, the same
            &lt;DialogDrawer /&gt; renders a swipeable bottom Drawer instead —
            resize the window and open it again.
          </DialogDrawerDescription>
        </DialogDrawerHeader>
        <DialogDrawerFooter className="pt-4">
          <DialogDrawerClose render={<Button variant="outline" />}>
            Got it
          </DialogDrawerClose>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}
