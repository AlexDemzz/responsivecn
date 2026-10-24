import { describe, expect, it } from "vitest"
import { llmsFullTxt, llmsTxt } from "./llms"
import { sitemapXml } from "./sitemap"

const docs = [
  {
    path: "/docs",
    title: "Introduction",
    description: "Responsive shadcn/ui overlays.",
  },
  {
    path: "/docs/dialog-drawer",
    title: "DialogDrawer",
    description: "A centered Dialog at desktop.",
  },
]

describe("llmsTxt", () => {
  const text = llmsTxt(docs)

  it("opens with the H1 and the blockquote summary the format requires", () => {
    const [h1, blank, summary] = text.split("\n")
    expect(h1).toBe("# responsivecn")
    expect(blank).toBe("")
    expect(summary.startsWith("> ")).toBe(true)
  })

  it("links each docs page to its Markdown twin", () => {
    expect(text).toContain(
      "- [DialogDrawer](https://responsive-cn.dev/docs/dialog-drawer.md): A centered Dialog at desktop."
    )
    expect(text).toContain(
      "- [Introduction](https://responsive-cn.dev/docs.md): Responsive shadcn/ui overlays."
    )
  })

  it("lists the installable registry items", () => {
    expect(text).toContain("https://responsive-cn.dev/r/registry.json")
    for (const slug of [
      "dialog-drawer",
      "sheet-drawer",
      "popover-drawer",
      "tooltip-popover",
    ]) {
      expect(text).toContain(`https://responsive-cn.dev/r/${slug}.json`)
    }
  })

  it("tells agents when to reach for the registry", () => {
    expect(text).toMatch(/^## When to use$/m)
  })
})

describe("llmsFullTxt", () => {
  it("joins every page's Markdown under its canonical URL", () => {
    const text = llmsFullTxt([
      { url: "https://responsive-cn.dev/docs", markdown: "# Introduction" },
      { url: "https://responsive-cn.dev/docs/x", markdown: "# X" },
    ])
    expect(text.indexOf("# Introduction")).toBeLessThan(text.indexOf("# X"))
    expect(text).toContain("Source: https://responsive-cn.dev/docs/x")
  })
})

describe("sitemapXml", () => {
  it("lists absolute canonical URLs in a urlset", () => {
    const xml = sitemapXml(["/", "/docs/dialog-drawer"])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    )
    expect(xml).toContain("<loc>https://responsive-cn.dev/</loc>")
    expect(xml).toContain(
      "<loc>https://responsive-cn.dev/docs/dialog-drawer</loc>"
    )
  })

  it("escapes XML special characters", () => {
    expect(sitemapXml(["/a&b"])).toContain(
      "<loc>https://responsive-cn.dev/a&amp;b</loc>"
    )
  })
})
