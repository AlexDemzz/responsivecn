import { createFileRoute, Link } from "@tanstack/react-router"
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch"

import { buttonVariants } from "@/components/ui/button"
import { DialogDrawerDemo } from "@/components/landing/dialog-drawer-demo"
import { InstallCommand } from "@/components/landing/install-command"
import { githubUrl } from "@/lib/shared"

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "responsivecn — responsive shadcn/ui overlays" },
      {
        name: "description",
        content:
          "shadcn/ui overlays that become their mobile counterpart below 768px. Four pairs, two bases, installable from the @responsivecn registry.",
      },
    ],
  }),
})

// One-time hero entrance: subtle fade-up, staggered per block below.
const enter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:ease-out [animation-fill-mode:both]"

function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center px-6">
      <div className="absolute top-5 right-5">
        <ThemeSwitch />
      </div>
      <section className="flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center">
        <h1
          className={`text-4xl font-semibold tracking-tight sm:text-5xl ${enter}`}
        >
          responsivecn
        </h1>
        <p
          className={`mt-4 max-w-md text-balance text-muted-foreground ${enter} [animation-delay:60ms]`}
        >
          Responsive overlays for shadcn/ui. A centered Dialog on desktop
          becomes a thumb-friendly Drawer below 768px — one drop-in component,
          same props.
        </p>
        <div
          className={`mt-8 flex flex-wrap items-center justify-center gap-2 ${enter} [animation-delay:120ms]`}
        >
          <DialogDrawerDemo />
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              fill="currentColor"
              className="size-4"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
          <a
            href="/create"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Playground
          </a>
          <Link
            to="/docs/$"
            params={{ _splat: "" }}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Docs
          </Link>
        </div>
        <div className={`mt-8 max-w-full ${enter} [animation-delay:180ms]`}>
          <InstallCommand command="npx shadcn add @responsivecn/dialog-drawer" />
        </div>
      </section>
      <footer
        className={`pt-6 pb-8 text-xs text-balance text-muted-foreground [animation-delay:240ms] [animation-fill-mode:both] motion-safe:animate-in motion-safe:duration-500 motion-safe:ease-out motion-safe:fade-in`}
      >
        Dialog → Drawer · Sheet → Drawer · Popover → Drawer · Tooltip → Popover
        — each pair on Base UI and Radix
      </footer>
    </main>
  )
}
