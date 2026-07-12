import { useState } from "react";
import { ArrowRight, Check, Copy, Link2 } from "lucide-react";
import {
  DESKTOP_OPTIONS,
  MOBILE_OPTIONS,
  findPair,
  installCommand,
  itemUrl,
  mobileFor,
  type DesktopName,
  type MobileName,
} from "../data";
import { DragHandle, Frame, WidthBadge, useDragResize } from "../preview/Frame";

// Variant A — the ticket as written: two selects top center, strict matrix.
// Invalid mobile options are disabled; changing desktop auto-snaps the mobile
// select to the only valid value (amber flash signals the adjustment).
// Copy: primary button = install command, small secondary = item URL.
export function VariantA() {
  const [desktop, setDesktop] = useState<DesktopName>("Dialog");
  const [mobile, setMobile] = useState<MobileName>("Drawer");
  const [flash, setFlash] = useState(false);
  const [width, setWidth] = useState(1024);
  const [copied, setCopied] = useState<"cmd" | "url" | null>(null);

  const pair = findPair(desktop, mobile)!; // selects can never form an invalid pair

  const onDesktopChange = (d: DesktopName) => {
    setDesktop(d);
    const valid = mobileFor(d);
    if (valid !== mobile) {
      setMobile(valid);
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }
  };

  const copy = (kind: "cmd" | "url") => {
    navigator.clipboard.writeText(kind === "cmd" ? installCommand(pair) : itemUrl(pair));
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const onDrag = useDragResize(width, setWidth, 1, 2); // centered frame → edge follows cursor

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="text-sm font-semibold text-zinc-900">
            responsivecn <span className="font-normal text-zinc-400">/ create</span>
          </div>
          <div className="text-xs text-zinc-400">docs · github</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* toolbar: selects centered, copy on the right */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-24" aria-hidden />
          <div className="flex items-center gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Desktop
              </span>
              <select
                value={desktop}
                onChange={(e) => onDesktopChange(e.target.value as DesktopName)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm"
              >
                {DESKTOP_OPTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <ArrowRight className="mt-4 size-4 text-zinc-400" />
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Mobile
              </span>
              <select
                value={mobile}
                onChange={(e) => setMobile(e.target.value as MobileName)}
                className={`h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm ${flash ? "proto-flash" : ""}`}
              >
                {MOBILE_OPTIONS.map((m) => {
                  const valid = !!findPair(desktop, m);
                  return (
                    <option key={m} value={m} disabled={!valid}>
                      {m}
                      {valid ? "" : ` — no ${desktop} → ${m} pair`}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copy("cmd")}
              className="flex h-9 items-center gap-2 rounded-md bg-zinc-900 px-3 font-mono text-xs text-white shadow-sm hover:bg-zinc-800"
              title={installCommand(pair)}
            >
              {copied === "cmd" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {installCommand(pair)}
            </button>
            <button
              onClick={() => copy("url")}
              className="flex size-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-zinc-900"
              title={`Copy item URL — ${itemUrl(pair)}`}
            >
              {copied === "url" ? <Check className="size-4" /> : <Link2 className="size-4" />}
            </button>
          </div>
        </div>

        {/* preview: centered frame, drag handle on the right edge */}
        <div className="mt-6 flex items-center justify-center">
          <Frame pair={pair} width={width}>
            <WidthBadge width={width} />
          </Frame>
          <DragHandle side="right" onPointerDown={onDrag} />
        </div>
        <p className="mt-3 text-center text-xs text-zinc-400">
          Drag the handle — below 768px the {pair.desktop} becomes a {pair.mobile}.
        </p>
      </main>
    </div>
  );
}
