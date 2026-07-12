import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface VariantDef {
  key: string;
  name: string;
  render: () => React.ReactNode;
}

// Floating prototype switcher — obviously not part of the design under review.
export function Switcher({
  variants,
  current,
  onChange,
}: {
  variants: VariantDef[];
  current: string;
  onChange: (key: string) => void;
}) {
  const idx = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );
  const go = (delta: number) =>
    onChange(variants[(idx + delta + variants.length) % variants.length].key);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable
      )
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-violet-300 bg-violet-600 px-2 py-1.5 text-white shadow-xl">
      <button
        onClick={() => go(-1)}
        className="rounded-full p-1 hover:bg-violet-500"
        aria-label="Previous variant"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-56 px-1 text-center text-xs font-medium">
        {variants[idx].key.toUpperCase()} — {variants[idx].name}
      </span>
      <button
        onClick={() => go(1)}
        className="rounded-full p-1 hover:bg-violet-500"
        aria-label="Next variant"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
