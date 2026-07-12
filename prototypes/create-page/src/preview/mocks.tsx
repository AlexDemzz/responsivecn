import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Pair } from "../data";

// Hand-rolled lookalikes of the shadcn primitives, contained inside the
// preview frame (absolute positioning against the frame, not the viewport).

function FakeForm() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-700">Name</div>
        <div className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm leading-8 text-zinc-500">
          Pedro Duarte
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-700">Username</div>
        <div className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm leading-8 text-zinc-500">
          @peduarte
        </div>
      </div>
      <button className="h-8 w-full rounded-md bg-zinc-900 text-sm font-medium text-white">
        Save changes
      </button>
    </div>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        <div className="text-xs text-zinc-500">
          Make changes and click save.
        </div>
      </div>
      <button
        onClick={onClose}
        className="rounded-sm p-0.5 text-zinc-400 hover:text-zinc-700"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function DialogMock({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-10">
      <div className="proto-fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="proto-zoom-in absolute left-1/2 top-1/2 w-80 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg">
        <PanelHeader title="Edit profile" onClose={onClose} />
        <FakeForm />
      </div>
    </div>
  );
}

function DrawerMock({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-10">
      <div className="proto-fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="proto-slide-up absolute inset-x-0 bottom-0 rounded-t-2xl border border-zinc-200 bg-white p-4 pt-2 shadow-lg">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300" />
        <PanelHeader title="Edit profile" onClose={onClose} />
        <FakeForm />
      </div>
    </div>
  );
}

function SheetMock({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-10">
      <div className="proto-fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="proto-slide-from-right absolute inset-y-0 right-0 w-72 max-w-[85%] border-l border-zinc-200 bg-white p-4 shadow-lg">
        <PanelHeader title="Edit profile" onClose={onClose} />
        <FakeForm />
      </div>
    </div>
  );
}

function PopoverMock({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div className="proto-zoom-in absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-3 text-left shadow-md">
      <div className="mb-2 text-sm font-semibold text-zinc-900">Dimensions</div>
      <div className="space-y-2">
        {["Width", "Height"].map((label) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-14 text-xs text-zinc-600">{label}</div>
            <div className="h-7 flex-1 rounded-md border border-zinc-200 px-2 text-xs leading-7 text-zinc-500">
              {label === "Width" ? "100%" : "25px"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TooltipMock() {
  return (
    <div className="proto-fade-in pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white">
      Add to library
    </div>
  );
}

function TriggerButton({
  children,
  onClick,
  onHoverChange,
}: {
  children: ReactNode;
  onClick?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className="h-9 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

// Renders the pair's live demo: desktop primitive at/above the breakpoint,
// mobile primitive below. `isMobile` is derived from the frame width.
export function PairDemo({ pair, isMobile }: { pair: Pair; isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const active = isMobile ? pair.mobile : pair.desktop;

  if (pair.slug === "tooltip-popover") {
    return (
      <div className="relative inline-block">
        <TriggerButton
          onClick={() => active === "Popover" && setOpen((o) => !o)}
          onHoverChange={setHovered}
        >
          {active === "Tooltip" ? "Hover me" : "Tap me"}
        </TriggerButton>
        {active === "Tooltip" && hovered && <TooltipMock />}
        {active === "Popover" && <PopoverMock open={open} />}
      </div>
    );
  }

  if (pair.slug === "popover-drawer" && !isMobile) {
    return (
      <div className="relative inline-block">
        <TriggerButton onClick={() => setOpen((o) => !o)}>
          Open popover
        </TriggerButton>
        <PopoverMock open={open} />
      </div>
    );
  }

  const label =
    active === "Drawer"
      ? "Open drawer"
      : active === "Sheet"
        ? "Open sheet"
        : "Open dialog";

  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>{label}</TriggerButton>
      {active === "Dialog" && (
        <DialogMock open={open} onClose={() => setOpen(false)} />
      )}
      {active === "Sheet" && (
        <SheetMock open={open} onClose={() => setOpen(false)} />
      )}
      {active === "Drawer" && (
        <DrawerMock open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
