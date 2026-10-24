import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  ChevronDownIcon,
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Mark } from "@/components/mark"
import { CopyStateIcon, CopyStatus } from "@/components/copy-state-icon"
import { cn } from "@/lib/utils"
import { appName } from "@/lib/shared"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useElementSize } from "@/hooks/use-element-size"
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
import { fitScale } from "@/components/create/viewport"

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Playground — responsivecn" },
      {
        name: "description",
        content:
          "Preview every responsive pair live: resize the canvas across 768px and watch the desktop component swap to its mobile counterpart.",
      },
    ],
  }),
  component: CreatePage,
})

const HANDLE_ROOM = 48
const NUDGE = 10
const NUDGE_LARGE = 100

function CreatePage() {
  const [desktop, setDesktop] = React.useState<DesktopName>(
    DEFAULT_PAIR.desktop
  )
  const [width, setWidth] = React.useState(DEFAULT_WIDTH)
  const [dragging, setDragging] = React.useState(false)
  const [canvasRef, canvas] = useElementSize<HTMLDivElement>()

  const pair = pairByDesktop(desktop)
  const scale = fitScale(width, canvas.width - HANDLE_ROOM)
  const onDragLeft = useDragResize(width, scale, setWidth, setDragging, -1)
  const onDragRight = useDragResize(width, scale, setWidth, setDragging, 1)
  const nudge = (delta: number) => setWidth((w) => clampWidth(w + delta))

  return (
    <main className="flex h-dvh flex-col overflow-clip bg-background bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:20px_20px]">
      <h1 className="sr-only">Playground</h1>
      <header className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
        <Link
          to="/"
          aria-label={`${appName} home`}
          className="group/mark me-1 flex h-8 items-center gap-2 rounded-lg font-medium"
        >
          <Mark className="size-5" />
          <span className="hidden sm:inline">{appName}</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <NativeSelect
            aria-label="Desktop component"
            value={desktop}
            onChange={(event) => setDesktop(event.target.value as DesktopName)}
          >
            {PAIRS.map((item) => (
              <NativeSelectOption key={item.slug} value={item.desktop}>
                {item.desktop}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <ArrowRightIcon
            aria-hidden
            className="size-3.5 text-muted-foreground max-sm:hidden"
          />
          <span
            className="flex h-8 items-center gap-1.5 rounded-lg bg-muted ps-2.5 pe-1.5 text-sm"
            title="Each desktop component has exactly one mobile side"
          >
            <span>{pair.mobile}</span>
            <span className="rounded-sm bg-background px-1 text-xs text-muted-foreground shadow-hairline">
              auto
            </span>
          </span>
        </div>

        <WidthInput width={width} onChange={setWidth} />

        <CopySplitButton pair={pair} />
      </header>

      <div
        ref={canvasRef}
        className="flex min-h-0 flex-1 items-stretch justify-center px-2 pb-4 sm:px-6 sm:pb-6"
      >
        <ResizeHandle
          side="left"
          onPointerDown={onDragLeft}
          onNudge={(delta) => nudge(-delta)}
        />
        <Frame pair={pair} width={width} scale={scale} dragging={dragging} />
        <ResizeHandle
          side="right"
          onPointerDown={onDragRight}
          onNudge={nudge}
        />
      </div>
    </main>
  )
}

// The frame is centered, so each edge moves half the width change: the delta
// is doubled to keep the edge under the pointer, then unscaled when the frame
// is drawn smaller than its declared width.
function useDragResize(
  width: number,
  scale: number,
  setWidth: (width: number) => void,
  setDragging: (dragging: boolean) => void,
  direction: 1 | -1
) {
  return React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault()
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)
      const startX = event.clientX
      setDragging(true)
      const onMove = (moveEvent: PointerEvent) => {
        const dx = ((moveEvent.clientX - startX) * direction * 2) / scale
        setWidth(clampWidth(width + dx))
      }
      const onUp = () => {
        setDragging(false)
        handle.removeEventListener("pointermove", onMove)
        handle.removeEventListener("pointerup", onUp)
        handle.removeEventListener("pointercancel", onUp)
      }
      handle.addEventListener("pointermove", onMove)
      handle.addEventListener("pointerup", onUp)
      handle.addEventListener("pointercancel", onUp)
    },
    [width, scale, setWidth, setDragging, direction]
  )
}

function ResizeHandle({
  side,
  onPointerDown,
  onNudge,
}: {
  side: "left" | "right"
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onNudge: (delta: number) => void
}) {
  return (
    <button
      type="button"
      aria-label={`Resize the canvas from its ${side} edge`}
      title="Drag, or use the arrow keys (Shift for 100px)"
      onPointerDown={(event) => {
        // preventDefault in the drag suppresses click focus; restore it so
        // the arrow keys work right after grabbing the handle.
        event.currentTarget.focus()
        onPointerDown(event)
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        event.preventDefault()
        const step = event.shiftKey ? NUDGE_LARGE : NUDGE
        onNudge(event.key === "ArrowLeft" ? -step : step)
      }}
      className="group flex w-6 shrink-0 cursor-ew-resize touch-none items-center justify-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="h-12 w-1.5 rounded-full bg-muted-foreground/30 transition-colors duration-150 ease-out group-active:bg-muted-foreground/80 can-hover:group-hover:bg-muted-foreground/60" />
    </button>
  )
}

// The live preview: an iframe whose own window is `width` px wide, so the
// registry components' use-mobile sees the canvas width and swaps at 768px.
// When the canvas has less room than that, zoom draws it smaller without
// changing the width its window reports.
function Frame({
  pair,
  width,
  scale,
  dragging,
}: {
  pair: Pair
  width: number
  scale: number
  dragging: boolean
}) {
  const [bodyRef, body] = useElementSize<HTMLDivElement>()
  const isMobile = width < BREAKPOINT
  const SideIcon = isMobile ? SmartphoneIcon : MonitorIcon

  return (
    <div
      className="flex max-w-full min-w-0 flex-col overflow-clip rounded-2xl border bg-background"
      style={{ width: Math.round(width * scale) + 2 }}
    >
      <div className="flex min-h-9 shrink-0 items-center justify-center gap-1.5 border-b px-3 py-2 text-xs text-muted-foreground">
        <SideIcon aria-hidden className="size-3.5 shrink-0" />
        <span className="text-balance">
          <span className="text-foreground tabular-nums">{width}px</span>{" "}
          renders the {isMobile ? pair.mobile : pair.desktop}
          {scale < 1 ? (
            <span className="tabular-nums">
              {" "}
              · shown at {Math.round(scale * 100)}%
            </span>
          ) : null}
        </span>
      </div>
      <div ref={bodyRef} className="relative min-h-0 flex-1">
        {body.height > 0 ? (
          <PreviewFrame
            key={pair.slug}
            slug={pair.slug}
            width={width}
            height={Math.round(body.height / scale)}
            scale={scale}
            dragging={dragging}
          />
        ) : null}
      </div>
    </div>
  )
}

function PreviewFrame({
  slug,
  width,
  height,
  scale,
  dragging,
}: {
  slug: PairSlug
  width: number
  height: number
  scale: number
  dragging: boolean
}) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <iframe
      src={`/preview?pair=${slug}`}
      title={`${slug} live preview`}
      onLoad={() => setLoaded(true)}
      style={{ width, height, zoom: scale }}
      className={cn(
        "absolute start-0 top-0 border-0 transition-opacity duration-200 ease-out",
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
  const [draft, setDraft] = React.useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const parsed = Number(draft)
    if (draft !== "" && Number.isFinite(parsed)) onChange(clampWidth(parsed))
    setDraft(null)
  }

  return (
    <label className="flex h-8 items-center gap-1 rounded-lg border border-input bg-background ps-2.5 pe-2 font-mono text-base text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 sm:text-sm dark:bg-input/30">
      <input
        type="number"
        inputMode="numeric"
        aria-label="Canvas width in pixels"
        min={MIN_WIDTH}
        max={MAX_WIDTH}
        value={draft ?? String(width)}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          const parsed = Number(next)
          if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
            onChange(Math.round(parsed))
          }
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit()
        }}
        className="w-12 [appearance:textfield] bg-transparent text-end text-foreground tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      px
    </label>
  )
}

const CLOSE_AFTER_COPY = 600

function CopySplitButton({ pair }: { pair: Pair }) {
  const [open, setOpen] = React.useState(false)
  const { copied, copy } = useCopyToClipboard({ timeout: 1500 })
  const closeTimeout = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(closeTimeout.current), [])

  const primary = npxCommand(pair.slug)
  const entries = [
    { key: "npx", label: "npx", value: primary },
    { key: "pnpm", label: "pnpm", value: pnpmCommand(pair.slug) },
    { key: "url", label: "Item URL", value: itemUrl(pair.slug) },
  ]

  return (
    <>
      <ButtonGroup className="min-w-0 max-sm:w-full sm:ms-auto">
        <Button
          onClick={() => copy(primary, "npx")}
          aria-label={`Copy ${primary}`}
          className="min-w-0 flex-1 justify-start font-mono"
        >
          <CopyStateIcon data-icon="inline-start" copied={copied === "npx"} />
          <span className="truncate">{primary}</span>
        </Button>
        <ButtonGroupSeparator />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button size="icon" aria-label="More install options" />}
          >
            <ChevronDownIcon />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 max-w-[calc(100vw-2rem)] gap-0 p-1"
          >
            {entries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => {
                  copy(entry.value, entry.key)
                  window.clearTimeout(closeTimeout.current)
                  closeTimeout.current = window.setTimeout(
                    () => setOpen(false),
                    CLOSE_AFTER_COPY
                  )
                }}
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-start outline-none focus-visible:bg-accent can-hover:hover:bg-accent"
              >
                <span className="flex w-full items-center justify-between text-sm font-medium">
                  {entry.label}
                  <CopyStateIcon
                    copied={copied === entry.key}
                    className="size-3.5 text-muted-foreground"
                  />
                </span>
                <span className="w-full font-mono text-xs break-all text-muted-foreground">
                  {entry.value}
                </span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </ButtonGroup>
      <CopyStatus copied={copied !== null} />
    </>
  )
}
