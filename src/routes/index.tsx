import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { MonitorIcon, SmartphoneIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { GitHubIcon } from "@/components/github-icon"
import { Mark } from "@/components/mark"
import { InstallCommand } from "@/components/landing/install-command"
import { Playground } from "@/components/create/playground"
import {
  BREAKPOINT,
  DEFAULT_PAIR,
  DEFAULT_WIDTH,
  PAIRS,
  npxCommand,
  pairByDesktop,
} from "@/components/create/pairs"
import type { DesktopName } from "@/components/create/pairs"
import { appName, githubUrl } from "@/lib/shared"
import { homeJsonLd, homeSeo, pageHead } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({
  component: Home,
  head: () => pageHead({ ...homeSeo, jsonLd: homeJsonLd() }),
})

const BASES = [
  {
    name: "Base UI",
    description: "shadcn’s default base. The mobile side is Base UI’s Drawer.",
  },
  {
    name: "Radix",
    description: "The mobile side is the Vaul Drawer that shadcn ships.",
  },
  {
    name: "React Aria",
    description:
      "Not supported: its shadcn components have a different set of parts.",
  },
] as const

// The width the Desktop toggle sets: the smallest common laptop viewport.
const DESKTOP_WIDTH = 1024

const MIGRATION = `import {
  DialogDrawer,
  DialogDrawerContent,
  DialogDrawerTrigger,
} from "@/components/ui/dialog-drawer"

<DialogDrawer>
  <DialogDrawerTrigger>Edit profile</DialogDrawerTrigger>
  <DialogDrawerContent drawer={{ className: "max-h-[85svh]" }}>
    …
  </DialogDrawerContent>
</DialogDrawer>`

function Home() {
  const [desktop, setDesktop] = React.useState<DesktopName>(
    DEFAULT_PAIR.desktop
  )
  const [width, setWidth] = React.useState(DEFAULT_WIDTH)
  const pair = pairByDesktop(desktop)

  return (
    <main className="flex flex-1 flex-col px-6 pt-12 pb-12 sm:pb-24">
      <header className="mx-auto flex w-full max-w-column flex-col">
        <div className="flex items-center justify-between">
          <Mark
            drawer={width < BREAKPOINT}
            className="size-10 [stroke-width:1.2] text-foreground"
          />
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="responsivecn on GitHub"
            className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
          >
            <GitHubIcon />
          </a>
        </div>
        <div className="mt-6 text-xl leading-[1.625] text-balance text-muted-foreground">
          <h1 className="inline font-medium text-foreground">{appName}</h1>{" "}
          makes shadcn/ui overlays responsive: a Dialog on desktop, a Drawer on
          a phone. Swap the import and keep every prop, on Base UI or Radix.
        </div>
        <Link
          to="/docs/$"
          params={{ _splat: "" }}
          className={buttonVariants({ size: "lg", className: "mt-5 w-fit" })}
        >
          Read the docs
        </Link>
        <InstallCommand command={npxCommand(pair.slug)} className="mt-4" />
      </header>

      <section
        aria-label="Playground"
        className="mx-auto mt-8 w-full max-w-breakout"
      >
        <Playground
          desktop={desktop}
          onDesktopChange={setDesktop}
          width={width}
          onWidthChange={setWidth}
          trailing={
            <ViewportToggle
              mobile={width < BREAKPOINT}
              onChange={(mobile) =>
                setWidth(mobile ? DEFAULT_WIDTH : DESKTOP_WIDTH)
              }
            />
          }
          className="h-[34rem] rounded-2xl border bg-background bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:20px_20px]"
        />
      </section>

      <div className="mx-auto mt-10 flex w-full max-w-column flex-col">
        <Section title="Pairs">
          <ul>
            {PAIRS.map((item) => (
              <Row key={item.slug}>
                <Link
                  to="/docs/$"
                  params={{ _splat: item.slug }}
                  className="group/row flex flex-col"
                >
                  <RowTitle>
                    {item.desktop}
                    {item.mobile}
                  </RowTitle>
                  <span className="text-muted-foreground">
                    A {item.desktop} at 768px and up, a {item.mobile} below.
                  </span>
                </Link>
              </Row>
            ))}
          </ul>
        </Section>

        <Section title="Drop-in replacement">
          <p className="text-pretty text-muted-foreground">
            Change the import, rename the tags, and every prop of your{" "}
            <span className="text-foreground">Dialog</span> keeps working. Props
            both sides share reach the mobile side too; to change it alone, use{" "}
            <code className="font-mono text-sm text-foreground">drawer</code> or{" "}
            <code className="font-mono text-sm text-foreground">popover</code>.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-muted p-4 font-mono text-sm leading-relaxed">
            <code>{MIGRATION}</code>
          </pre>
        </Section>

        <Section title="Works on Base UI and Radix">
          <p className="mb-4 text-pretty text-muted-foreground">
            One file per pair, built on the shadcn components you already
            installed, so it takes their props and runs on their base.
          </p>
          <ul>
            {BASES.map((base) => (
              <Row key={base.name}>
                <div className="flex flex-col">
                  <span className="font-book">{base.name}</span>
                  <span className="text-pretty text-muted-foreground">
                    {base.description}
                  </span>
                </div>
              </Row>
            ))}
          </ul>
        </Section>
      </div>

      <footer className="mx-auto mt-auto flex w-full max-w-column flex-wrap gap-x-4 gap-y-1 pt-16 text-sm text-muted-foreground">
        <span>{appName}</span>
        <Link to="/docs/$" params={{ _splat: "" }} className="link-text">
          Docs
        </Link>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-text"
        >
          GitHub
        </a>
      </footer>
    </main>
  )
}

function ViewportToggle({
  mobile,
  onChange,
}: {
  mobile: boolean
  onChange: (mobile: boolean) => void
}) {
  return (
    <ToggleGroup
      aria-label="Viewport"
      value={[mobile ? "mobile" : "desktop"]}
      onValueChange={([next]) => {
        if (next === "desktop" || next === "mobile") onChange(next === "mobile")
      }}
      variant="outline"
      size="sm"
      spacing={0}
      className="ms-auto"
    >
      <ToggleGroupItem value="desktop" aria-label="Desktop, 768px and up">
        <MonitorIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="mobile" aria-label="Mobile, below 768px">
        <SmartphoneIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <section aria-labelledby={id} className="py-10">
      <h2 id={id} className="mb-4 text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-b py-3.5 leading-[1.625] first:pt-0 last:border-b-0 last:pb-0">
      {children}
    </li>
  )
}

function RowTitle({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "w-fit font-book text-foreground underline decoration-transparent underline-offset-3 transition-[text-decoration-color] duration-200 ease-out",
        "group-focus-visible/row:decoration-underline can-hover:group-hover/row:decoration-underline"
      )}
    >
      {children}
    </span>
  )
}
