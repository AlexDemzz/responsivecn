import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { DESKTOP_WIDTH, MOBILE_WIDTH, setViewportWidth } from "@/test/viewport"

import {
  SheetDrawer,
  SheetDrawerContent,
  SheetDrawerTitle,
} from "./sheet-drawer"

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

function renderOpen(side?: "top" | "right" | "bottom" | "left") {
  return render(
    <SheetDrawer defaultOpen>
      <SheetDrawerContent
        side={side}
        className="shared"
        drawer={{ className: "mobile" }}
      >
        <SheetDrawerTitle>Title</SheetDrawerTitle>
      </SheetDrawerContent>
    </SheetDrawer>
  )
}

describe("SheetDrawer", () => {
  afterEach(cleanup)

  it("renders a Sheet from the given side at desktop width", () => {
    setViewportWidth(DESKTOP_WIDTH)
    renderOpen("left")

    expect(slot("drawer-popup")).toBeNull()
    expect(slot("sheet-content")!.getAttribute("data-side")).toBe("left")
  })

  it("anchors the Drawer to the Sheet's explicit side below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen("left")

    const popup = slot("drawer-popup")!
    expect(popup.getAttribute("data-swipe-direction")).toBe("left")
    expect(popup.className).toContain("shared")
    expect(popup.className).toContain("mobile")
  })

  it("keeps the Drawer's own bottom edge when no side is given", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    expect(slot("drawer-popup")!.getAttribute("data-swipe-direction")).toBe(
      "down"
    )
  })

  it("does not leak the desktop side onto the Drawer element", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen("top")

    expect(slot("drawer-popup")!.hasAttribute("side")).toBe(false)
  })
})
