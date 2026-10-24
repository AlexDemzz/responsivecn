import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"

import { buttonVariants } from "@/components/ui/button"
import { GitHubIcon } from "@/components/github-icon"
import { Mark } from "@/components/mark"
import { InstallCommand } from "@/components/landing/install-command"
import { PairStage } from "@/components/landing/pair-stage"
import { DEFAULT_PAIR, PAIRS, npxCommand } from "@/components/create/pairs"
import type { PairSlug } from "@/components/create/pairs"
import type { StageMode } from "@/components/create/viewport"
import { appName, githubUrl } from "@/lib/shared"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "responsivecn — responsive shadcn/ui overlays" },
      {
        name: "description",
        content:
          "shadcn/ui overlays that become their mobile counterpart below 768px: Dialog to Drawer, Sheet to Drawer, Popover to Drawer, Tooltip to Popover. A drop-in for the component you already use, on Base UI or Radix.",
      },
    ],
  }),
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
  const [slug, setSlug] = React.useState<PairSlug>(DEFAULT_PAIR.slug)
  const [mode, setMode] = React.useState<StageMode>("desktop")
  const pair = PAIRS.find((item) => item.slug === slug) ?? DEFAULT_PAIR

  return (
    <main className="flex flex-1 flex-col px-6 pt-12 pb-12 sm:pb-24">
      <header className="mx-auto flex w-full max-w-column flex-col">
        <div className="flex items-center justify-between">
          <Mark
            drawer={mode === "mobile"}
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
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link to="/create" className={buttonVariants({ size: "lg" })}>
            Open the playground
          </Link>
          <Link
            to="/docs/$"
            params={{ _splat: "" }}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Read the docs
          </Link>
        </div>
        <InstallCommand command={npxCommand(pair.slug)} className="mt-4" />
      </header>

      <section
        aria-label="Live demo"
        className="mx-auto mt-8 w-full max-w-breakout"
      >
        <PairStage
          pair={pair}
          onPairChange={setSlug}
          mode={mode}
          onModeChange={setMode}
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

        <Section title="A drop-in">
          <p className="text-pretty text-muted-foreground">
            Change the import, rename the tags, and every prop of your{" "}
            <span className="text-foreground">Dialog</span> keeps working. The
            mobile side follows along; tune it alone through{" "}
            <code className="font-mono text-sm text-foreground">drawer</code> or{" "}
            <code className="font-mono text-sm text-foreground">popover</code>.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-muted p-4 font-mono text-sm leading-relaxed">
            <code>{MIGRATION}</code>
          </pre>
        </Section>

        <Section title="Works on Base UI and Radix">
          <p className="mb-4 text-pretty text-muted-foreground">
            One file per pair, built on the shadcn components you installed, so
            it takes their props and their base.
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
        <Link to="/create" className="link-text">
          Playground
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
