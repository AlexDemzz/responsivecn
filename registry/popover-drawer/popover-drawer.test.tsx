import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { DESKTOP_WIDTH, MOBILE_WIDTH, setViewportWidth } from "@/test/viewport"

import {
  PopoverDrawer,
  PopoverDrawerContent,
  PopoverDrawerFooter,
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
        className="shared"
        drawer={{ className: "mobile" }}
      >
        <PopoverDrawerTitle>Title</PopoverDrawerTitle>
        <PopoverDrawerFooter className="footer">
          <button type="button">Apply</button>
        </PopoverDrawerFooter>
      </PopoverDrawerContent>
    </PopoverDrawer>
  )
}

describe("PopoverDrawer", () => {
  afterEach(cleanup)

  it("renders a Popover with a plain footer at desktop width", () => {
    setViewportWidth(DESKTOP_WIDTH)
    renderOpen()

    expect(slot("drawer-popup")).toBeNull()
    expect(slot("popover-content")!.className).not.toContain("mobile")
    expect(slot("popover-footer")!.className).toContain("footer")
  })

  it("renders a Drawer with the Drawer footer below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    const popup = slot("drawer-popup")!
    expect(popup.className).toContain("shared")
    expect(popup.className).toContain("mobile")
    expect(slot("drawer-footer")!.className).toContain("footer")
  })

  it("drops the anchor positioning props below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    const popup = slot("drawer-popup")!
    expect(popup.hasAttribute("side")).toBe(false)
    expect(popup.hasAttribute("align")).toBe(false)
  })
})
