import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import {
  DESKTOP_OPTIONS,
  PAIRS,
  installCommand,
  itemUrl,
  mobileFor,
  type DesktopName,
} from "../data";
import { DragHandle, Frame, WidthBadge, useDragResize } from "../preview/Frame";

// Variant C — playground: full-bleed canvas, ONE desktop select (the matrix
// is a function, so the mobile side is derived and shown as a chip, never
// chosen), symmetric drag handles, split copy button (npx / pnpm / URL).
// Starts at 375px so the mobile primitive is what you see first.
export function VariantC() {
  const [desktop, setDesktop] = useState<DesktopName>("Dialog");
  const [width, setWidth] = useState(375);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pair = PAIRS.find((p) => p.desktop === desktop)!;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setMenuOpen(false);
    setTimeout(() => setCopied(false), 1500);
  };

  const onDragRight = useDragResize(width, setWidth, 1, 2);
  const onDragLeft = useDragResize(width, setWidth, -1, 2);

  const copyOptions = [
    { label: "npx", text: installCommand(pair) },
    { label: "pnpm", text: `pnpm dlx shadcn@latest add @responsivecn/${pair.slug}` },
    { label: "Item URL", text: itemUrl(pair) },
  ];

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_1px_1px,#d4d4d8_1px,transparent_0)] bg-zinc-100 [background-size:20px_20px]">
      {/* floating toolbar */}
      <div className="fixed left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 p-2 shadow-lg backdrop-blur">
        <select
          value={desktop}
          onChange={(e) => setDesktop(e.target.value as DesktopName)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900"
        >
          {DESKTOP_OPTIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <span
          className="flex h-9 items-center rounded-md bg-zinc-100 px-3 text-sm text-zinc-600"
          title="Derived from the pair matrix — not a choice"
        >
          → {mobileFor(desktop)} <span className="ml-1.5 text-[10px] uppercase text-zinc-400">auto</span>
        </span>

        <div className="mx-1 h-6 w-px bg-zinc-200" />

        <label className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-600">
          <input
            type="number"
            value={width}
            min={320}
            max={1200}
            onChange={(e) => setWidth(Number(e.target.value) || 320)}
            className="w-14 bg-transparent text-right text-zinc-900 outline-none"
          />
          px
        </label>

        <div className="relative">
          <div className="flex">
            <button
              onClick={() => copy(installCommand(pair))}
              className="flex h-9 items-center gap-2 rounded-l-md bg-zinc-900 px-3 font-mono text-xs text-white hover:bg-zinc-800"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              add @responsivecn/{pair.slug}
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 items-center rounded-r-md border-l border-zinc-700 bg-zinc-900 px-1.5 text-white hover:bg-zinc-800"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </div>
          {menuOpen && (
            <div className="proto-zoom-in absolute right-0 top-full mt-1 w-72 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
              {copyOptions.map((o) => (
                <button
                  key={o.label}
                  onClick={() => copy(o.text)}
                  className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-zinc-50"
                >
                  <span className="w-14 shrink-0 text-xs font-medium text-zinc-900">
                    {o.label}
                  </span>
                  <span className="truncate font-mono text-[11px] text-zinc-500">{o.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* full-bleed canvas */}
      <div className="flex min-h-screen items-center justify-center pt-16">
        <DragHandle side="left" onPointerDown={onDragLeft} />
        <Frame pair={pair} width={width}>
          <WidthBadge width={width} />
        </Frame>
        <DragHandle side="right" onPointerDown={onDragRight} />
      </div>
    </div>
  );
}
