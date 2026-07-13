import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"

import {
  ComponentDemo,
  ComponentDemoCode,
  ComponentDemoRender,
} from "./component-demo"

const CODE = 'import { DialogDrawer } from "@/components/ui/dialog-drawer"'

function setup() {
  return render(
    <ComponentDemo>
      <ComponentDemoRender>
        <button type="button">Edit profile</button>
      </ComponentDemoRender>
      <ComponentDemoCode>
        <pre>{CODE}</pre>
      </ComponentDemoCode>
    </ComponentDemo>,
  )
}

const codeRegion = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="component-demo-code"]')!

describe("ComponentDemo", () => {
  afterEach(cleanup)

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it("renders the preview child", () => {
    setup()
    expect(screen.getByRole("button", { name: "Edit profile" })).toBeTruthy()
  })

  it("keeps the code in the DOM but hidden until expanded", () => {
    const { container } = setup()
    const region = codeRegion(container)

    // Present (so it can be copied) but collapsed.
    expect(region.textContent).toContain(CODE)
    expect(region.hidden).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: /expand code/i }))
    expect(region.hidden).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: /collapse code/i }))
    expect(region.hidden).toBe(true)
  })

  it("copies the full code text to the clipboard while still collapsed", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CODE)
  })

  it("exposes copy and expand as accessible, labeled buttons", () => {
    setup()
    const copy = screen.getByRole("button", { name: /copy code/i })
    const expand = screen.getByRole("button", { name: /expand code/i })
    expect(copy.tagName).toBe("BUTTON")
    expect(expand.getAttribute("aria-expanded")).toBe("false")
  })
})
