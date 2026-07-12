import { useCallback, useRef } from "react";
import { BREAKPOINT, type Pair } from "../data";
import { PairDemo } from "./mocks";

export const MIN_W = 320;
export const MAX_W = 1200;

export function clampWidth(w: number): number {
  return Math.min(MAX_W, Math.max(MIN_W, Math.round(w)));
}

// The simulated viewport: a fixed-height surface whose width the variants
// control. Below 768px the demo swaps to the mobile primitive.
export function Frame({
  pair,
  width,
  demoKey,
  children,
}: {
  pair: Pair;
  width: number;
  demoKey?: string;
  children?: React.ReactNode; // badge / overlays owned by the variant
}) {
  const isMobile = width < BREAKPOINT;
  return (
    <div
      style={{ width }}
      className="relative h-[420px] max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      {/* fake app chrome so the surface doesn't read as an empty void */}
      <div className="flex h-9 items-center gap-1.5 border-b border-zinc-100 px-3">
        <span className="size-2 rounded-full bg-zinc-200" />
        <span className="size-2 rounded-full bg-zinc-200" />
        <span className="size-2 rounded-full bg-zinc-200" />
      </div>
      <div
        key={demoKey ?? pair.slug}
        className="proto-fade-in flex h-[calc(100%-2.25rem)] items-center justify-center"
      >
        <PairDemo key={`${pair.slug}-${isMobile}`} pair={pair} isMobile={isMobile} />
      </div>
      {children}
    </div>
  );
}

// Pointer-drag hook for resize handles. `direction` is the sign applied to
// the pointer delta (right edge = 1, left edge = -1); `factor` lets a
// centered frame grow twice as fast so the edge follows the cursor.
export function useDragResize(
  width: number,
  setWidth: (w: number) => void,
  direction: 1 | -1 = 1,
  factor = 1,
) {
  const start = useRef({ x: 0, w: 0 });

  return useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      start.current = { x: e.clientX, w: width };
      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - start.current.x) * direction * factor;
        setWidth(clampWidth(start.current.w + dx));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [width, setWidth, direction, factor],
  );
}

export function WidthBadge({ width }: { width: number }) {
  const isMobile = width < BREAKPOINT;
  return (
    <div className="absolute right-2 top-11 rounded-full border border-zinc-200 bg-white/90 px-2 py-0.5 font-mono text-[11px] text-zinc-600 shadow-sm">
      {width}px ·{" "}
      <span className={isMobile ? "text-orange-600" : "text-sky-600"}>
        {isMobile ? "mobile" : "desktop"}
      </span>
    </div>
  );
}

export function DragHandle({
  onPointerDown,
  side,
}: {
  onPointerDown: (e: React.PointerEvent) => void;
  side: "left" | "right";
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      className={`flex w-4 shrink-0 cursor-ew-resize items-center justify-center self-stretch ${side === "left" ? "-mr-1" : "-ml-1"}`}
      title="Drag to resize"
    >
      <div className="h-10 w-1.5 rounded-full bg-zinc-300 hover:bg-zinc-400" />
    </div>
  );
}
