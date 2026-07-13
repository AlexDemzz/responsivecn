import { createFileRoute, Link } from "@tanstack/react-router"
import { HomeLayout } from "fumadocs-ui/layouts/home"
import { baseOptions } from "@/lib/layout.shared"
import { buttonVariants } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">responsivecn</h1>
        <p className="text-muted-foreground max-w-md text-balance">
          Responsive shadcn/ui overlays: a centered Dialog on desktop, a
          thumb-friendly Drawer on mobile. One drop-in component.
        </p>
        <Link
          to="/docs/$"
          params={{ _splat: "" }}
          className={buttonVariants({ size: "lg" })}
        >
          Read the docs
        </Link>
      </main>
    </HomeLayout>
  )
}
