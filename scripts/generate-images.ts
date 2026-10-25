// Renders the favicon set and one Open Graph image per indexable page into
// public/. Runs on prebuild under plain Node (type stripping), so it imports
// app modules by relative path with their `.ts` extension.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import { parseFrontmatter } from "../src/lib/frontmatter.ts"
import { markSvg } from "../src/lib/mark.ts"
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  homeSeo,
  ogImagePath,
} from "../src/lib/seo.ts"
import { appName } from "../src/lib/shared.ts"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const PUBLIC_DIR = join(ROOT, "public")
const DOCS_DIR = join(ROOT, "content/docs")

const BACKGROUND = "#fcfbf9"
const FOREGROUND = "#201e1c"
const MUTED = "#6f6c67"

const DARK_FOREGROUND = "#f2f0ed"

const FAVICON_STYLE = `<style>.mark{fill:${FOREGROUND}}@media (prefers-color-scheme:dark){.mark{fill:${DARK_FOREGROUND}}}</style>`

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
  await writeFile(
    join(PUBLIC_DIR, "favicon.svg"),
    `${markSvg({ color: FOREGROUND, style: FAVICON_STYLE })}\n`
  )
  const favicon = renderPng(markSvg({ color: FOREGROUND }), 32)
  await writeFile(join(PUBLIC_DIR, "favicon.ico"), icoFromPng(favicon, 32))
  // iOS rounds the touch icon itself, so the modal fills it edge to edge.
  await writeFile(
    join(PUBLIC_DIR, "apple-touch-icon.png"),
    renderPng(
      markSvg({ color: FOREGROUND, background: BACKGROUND, fullBleed: true }),
      180
    )
  )
  // Also the maskable icon: padded into the safe zone.
  const padded = markSvg({
    color: FOREGROUND,
    background: BACKGROUND,
    padded: true,
  })
  for (const [file, size] of Object.entries({
    "icon-192.png": 192,
    "icon-512.png": 512,
  })) {
    await writeFile(join(PUBLIC_DIR, file), renderPng(padded, size))
  }
}

type OgPage = {
  path: string
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

function markImage(size: number): ReactElement {
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvg({ color: FOREGROUND })).toString("base64")}`
  return h("img", { width: size, height: size }, undefined, {
    src,
    width: size,
    height: size,
  })
}

// The alexandrejoly.me card: media, then title and description, signed at
// the bottom. Light colour scheme, 80px of padding.
function ogCard(page: OgPage): ReactElement {
  return h(
    "div",
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      // Satori sizes boxes content-box, so the padding would push the
      // signature off the canvas.
      boxSizing: "border-box",
      padding: 80,
      backgroundColor: BACKGROUND,
      color: FOREGROUND,
      fontFamily: "Inter",
    },
    [
      h("div", { display: "flex", flexDirection: "column", gap: 32 }, [
        markImage(128),
        h(
          "div",
          { display: "flex", flexDirection: "column", gap: 16, maxWidth: 960 },
          [
            h(
              "div",
              {
                fontSize: 60,
                fontWeight: 600,
                letterSpacing: -1.5,
                lineHeight: 1.1,
              },
              page.title
            ),
            h(
              "div",
              { fontSize: 30, color: MUTED, lineHeight: 1.375 },
              page.description
            ),
          ]
        ),
      ]),
      h("div", { display: "flex", alignItems: "center", gap: 20 }, [
        markImage(36),
        h("div", { fontSize: 30, fontWeight: 600, lineHeight: 1 }, appName),
      ]),
    ]
  )
}

async function mdxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => join(entry.parentPath, entry.name))
}

async function ogPages(): Promise<OgPage[]> {
  const docs = await Promise.all(
    (await mdxFiles(DOCS_DIR)).map(async (file) => {
      const slug = relative(DOCS_DIR, file)
        .replace(/\.mdx$/, "")
        .replace(/(^|\/)index$/, "")
      const { title, description } = parseFrontmatter(
        await readFile(file, "utf8")
      )
      return {
        path: slug ? `/docs/${slug}` : "/docs",
        title,
        description,
      }
    })
  )
  return [
    {
      path: homeSeo.path,
      title: "Responsive shadcn/ui overlays",
      description: homeSeo.description,
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
