import { describe, expect, it } from "vitest"

import { fitScale, stageViewport } from "./viewport"

describe("fitScale", () => {
  it("keeps a frame that fits at its real size", () => {
    expect(fitScale(375, 1000)).toBe(1)
  })

  it("shrinks a frame wider than the room it has", () => {
    expect(fitScale(1200, 600)).toBe(0.5)
  })
})

describe("stageViewport", () => {
  it("shows a 1280px desktop at 60% on a wide stage", () => {
    expect(stageViewport("desktop", 768)).toEqual({
      logicalWidth: 1280,
      scale: 0.6,
      frameWidth: 768,
    })
  })

  it("narrows the frame to a 390px phone at the same scale", () => {
    expect(stageViewport("mobile", 768)).toEqual({
      logicalWidth: 390,
      scale: 0.6,
      frameWidth: 234,
    })
  })

  it("still renders the desktop side on a phone-sized stage", () => {
    const { logicalWidth, frameWidth } = stageViewport("desktop", 343)
    expect(logicalWidth).toBe(800)
    expect(frameWidth).toBe(343)
  })
})
