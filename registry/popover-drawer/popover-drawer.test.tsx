import { afterEach, describe, expect, it } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"

import {
  DESKTOP_WIDTH,
  MOBILE_WIDTH,
  resizeViewport,
  setViewportWidth,
} from "@/test/viewport"

import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerFooter,
  PopoverDrawerHeader,
  PopoverDrawerTitle,
  PopoverDrawerTrigger,
} from "./popover-drawer"

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

function renderOpen() {
  return render(
    <PopoverDrawer defaultOpen>
      <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
      <PopoverDrawerContent
        side="top"
        align="start"
        className="w-80"
        drawer={{ className: "max-h-[80dvh]" }}
      >
        <PopoverDrawerHeader className="header">
          <PopoverDrawerTitle>Title</PopoverDrawerTitle>
        </PopoverDrawerHeader>
        <PopoverDrawerFooter className="footer">
          <button type="button">Apply</button>
        </PopoverDrawerFooter>
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

describe("PopoverDrawer", () => {
  afterEach(cleanup)

  it("renders the Popover with the shared className at desktop width", () => {
    setViewportWidth(DESKTOP_WIDTH)
    renderOpen()

    expect(slot("drawer-popup")).toBeNull()
    const content = slot("popover-content")!
    expect(content.className).toContain("w-80")
    expect(content.className).not.toContain("max-h-[80dvh]")
    expect(slot("popover-footer")!.className).toContain("footer")
  })

  it("puts the shared className on the content box, not the drawer, below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    const popup = slot("drawer-popup")!
    expect(popup.className).toContain("max-h-[80dvh]")
    expect(popup.className).not.toContain("w-80")

    const body = slot("popover-drawer-body")!
    expect(body.className).toContain("w-80")
    expect(popup.contains(body)).toBe(true)
    expect(body.contains(slot("drawer-header"))).toBe(true)
    expect(body.contains(slot("drawer-footer"))).toBe(true)
  })

  it("drops the anchor positioning props below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    const popup = slot("drawer-popup")!
    expect(popup.hasAttribute("side")).toBe(false)
    expect(popup.hasAttribute("align")).toBe(false)
  })

  it("keeps an uncontrolled popover open when the viewport crosses 768px", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <PopoverDrawer>
        <PopoverDrawerTrigger>Open</PopoverDrawerTrigger>
        <PopoverDrawerContent>
          <PopoverDrawerTitle>Filters</PopoverDrawerTitle>
        </PopoverDrawerContent>
      </PopoverDrawer>
    )

    fireEvent.click(screen.getByText("Open"))
    expect(await screen.findByText("Filters")).toBeTruthy()
    expect(slot("popover-content")).not.toBeNull()

    await act(async () => resizeViewport(MOBILE_WIDTH))

    expect(slot("drawer-popup")).not.toBeNull()
    expect(slot("drawer-title")!.textContent).toBe("Filters")
  })
})
