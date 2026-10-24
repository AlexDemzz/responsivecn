import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"

import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DESKTOP_WIDTH,
  MOBILE_WIDTH,
  resizeViewport,
  setViewportWidth,
} from "@/test/viewport"

import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverTrigger,
} from "./tooltip-popover"

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

describe("TooltipPopover", () => {
  afterEach(cleanup)

  it("renders the Tooltip with the shared className at desktop width", () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <TooltipProvider>
        <TooltipPopover defaultOpen>
          <TooltipPopoverTrigger
            className="shared"
            popover={{ className: "mobile" }}
          >
            Info
          </TooltipPopoverTrigger>
          <TooltipPopoverContent>
            Replies within 24 hours.
          </TooltipPopoverContent>
        </TooltipPopover>
      </TooltipProvider>
    )

    expect(slot("popover-trigger")).toBeNull()
    expect(slot("tooltip-trigger")!.className).toBe("shared")
    expect(slot("tooltip-content")!.textContent).toContain(
      "Replies within 24 hours."
    )
  })

  it("renders the Popover with merged classNames below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <TooltipPopover defaultOpen>
        <TooltipPopoverTrigger
          className="shared"
          popover={{ className: "mobile" }}
        >
          Info
        </TooltipPopoverTrigger>
        <TooltipPopoverContent>Replies within 24 hours.</TooltipPopoverContent>
      </TooltipPopover>
    )

    expect(slot("tooltip-trigger")).toBeNull()
    expect(slot("popover-trigger")!.className).toBe("shared mobile")
    expect(slot("popover-content")!.textContent).toBe(
      "Replies within 24 hours."
    )
  })

  it("keeps a disabled tooltip closed below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    const onOpenChange = vi.fn()
    render(
      <TooltipPopover disabled onOpenChange={onOpenChange}>
        <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
        <TooltipPopoverContent>Tip</TooltipPopoverContent>
      </TooltipPopover>
    )

    fireEvent.click(screen.getByText("Info"))

    expect(slot("popover-content")).toBeNull()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("keeps the popover closed but the button enabled for a disabled trigger below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    const onClick = vi.fn()
    render(
      <TooltipPopover>
        <TooltipPopoverTrigger disabled onClick={onClick}>
          Info
        </TooltipPopoverTrigger>
        <TooltipPopoverContent>Tip</TooltipPopoverContent>
      </TooltipPopover>
    )

    const trigger = screen.getByText("Info")
    fireEvent.click(trigger)

    expect(trigger.hasAttribute("disabled")).toBe(false)
    expect(onClick).toHaveBeenCalledOnce()
    expect(slot("popover-content")).toBeNull()
  })

  it("gives a non-button trigger button semantics below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <TooltipPopover>
        <TooltipPopoverTrigger render={<span />}>Info</TooltipPopoverTrigger>
        <TooltipPopoverContent>Tip</TooltipPopoverContent>
      </TooltipPopover>
    )

    const trigger = screen.getByText("Info")
    expect(trigger.tagName).toBe("SPAN")
    expect(trigger.getAttribute("role")).toBe("button")

    fireEvent.click(trigger)
    expect(slot("popover-content")).not.toBeNull()
  })

  it("keeps a controlled tooltip open across 768px in both directions", async () => {
    setViewportWidth(DESKTOP_WIDTH)
    render(
      <TooltipProvider>
        <TooltipPopover open>
          <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
          <TooltipPopoverContent>Tip</TooltipPopoverContent>
        </TooltipPopover>
      </TooltipProvider>
    )
    expect(slot("tooltip-content")).not.toBeNull()

    await act(async () => resizeViewport(MOBILE_WIDTH))
    expect(slot("popover-content")!.textContent).toBe("Tip")

    await act(async () => resizeViewport(DESKTOP_WIDTH))
    expect(slot("tooltip-content")!.textContent).toContain("Tip")
  })

  it("keeps an uncontrolled popover open when the viewport crosses 768px", async () => {
    setViewportWidth(MOBILE_WIDTH)
    render(
      <TooltipProvider>
        <TooltipPopover>
          <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
          <TooltipPopoverContent>Tip</TooltipPopoverContent>
        </TooltipPopover>
      </TooltipProvider>
    )

    fireEvent.click(screen.getByText("Info"))
    expect(slot("popover-content")).not.toBeNull()

    await act(async () => resizeViewport(DESKTOP_WIDTH))
    expect(slot("tooltip-content")!.textContent).toContain("Tip")
  })

  it("calls the shared onOpenChange, then the popover one, below 768px", () => {
    setViewportWidth(MOBILE_WIDTH)
    const calls: string[] = []
    render(
      <TooltipPopover
        onOpenChange={(open) => calls.push(`shared:${open}`)}
        popover={{ onOpenChange: (open) => calls.push(`popover:${open}`) }}
      >
        <TooltipPopoverTrigger>Info</TooltipPopoverTrigger>
        <TooltipPopoverContent>Tip</TooltipPopoverContent>
      </TooltipPopover>
    )

    fireEvent.click(screen.getByText("Info"))
    fireEvent.click(screen.getByText("Info"))

    expect(calls).toEqual([
      "shared:true",
      "popover:true",
      "shared:false",
      "popover:false",
    ])
  })
})
