// Geometry for previews that show a viewport wider than the room on screen:
// the iframe keeps its real (logical) width, so use-mobile inside it sees the
// width it claims, and CSS zoom draws it smaller to fit.

export function fitScale(logicalWidth: number, availableWidth: number): number {
  if (logicalWidth <= 0 || availableWidth <= 0) return 1
  return Math.min(1, availableWidth / logicalWidth)
}

export type StageMode = "desktop" | "mobile"

export type StageViewport = {
  logicalWidth: number
  scale: number
  frameWidth: number
}

const STAGE_MAX_SCALE = 0.6
const STAGE_MIN_DESKTOP_WIDTH = 800
const STAGE_PHONE_WIDTH = 390

// The landing stage: one scale for both modes, so switching only changes the
// frame's width. The desktop viewport fills the stage and never drops under
// the breakpoint; the phone keeps a real phone width.
export function stageViewport(
  mode: StageMode,
  availableWidth: number
): StageViewport {
  const scale = Math.min(
    STAGE_MAX_SCALE,
    availableWidth / STAGE_MIN_DESKTOP_WIDTH
  )
  const logicalWidth =
    mode === "desktop" ? Math.round(availableWidth / scale) : STAGE_PHONE_WIDTH
  return {
    logicalWidth,
    scale,
    frameWidth: Math.round(logicalWidth * scale),
  }
}
