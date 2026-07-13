// Pair matrix and install-command strings for the /create playground.
// The matrix is a function: each desktop component has exactly one valid
// mobile side (CONTEXT.md), so the UI only ever asks for the desktop one.

export const PAIRS = [
  { desktop: "Dialog", mobile: "Drawer", slug: "dialog-drawer" },
  { desktop: "Sheet", mobile: "Drawer", slug: "sheet-drawer" },
  { desktop: "Popover", mobile: "Drawer", slug: "popover-drawer" },
  { desktop: "Tooltip", mobile: "Popover", slug: "tooltip-popover" },
] as const

export type Pair = (typeof PAIRS)[number]
export type PairSlug = Pair["slug"]
export type DesktopName = Pair["desktop"]

export const DEFAULT_PAIR: Pair = PAIRS[0]

export function isPairSlug(value: unknown): value is PairSlug {
  return PAIRS.some((pair) => pair.slug === value)
}

export function pairByDesktop(desktop: DesktopName): Pair {
  return PAIRS.find((pair) => pair.desktop === desktop) ?? DEFAULT_PAIR
}

export const BREAKPOINT = 768
export const MIN_WIDTH = 320
export const MAX_WIDTH = 1200
export const DEFAULT_WIDTH = 375

export function clampWidth(width: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)))
}

const SITE_URL = "https://responsivecn.com"

export function npxCommand(item: string): string {
  return `npx shadcn add @responsivecn/${item}`
}

export function pnpmCommand(item: string): string {
  return `pnpm dlx shadcn@latest add @responsivecn/${item}`
}

export function itemUrl(item: string): string {
  return `${SITE_URL}/r/${item}.json`
}
