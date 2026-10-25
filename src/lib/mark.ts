// The mark's geometry, shared by the <Mark /> component and the favicon and
// Open Graph images generated at build time. It lives on a 24-unit grid: a
// modal filling the middle 18 units, and a drawer inset 1 unit at its bottom.

// iOS continuous corners (the app icon squircle): each corner is three cubics
// spanning 1.528 radii of the edge instead of one circular arc.
export function continuousRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const [a, b, c, d, e] = [
    1.52866483, 1.08849323, 0.86840689, 0.63149399, 0.37282392,
  ].map((value) => value * r)
  const [f, g, i] = [0.02065, 0.074911, 0.168726].map((value) => value * r)
  const right = x + w
  const bottom = y + h
  const n = (value: number) => Number(value.toFixed(3))
  return [
    `M${n(x + a)} ${y}H${n(right - a)}`,
    `C${n(right - b)} ${y} ${n(right - c)} ${n(y + f)} ${n(right - d)} ${n(y + g)}`,
    `C${n(right - e)} ${n(y + i)} ${n(right - i)} ${n(y + e)} ${n(right - g)} ${n(y + d)}`,
    `C${n(right - f)} ${n(y + c)} ${right} ${n(y + b)} ${right} ${n(y + a)}`,
    `V${n(bottom - a)}`,
    `C${right} ${n(bottom - b)} ${n(right - f)} ${n(bottom - c)} ${n(right - g)} ${n(bottom - d)}`,
    `C${n(right - i)} ${n(bottom - e)} ${n(right - e)} ${n(bottom - i)} ${n(right - d)} ${n(bottom - g)}`,
    `C${n(right - c)} ${n(bottom - f)} ${n(right - b)} ${bottom} ${n(right - a)} ${bottom}`,
    `H${n(x + a)}`,
    `C${n(x + b)} ${bottom} ${n(x + c)} ${n(bottom - f)} ${n(x + d)} ${n(bottom - g)}`,
    `C${n(x + e)} ${n(bottom - i)} ${n(x + i)} ${n(bottom - e)} ${n(x + g)} ${n(bottom - d)}`,
    `C${n(x + f)} ${n(bottom - c)} ${x} ${n(bottom - b)} ${x} ${n(bottom - a)}`,
    `V${n(y + a)}`,
    `C${x} ${n(y + b)} ${n(x + f)} ${n(y + c)} ${n(x + g)} ${n(y + d)}`,
    `C${n(x + i)} ${n(y + e)} ${n(x + e)} ${n(y + i)} ${n(x + d)} ${n(y + g)}`,
    `C${n(x + c)} ${n(y + f)} ${n(x + b)} ${y} ${n(x + a)} ${y}Z`,
  ].join("")
}

// Apple's app icon template: a 180 radius on 1024.
const MODAL_SIZE = 18
const MODAL_RADIUS = (MODAL_SIZE * 180) / 1024

export const MODAL_PATH = continuousRect(3, 3, MODAL_SIZE, MODAL_SIZE, MODAL_RADIUS)
// Inset 1 from the modal, so its radius is the modal's minus 1.
export const DRAWER_PATH = continuousRect(4, 11, 16, 9, MODAL_RADIUS - 1)
export const HANDLE_PATH = "M10.5 12.75h3"

// At rest the modal leads; on a phone the drawer takes over.
export const MODAL_OPACITY = 0.55
export const DRAWER_OPACITY = 0.35

/**
 * The mark at rest as a standalone SVG. `fullBleed` replaces the modal's
 * squircle with a square for app icons, which the platform rounds itself.
 * `padded` shrinks the mark to 60% of a square `background`, inside the safe
 * zone of a maskable icon. `style` may restyle the `.mark` shapes, as the
 * favicon does for dark mode.
 */
export function markSvg({
  color,
  background,
  fullBleed = false,
  padded = false,
  style = "",
}: {
  color: string
  background?: string
  fullBleed?: boolean
  padded?: boolean
  style?: string
}): string {
  const [origin, size] = padded ? [-3, 30] : [3, 18]
  const modal = fullBleed
    ? `<rect x="3" y="3" width="18" height="18" class="mark" fill="${color}" opacity="${MODAL_OPACITY}"/>`
    : `<path d="${MODAL_PATH}" class="mark" fill="${color}" opacity="${MODAL_OPACITY}"/>`
  const backdrop = background
    ? `<rect x="${origin}" y="${origin}" width="${size}" height="${size}" fill="${background}"/>`
    : ""
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${origin} ${origin} ${size} ${size}">`,
    style,
    `<defs><mask id="handle" maskUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fff"/><path d="${HANDLE_PATH}" stroke="#000" stroke-width="1" stroke-linecap="round"/></mask></defs>`,
    backdrop,
    modal,
    `<path d="${DRAWER_PATH}" class="mark" fill="${color}" opacity="${DRAWER_OPACITY}" mask="url(#handle)"/>`,
    `</svg>`,
  ].join("")
}
