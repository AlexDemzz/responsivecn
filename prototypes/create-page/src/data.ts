export type DesktopName = "Dialog" | "Sheet" | "Popover" | "Tooltip";
export type MobileName = "Drawer" | "Popover";

export interface Pair {
  desktop: DesktopName;
  mobile: MobileName;
  slug: string;
  component: string;
  description: string;
}

// The closed whitelist — exactly four pairs (see CONTEXT.md).
export const PAIRS: Pair[] = [
  {
    desktop: "Dialog",
    mobile: "Drawer",
    slug: "dialog-drawer",
    component: "DialogDrawer",
    description: "Modal dialog on desktop, bottom drawer on mobile.",
  },
  {
    desktop: "Sheet",
    mobile: "Drawer",
    slug: "sheet-drawer",
    component: "SheetDrawer",
    description: "Side sheet on desktop, bottom drawer on mobile.",
  },
  {
    desktop: "Popover",
    mobile: "Drawer",
    slug: "popover-drawer",
    component: "PopoverDrawer",
    description: "Anchored popover on desktop, bottom drawer on mobile.",
  },
  {
    desktop: "Tooltip",
    mobile: "Popover",
    slug: "tooltip-popover",
    component: "TooltipPopover",
    description: "Hover tooltip on desktop, tap popover on mobile.",
  },
];

export const DESKTOP_OPTIONS: DesktopName[] = [
  "Dialog",
  "Sheet",
  "Popover",
  "Tooltip",
];
export const MOBILE_OPTIONS: MobileName[] = ["Drawer", "Popover"];

export const DEFAULT_PAIR = PAIRS[0]; // dialog-drawer, the star pair

export function findPair(
  desktop: DesktopName,
  mobile: MobileName,
): Pair | undefined {
  return PAIRS.find((p) => p.desktop === desktop && p.mobile === mobile);
}

// The matrix is a function: each desktop component has exactly one valid mobile side.
export function mobileFor(desktop: DesktopName): MobileName {
  return PAIRS.find((p) => p.desktop === desktop)!.mobile;
}

export const BREAKPOINT = 768;

export function installCommand(pair: Pair): string {
  return `npx shadcn@latest add @responsivecn/${pair.slug}`;
}

export function itemUrl(pair: Pair): string {
  return `https://responsivecn.com/r/${pair.slug}.json`;
}
