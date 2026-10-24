// Renders the favicon set and one Open Graph image per indexable page into
// public/. Runs on prebuild under plain Node (type stripping), so it imports
// app modules by relative path with their `.ts` extension.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import { parseFrontmatter } from "../src/lib/frontmatter.ts"
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  createSeo,
  homeSeo,
  ogImagePath,
} from "../src/lib/seo.ts"
import { siteUrl } from "../src/lib/shared.ts"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const PUBLIC_DIR = join(ROOT, "public")
const DOCS_DIR = join(ROOT, "content/docs")

const BACKGROUND = "#fcfbf9"
const FOREGROUND = "#201e1c"
const MUTED = "#6f6c67"

const DIALOG_PATH =
  "M7 8h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"

function markSvg({ padded }: { padded: boolean }): string {
  const viewBox = padded ? "0 0 24 24" : "4 4 16 16"
  const background = padded
    ? `<rect width="24" height="24" fill="${BACKGROUND}"/>`
    : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="${FOREGROUND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${background}<path d="${DIALOG_PATH}"/></svg>`
}

function renderPng(svg: string, width: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } })
    .render()
    .asPng()
}

// An ICO file may hold PNG data as-is: one 6-byte header, one 16-byte entry.
function icoFromPng(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(size, 6)
  header.writeUInt8(size, 7)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18)
  return Buffer.concat([header, png])
}

async function writeIcons(): Promise<void> {
  const favicon = renderPng(markSvg({ padded: false }), 32)
  await writeFile(join(PUBLIC_DIR, "favicon.ico"), icoFromPng(favicon, 32))
  const padded = markSvg({ padded: true })
  const sizes = {
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
  }
  for (const [file, size] of Object.entries(sizes)) {
    await writeFile(join(PUBLIC_DIR, file), renderPng(padded, size))
  }
}

type OgPage = {
  path: string
  eyebrow: string
  title: string
  description: string
}

function h(
  type: string,
  style: CSSProperties,
  children?: ReactNode,
  props: Record<string, unknown> = {}
): ReactElement {
  return { type, key: null, props: { style, children, ...props } }
}

function ogCard(page: OgPage): ReactElement {
  const mark = `data:image/svg+xml;base64,${Buffer.from(markSvg({ padded: false })).toString("base64")}`
  const frame = {
    width: "100%",
    height: "100%",
    display: "flex",
    backgroundColor: BACKGROUND,
    color: FOREGROUND,
    fontFamily: "Inter",
  } satisfies CSSProperties
  return h("div", frame, [
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexGrow: 1,
        margin: 72,
      },
      [
        h("div", { display: "flex", alignItems: "center", gap: 20 }, [
          h("img", { width: 56, height: 56 }, undefined, {
            src: mark,
            width: 56,
            height: 56,
          }),
          h("div", { fontSize: 36, fontWeight: 500 }, "responsivecn"),
        ]),
        h("div", { display: "flex", flexDirection: "column", gap: 20 }, [
          h("div", { fontSize: 28, color: MUTED }, page.eyebrow),
          h(
            "div",
            {
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.1,
            },
            page.title
          ),
          h(
            "div",
            { fontSize: 30, color: MUTED, lineHeight: 1.4, maxWidth: 980 },
            page.description
          ),
        ]),
        h("div", { fontSize: 26, color: MUTED }, new URL(siteUrl).host),
      ]
    ),
  ])
}

function eyebrowForSlug(slug: string): string {
  if (slug === "index") return "Docs"
  const [desktop = "", mobile = ""] = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  return `${desktop} to ${mobile}`
}

async function ogPages(): Promise<OgPage[]> {
  const files = (await readdir(DOCS_DIR)).filter((file) =>
    file.endsWith(".mdx")
  )
  const docs = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.mdx$/, "")
      const { title, description } = parseFrontmatter(
        await readFile(join(DOCS_DIR, file), "utf8")
      )
      return {
        path: slug === "index" ? "/docs" : `/docs/${slug}`,
        eyebrow: eyebrowForSlug(slug),
        title,
        description,
      }
    })
  )
  return [
    {
      path: homeSeo.path,
      eyebrow: "shadcn/ui registry",
      title: "Responsive shadcn/ui overlays",
      description: homeSeo.description,
    },
    {
      path: createSeo.path,
      eyebrow: "Playground",
      title: "Watch each pair swap at 768px",
      description: createSeo.description,
    },
    ...docs,
  ]
}

async function loadFonts() {
  const weights = [400, 500, 600] as const
  return Promise.all(
    weights.map(async (weight) => ({
      name: "Inter",
      weight,
      style: "normal" as const,
      data: await readFile(
        fileURLToPath(
          import.meta.resolve(
            `@fontsource/inter/files/inter-latin-${weight}-normal.woff`
          )
        )
      ),
    }))
  )
}

async function writeOgImages(): Promise<void> {
  const fonts = await loadFonts()
  for (const page of await ogPages()) {
    const svg = await satori(ogCard(page), {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      fonts,
    })
    const file = join(PUBLIC_DIR, ogImagePath(page.path))
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, renderPng(svg, OG_IMAGE_WIDTH))
  }
}

await writeIcons()
await writeOgImages()
