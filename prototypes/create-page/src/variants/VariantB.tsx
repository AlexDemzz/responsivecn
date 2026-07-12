import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, Monitor, Smartphone, Tablet } from "lucide-react";
import { PAIRS, installCommand, itemUrl, type Pair } from "../data";
import { Frame, WidthBadge } from "../preview/Frame";

// Variant B — docs-like triptych: pair cards in a left rail (invalid combos
// impossible by construction), device presets instead of free resize, and a
// right code panel with Command/URL tabs. Starts empty to test whether the
// page needs a default selection at all.
export function VariantB() {
  const [pair, setPair] = useState<Pair | null>(null);
  const [width, setWidth] = useState(1024);
  const [tab, setTab] = useState<"cmd" | "url">("cmd");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Selection change → brief skeleton, then remount the demo.
  const select = (p: Pair) => {
    setPair(p);
    setLoading(true);
  };
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [loading]);

  const copy = () => {
    if (!pair) return;
    navigator.clipboard.writeText(tab === "cmd" ? installCommand(pair) : itemUrl(pair));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const presets = [
    { icon: Smartphone, label: "Mobile", w: 375 },
    { icon: Tablet, label: "Tablet", w: 768 },
    { icon: Monitor, label: "Desktop", w: 1024 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200">
        <div className="flex h-14 items-center px-6 text-sm font-semibold text-zinc-900">
          responsivecn <span className="ml-1 font-normal text-zinc-400">/ create</span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* left rail: the four pairs */}
        <aside className="w-64 shrink-0 border-r border-zinc-200 p-4">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Pairs
          </div>
          <div className="space-y-2">
            {PAIRS.map((p) => (
              <button
                key={p.slug}
                onClick={() => select(p)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  pair?.slug === p.slug
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {p.desktop}
                  <ArrowRight className="size-3.5 opacity-50" />
                  {p.mobile}
                </div>
                <div
                  className={`mt-1 text-xs ${pair?.slug === p.slug ? "text-zinc-300" : "text-zinc-500"}`}
                >
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* center: preview with device presets */}
        <main className="flex flex-1 flex-col items-center bg-zinc-50 p-6">
          {pair ? (
            <>
              <div className="mb-4 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
                {presets.map(({ icon: Icon, label, w }) => (
                  <button
                    key={label}
                    onClick={() => setWidth(w)}
                    className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${
                      width === w
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {label} {w}
                  </button>
                ))}
              </div>
              {loading ? (
                <div
                  style={{ width }}
                  className="proto-skeleton h-[420px] max-w-full rounded-xl border border-zinc-200"
                />
              ) : (
                <Frame pair={pair} width={width}>
                  <WidthBadge width={width} />
                </Frame>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="text-sm font-medium text-zinc-900">Pick a pair</div>
              <p className="mt-1 max-w-56 text-xs text-zinc-500">
                Choose a desktop → mobile combination on the left to preview it.
              </p>
            </div>
          )}
        </main>

        {/* right: install panel */}
        <aside className="w-80 shrink-0 border-l border-zinc-200 p-4">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Install
          </div>
          {pair ? (
            <>
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="flex border-b border-zinc-200 bg-zinc-50 text-xs">
                  {(["cmd", "url"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-3 py-2 font-medium ${
                        tab === t
                          ? "bg-white text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      {t === "cmd" ? "Command" : "URL"}
                    </button>
                  ))}
                  <button
                    onClick={copy}
                    className="ml-auto px-3 text-zinc-500 hover:text-zinc-900"
                    title="Copy"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <pre className="overflow-x-auto bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
                  {tab === "cmd" ? installCommand(pair) : itemUrl(pair)}
                </pre>
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Component</dt>
                  <dd className="font-mono text-zinc-900">{pair.component}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Breakpoint</dt>
                  <dd className="font-mono text-zinc-900">768px</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Registry deps</dt>
                  <dd className="font-mono text-zinc-900">
                    {pair.desktop.toLowerCase()}, {pair.mobile.toLowerCase()}, use-mobile
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-xs text-zinc-400">Nothing selected yet.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
