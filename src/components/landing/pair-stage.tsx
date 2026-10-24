import * as React from "react"
import { Link } from "@tanstack/react-router"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useElementSize } from "@/hooks/use-element-size"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PAIRS } from "@/components/create/pairs"
import type { Pair, PairSlug } from "@/components/create/pairs"
import { stageViewport } from "@/components/create/viewport"
import type { StageMode } from "@/components/create/viewport"

const STAGE_HEIGHT_CLASS = "h-[21rem] sm:h-[22rem]"
// Long enough to read the open desktop overlay before it turns mobile.
const AUTO_SWITCH_DELAY = 2600

export function PairStage({
  pair,
  onPairChange,
  mode,
  onModeChange,
}: {
  pair: Pair
  onPairChange: (slug: PairSlug) => void
  mode: StageMode
  onModeChange: (mode: StageMode) => void
}) {
  const touched = React.useRef(false)
  const [stageLoaded, setStageLoaded] = React.useState(false)
  const switchToMobile = React.useEffectEvent(() => {
    if (!touched.current) onModeChange("mobile")
  })

  // One unattended switch shows the swap before anyone clicks; any choice
  // the visitor makes cancels it.
  React.useEffect(() => {
    if (!stageLoaded) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setTimeout(switchToMobile, AUTO_SWITCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [stageLoaded])

  const chooseMode = (next: StageMode) => {
    touched.current = true
    onModeChange(next)
  }

  return (
    <Tabs
      value={pair.slug}
      onValueChange={(value: PairSlug) => {
        touched.current = true
        onPairChange(value)
      }}
      className="gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList aria-label="Pair">
          {PAIRS.map((item) => (
            <TabsTrigger key={item.slug} value={item.slug} className="px-2.5">
              {item.desktop}
            </TabsTrigger>
          ))}
        </TabsList>
        <ToggleGroup
          aria-label="Viewport"
          value={[mode]}
          onValueChange={([next]) => {
            if (next === "desktop" || next === "mobile") chooseMode(next)
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="desktop" aria-label="Desktop, 768px and up">
            <MonitorIcon data-icon="inline-start" />
            Desktop
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label="Mobile, under 768px">
            <SmartphoneIcon data-icon="inline-start" />
            Mobile
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {PAIRS.map((item) => (
        <TabsContent key={item.slug} value={item.slug}>
          <StageFrame
            pair={item}
            mode={mode}
            onLoad={() => setStageLoaded(true)}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function StageFrame({
  pair,
  mode,
  onLoad,
}: {
  pair: Pair
  mode: StageMode
  onLoad: () => void
}) {
  const [stageRef, size] = useElementSize<HTMLDivElement>()
  const [loaded, setLoaded] = React.useState(false)

  const viewport = size.width > 0 ? stageViewport(mode, size.width) : null
  const side = mode === "desktop" ? pair.desktop : pair.mobile

  return (
    <figure className="flex flex-col gap-3">
      <div
        ref={stageRef}
        className={cn("flex justify-center", STAGE_HEIGHT_CLASS)}
      >
        <div
          className="relative h-full overflow-clip rounded-2xl border bg-background transition-[width] duration-500 ease-move motion-reduce:transition-none"
          style={{ width: viewport ? viewport.frameWidth : "100%" }}
        >
          {viewport ? (
            <div
              className="absolute top-0 left-1/2 h-full -translate-x-1/2"
              style={{ width: viewport.frameWidth }}
            >
              {/* zoom, not scale: the iframe re-renders at the smaller size
                  (crisp text, no backdrop-blur seams) while its own window
                  keeps the logical width use-mobile reads. */}
              <iframe
                src={`/preview?pair=${pair.slug}&open=true`}
                title={`${pair.desktop}${pair.mobile} at ${viewport.logicalWidth}px`}
                onLoad={() => {
                  setLoaded(true)
                  onLoad()
                }}
                style={{
                  width: viewport.logicalWidth,
                  height: Math.round(size.height / viewport.scale),
                  zoom: viewport.scale,
                }}
                className={cn(
                  "border-0 transition-opacity duration-300 ease-out",
                  loaded ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          ) : null}
        </div>
      </div>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <span className="text-foreground tabular-nums">
            {viewport?.logicalWidth ?? "—"}px
          </span>{" "}
          renders the {side}
        </span>
        <Link to="/create" className="link-text">
          Resize it yourself
        </Link>
      </figcaption>
    </figure>
  )
}
