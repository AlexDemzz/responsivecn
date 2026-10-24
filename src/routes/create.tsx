import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { appName } from "@/lib/shared"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  BREAKPOINT,
  DEFAULT_PAIR,
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MIN_WIDTH,
  PAIRS,
  clampWidth,
  itemUrl,
  npxCommand,
  pairByDesktop,
  pnpmCommand,
} from "@/components/create/pairs"
import type { DesktopName, Pair, PairSlug } from "@/components/create/pairs"

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create — responsivecn" },
      {
        name: "description",
        content:
          "Preview every responsive pair live: resize the canvas across 768px and watch the desktop component swap to its mobile counterpart.",
      },
    ],
  }),
  component: CreatePage,
})

// Variant C "playground" (ticket #7, PR #13): the page IS the canvas. One
// desktop select (mobile side derived from the pair matrix, shown as an
// "auto" chip), symmetric resize handles + px input, split copy button.
function CreatePage() {
  const [desktop, setDesktop] = React.useState<DesktopName>(
    DEFAULT_PAIR.desktop
  )
  const [width, setWidth] = React.useState(DEFAULT_WIDTH)
  const [dragging, setDragging] = React.useState(false)

  const pair = pairByDesktop(desktop)
  const onDragLeft = useDragResize(width, setWidth, setDragging, -1)
  const onDragRight = useDragResize(width, setWidth, setDragging, 1)

  return (
    <main className="relative flex h-svh flex-col overflow-hidden bg-background bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:20px_20px]">
      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "absolute top-4 left-4 z-20 border border-border bg-background/80 shadow-xs backdrop-blur"
        )}
      >
        <ArrowLeftIcon />
        {appName}
      </Link>

      {/* floating toolbar */}
      <div className="absolute top-4 left-1/2 z-10 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border bg-background/80 p-1.5 shadow-lg backdrop-blur">
        <div className="relative">
          <select
            aria-label="Desktop component"
            value={desktop}
            onChange={(event) => setDesktop(event.target.value as DesktopName)}
            className="h-8 appearance-none rounded-lg border border-border bg-background pr-8 pl-3 text-sm font-medium shadow-xs outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-input/30"
          >
            {PAIRS.map((p) => (
              <option key={p.slug} value={p.desktop}>
                {p.desktop}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <span
          className="flex h-8 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-sm text-muted-foreground"
          title="Derived from the pair matrix — not a choice"
        >
          {pair.mobile}
          <span className="rounded-sm bg-background px-1 text-[10px] font-medium tracking-wide uppercase ring-1 ring-border">
            auto
          </span>
        </span>

        <div className="h-5 w-px bg-border" />

        <WidthInput width={width} onChange={setWidth} />

        <CopySplitButton pair={pair} />
      </div>

      {/* full-bleed canvas */}
      <div className="flex min-h-0 flex-1 items-stretch justify-center gap-1 overflow-x-auto px-4 pt-24 pb-6 sm:px-8">
        <ResizeHandle
          side="left"
          onPointerDown={onDragLeft}
          onNudge={(delta) => setWidth((w) => clampWidth(w - delta))}
        />
        <div className="relative flex max-w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="grid h-9 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/20" />
              <span className="size-2.5 rounded-full bg-muted-foreground/20" />
              <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            </div>
            <WidthBadge width={width} pair={pair} />
          </div>
          <PreviewFrame
            key={pair.slug}
            slug={pair.slug}
            width={width}
            dragging={dragging}
          />
        </div>
        <ResizeHandle
          side="right"
          onPointerDown={onDragRight}
          onNudge={(delta) => setWidth((w) => clampWidth(w + delta))}
        />
      </div>
    </main>
  )
}

// Pointer-drag hook for the resize handles. `direction` is the sign applied
// to the pointer delta (right edge = 1, left edge = -1); the frame is
// centered, so the delta is doubled to keep the edge under the cursor.
function useDragResize(
  width: number,
  setWidth: (width: number) => void,
  setDragging: (dragging: boolean) => void,
  direction: 1 | -1
) {
  const start = React.useRef({ x: 0, w: 0 })

  return React.useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault()
      start.current = { x: event.clientX, w: width }
      setDragging(true)
      const onMove = (moveEvent: PointerEvent) => {
        const dx = (moveEvent.clientX - start.current.x) * direction * 2
        setWidth(clampWidth(start.current.w + dx))
      }
      const onUp = () => {
        setDragging(false)
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [width, setWidth, setDragging, direction]
  )
}

function ResizeHandle({
  side,
  onPointerDown,
  onNudge,
}: {
  side: "left" | "right"
  onPointerDown: (event: React.PointerEvent) => void
  onNudge: (delta: number) => void
}) {
  return (
    <button
      type="button"
      aria-label={`Resize canvas (${side} edge)`}
      title="Drag to resize"
      onPointerDown={(event) => {
        // preventDefault (in the drag hook) suppresses click-focus — restore
        // it so arrow-key resizing works right after grabbing the handle.
        event.currentTarget.focus()
        onPointerDown(event)
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        event.preventDefault()
        onNudge(event.key === "ArrowLeft" ? -10 : 10)
      }}
      className="group flex w-5 shrink-0 cursor-ew-resize touch-none items-center justify-center self-stretch rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="h-12 w-1.5 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/60 group-active:bg-muted-foreground/80" />
    </button>
  )
}

function WidthBadge({ width, pair }: { width: number; pair: Pair }) {
  const isMobile = width < BREAKPOINT
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          isMobile ? "bg-amber-500" : "bg-sky-500"
        )}
      />
      {width}px · {isMobile ? pair.mobile : pair.desktop}
    </span>
  )
}

// The live preview: an iframe whose window width follows the canvas, so the
// registry components' use-mobile (window.matchMedia) sees the canvas width
// and swaps instantly at 768px. Width lives on the iframe itself — the
// declared px IS the preview viewport, borders sit outside of it.
function PreviewFrame({
  slug,
  width,
  dragging,
}: {
  slug: PairSlug
  width: number
  dragging: boolean
}) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <iframe
      src={`/preview?pair=${slug}`}
      title={`${slug} live preview`}
      onLoad={() => setLoaded(true)}
      style={{ width }}
      className={cn(
        "min-h-0 flex-1 border-0 transition-opacity duration-150 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        // The iframe must not swallow pointer events while dragging.
        dragging && "pointer-events-none"
      )}
    />
  )
}

function WidthInput({
  width,
  onChange,
}: {
  width: number
  onChange: (width: number) => void
}) {
  const [value, setValue] = React.useState(String(width))

  // Keep the field in sync when the drag handles change the width.
  React.useEffect(() => {
    setValue(String(width))
  }, [width])

  const commit = () => {
    const parsed = Number(value)
    const next =
      Number.isFinite(parsed) && value !== "" ? clampWidth(parsed) : width
    setValue(String(next))
    onChange(next)
  }

  return (
    <label className="flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 font-mono text-xs text-muted-foreground shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:border-input dark:bg-input/30">
      <input
        type="number"
        inputMode="numeric"
        aria-label="Canvas width in pixels"
        min={MIN_WIDTH}
        max={MAX_WIDTH}
        value={value}
        onChange={(event) => {
          const next = event.target.value
          setValue(next)
          const parsed = Number(next)
          // Apply instantly while the value is already in range; clamp on commit.
          if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
            onChange(Math.round(parsed))
          }
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit()
        }}
        className="w-12 [appearance:textfield] bg-transparent text-right text-sm text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      px
    </label>
  )
}

function CopySplitButton({ pair }: { pair: Pair }) {
  const [open, setOpen] = React.useState(false)
  const { copied, copy } = useCopyToClipboard({ timeout: 1500 })
  const closeTimeout = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    return () => window.clearTimeout(closeTimeout.current)
  }, [])

  const primary = npxCommand(pair.slug)
  const entries = [
    { key: "pnpm", label: "pnpm", value: pnpmCommand(pair.slug) },
    { key: "url", label: "Item URL", value: itemUrl(pair.slug) },
  ]

  return (
    <div className="flex">
      <Button
        onClick={() => copy(primary, "npx")}
        className="rounded-r-none font-mono text-xs"
      >
        {copied === "npx" ? (
          <CheckIcon className="size-3.5" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
        {primary}
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              size="icon"
              aria-label="More install options"
              className="rounded-l-none border-l border-primary-foreground/20"
            />
          }
        >
          <ChevronDownIcon className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 p-1">
          {entries.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                copy(entry.value, entry.key)
                window.clearTimeout(closeTimeout.current)
                closeTimeout.current = window.setTimeout(
                  () => setOpen(false),
                  600
                )
              }}
              className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <span className="flex w-full items-center justify-between text-xs font-medium">
                {entry.label}
                {copied === entry.key && (
                  <CheckIcon className="size-3 text-muted-foreground" />
                )}
              </span>
              <span className="w-full truncate font-mono text-[11px] text-muted-foreground">
                {entry.value}
              </span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
