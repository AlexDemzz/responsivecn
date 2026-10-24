import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { PairDemo } from "@/components/create/demos"
import { parsePreviewSearch } from "@/components/create/pairs"

// The /create canvas embeds this route in an iframe. The iframe window IS
// the viewport the registry components' use-mobile hook reads, so resizing
// the canvas honestly drives the 768px swap inside the real components.
export const Route = createFileRoute("/preview")({
  validateSearch: parsePreviewSearch,
  head: () => ({
    meta: [
      { title: "Preview | responsivecn" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewPage,
})

function PreviewPage() {
  const { pair, open } = Route.useSearch()
  // Mount-gate the demo: the SSR'd shell stays search-param agnostic, so a
  // prerendered /preview served with any ?pair= hydrates without mismatch.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center">
      {mounted ? <PairDemo slug={pair} open={open} /> : null}
    </main>
  )
}
