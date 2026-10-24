import { afterEach, describe, expect, it } from "vitest"
import { act, cleanup, render } from "@testing-library/react"

import { DESKTOP_WIDTH, MOBILE_WIDTH, setViewportWidth } from "@/test/viewport"

import {
  DialogDrawer,
  DialogDrawerClose,
  DialogDrawerContent,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerTitle,
  DialogDrawerTrigger,
} from "./dialog-drawer"

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

function renderOpen(props: React.ComponentProps<typeof DialogDrawer> = {}) {
  return render(
    <DialogDrawer defaultOpen {...props}>
      <DialogDrawerTrigger
        className="shared-trigger"
        drawer={{ className: "drawer-trigger" }}
      >
        Open
      </DialogDrawerTrigger>
      <DialogDrawerContent
        className="shared-content"
        showCloseButton={false}
        drawer={{ className: "drawer-content" }}
      >
        <DialogDrawerTitle>Title</DialogDrawerTitle>
        <DialogDrawerDescription>Description</DialogDrawerDescription>
        <DialogDrawerFooter showCloseButton={false}>
          <DialogDrawerClose>Close</DialogDrawerClose>
        </DialogDrawerFooter>
      </DialogDrawerContent>
    </DialogDrawer>
  )
}

describe("DialogDrawer", () => {
  afterEach(cleanup)

  it("renders a Dialog at desktop width, with the shared className only", () => {
    setViewportWidth(DESKTOP_WIDTH)
    renderOpen()

    expect(slot("drawer-popup")).toBeNull()
    const content = slot("dialog-content")!
    expect(content.className).toContain("shared-content")
    expect(content.className).not.toContain("drawer-content")
  })

  it("renders a Drawer below 768px, merging the shared and drawer classNames", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    expect(slot("dialog-content")).toBeNull()
    const popup = slot("drawer-popup")!
    expect(popup.className).toContain("shared-content")
    expect(popup.className).toContain("drawer-content")
    expect(slot("drawer-trigger")!.className).toBe(
      "shared-trigger drawer-trigger"
    )
  })

  it("runs the shared onOpenChange first, then the drawer one, below 768px", async () => {
    setViewportWidth(MOBILE_WIDTH)
    const calls: string[] = []
    renderOpen({
      onOpenChange: (open) => calls.push(`shared:${open}`),
      drawer: { onOpenChange: (open) => calls.push(`drawer:${open}`) },
    })

    await act(async () => slot("drawer-close")!.click())

    expect(calls).toEqual(["shared:false", "drawer:false"])
  })

  it("ignores the drawer onOpenChange at desktop width", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    const calls: string[] = []
    renderOpen({
      onOpenChange: (open) => calls.push(`shared:${open}`),
      drawer: { onOpenChange: (open) => calls.push(`drawer:${open}`) },
    })

    await act(async () => slot("dialog-close")!.click())

    expect(calls).toEqual(["shared:false"])
  })
})
