import { afterEach, describe, expect, it } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"

import {
  DESKTOP_WIDTH,
  MOBILE_WIDTH,
  resizeViewport,
  setViewportWidth,
} from "@/test/viewport"

import {
  SheetDrawer,
  SheetDrawerContent,
  SheetDrawerTitle,
  SheetDrawerTrigger,
} from "./sheet-drawer"

type Side = "top" | "right" | "bottom" | "left"

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

const swipeDirection = () =>
  slot("drawer-popup")!.getAttribute("data-swipe-direction")

function renderOpen(side?: Side) {
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

function SettingsPanel({ side }: { side: Side }) {
  return (
    <SheetDrawerContent side={side}>
      <SheetDrawerTitle>Settings</SheetDrawerTitle>
    </SheetDrawerContent>
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

    expect(swipeDirection()).toBe("left")
    const popup = slot("drawer-popup")!
    expect(popup.className).toContain("shared")
    expect(popup.className).toContain("mobile")
  })

  it("keeps the Drawer's own bottom edge when no side is given", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    expect(swipeDirection()).toBe("down")
  })

  it("does not leak the desktop side onto the Drawer element", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen("top")

    expect(slot("drawer-popup")!.hasAttribute("side")).toBe(false)
  })

  it("reads the side from a Content rendered by the user's own component", () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <SheetDrawer defaultOpen>
        <SettingsPanel side="top" />
      </SheetDrawer>
    )

    expect(swipeDirection()).toBe("up")
  })

  it("reads the side from a Content inside a Fragment", () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <SheetDrawer defaultOpen>
        <>
          <SheetDrawerContent side="left">
            <SheetDrawerTitle>Menu</SheetDrawerTitle>
          </SheetDrawerContent>
        </>
      </SheetDrawer>
    )

    expect(swipeDirection()).toBe("left")
  })

  it("lets drawer={{ swipeDirection }} win over the side", () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <SheetDrawer defaultOpen drawer={{ swipeDirection: "down" }}>
        <SettingsPanel side="left" />
      </SheetDrawer>
    )

    expect(swipeDirection()).toBe("down")
  })

  it("keeps an uncontrolled sheet open when the viewport crosses 768px", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <SheetDrawer>
        <SheetDrawerTrigger>Open</SheetDrawerTrigger>
        <SettingsPanel side="right" />
      </SheetDrawer>
    )

    fireEvent.click(screen.getByText("Open"))
    expect(await screen.findByText("Settings")).toBeTruthy()
    expect(slot("sheet-content")).not.toBeNull()

    await act(async () => resizeViewport(MOBILE_WIDTH))

    expect(slot("drawer-title")!.textContent).toBe("Settings")
    expect(swipeDirection()).toBe("right")
  })

  it("stays closed when the shared onOpenChange cancels the change", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <SheetDrawer onOpenChange={(_open, details) => details.cancel()}>
        <SheetDrawerTrigger>Open</SheetDrawerTrigger>
        <SettingsPanel side="right" />
      </SheetDrawer>
    )

    fireEvent.click(screen.getByText("Open"))
    await act(async () => {})

    expect(slot("sheet-content")).toBeNull()
  })
})
