import { afterEach, describe, expect, it } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"

import {
  DESKTOP_WIDTH,
  MOBILE_WIDTH,
  resizeViewport,
  setViewportWidth,
} from "@/test/viewport"

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

  it("keeps an uncontrolled dialog open when the viewport crosses 768px", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <DialogDrawer>
        <DialogDrawerTrigger>Open</DialogDrawerTrigger>
        <DialogDrawerContent>
          <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
        </DialogDrawerContent>
      </DialogDrawer>
    )

    fireEvent.click(screen.getByText("Open"))
    expect(await screen.findByText("Edit profile")).toBeTruthy()
    expect(slot("dialog-content")).not.toBeNull()

    await act(async () => resizeViewport(MOBILE_WIDTH))

    expect(slot("drawer-title")!.textContent).toBe("Edit profile")
  })

  it("stays closed when the shared onOpenChange cancels the change", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <DialogDrawer onOpenChange={(_open, details) => details.cancel()}>
        <DialogDrawerTrigger>Open</DialogDrawerTrigger>
        <DialogDrawerContent>
          <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
        </DialogDrawerContent>
      </DialogDrawer>
    )

    fireEvent.click(screen.getByText("Open"))
    await act(async () => {})

    expect(slot("dialog-content")).toBeNull()
  })

  it("renders the Footer close button below 768px, and it closes the drawer", async () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <DialogDrawer defaultOpen>
        <DialogDrawerContent>
          <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
          <DialogDrawerFooter showCloseButton>
            <button type="submit">Save</button>
          </DialogDrawerFooter>
        </DialogDrawerContent>
      </DialogDrawer>
    )

    const footer = slot("drawer-footer")!
    const close = screen.getByRole("button", { name: "Close" })
    expect(footer.contains(close)).toBe(true)
    expect(footer.lastElementChild).toBe(close)

    await act(async () => close.click())

    expect(slot("drawer-popup")?.hasAttribute("data-open") ?? false).toBe(false)
  })

  it("renders no Footer close button by default below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <DialogDrawer defaultOpen>
        <DialogDrawerContent>
          <DialogDrawerTitle>Edit profile</DialogDrawerTitle>
          <DialogDrawerFooter>
            <button type="submit">Save</button>
          </DialogDrawerFooter>
        </DialogDrawerContent>
      </DialogDrawer>
    )

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })
})
