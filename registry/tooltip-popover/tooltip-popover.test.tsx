import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"

import { DESKTOP_WIDTH, MOBILE_WIDTH, setViewportWidth } from "@/test/viewport"

import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverDescription,
  TooltipPopoverTitle,
  TooltipPopoverTrigger,
} from "./tooltip-popover"

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

function renderOpen() {
  return render(
    <TooltipPopover defaultOpen>
      <TooltipPopoverTrigger
        className="shared"
        popover={{ className: "mobile" }}
      >
        Info
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <TooltipPopoverTitle className="title">
          Response rate
        </TooltipPopoverTitle>
        <TooltipPopoverDescription>
          Replies within 24 hours.
        </TooltipPopoverDescription>
      </TooltipPopoverContent>
    </TooltipPopover>
  )
}

describe("TooltipPopover", () => {
  afterEach(cleanup)

  it("renders a Tooltip with plain title and description at desktop width", () => {
    setViewportWidth(DESKTOP_WIDTH)
    renderOpen()

    expect(slot("popover-trigger")).toBeNull()
    expect(slot("tooltip-trigger")!.className).toBe("shared")
    expect(slot("tooltip-popover-title")!.className).toContain("title")
    expect(slot("tooltip-popover-description")!.textContent).toBe(
      "Replies within 24 hours."
    )
  })

  it("renders a Popover with real title and description below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    renderOpen()

    expect(slot("tooltip-trigger")).toBeNull()
    expect(slot("popover-trigger")!.className).toBe("shared mobile")
    expect(slot("popover-title")!.className).toContain("title")
    expect(slot("popover-description")!.textContent).toBe(
      "Replies within 24 hours."
    )
  })
})
