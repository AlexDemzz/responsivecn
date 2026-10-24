import { PAIRS, npxCommand } from "@/components/create/pairs"
import { flattenTree } from "fumadocs-core/page-tree"
import { source } from "@/lib/source"
import { docsSeo } from "@/lib/docs-seo"
import type { DocsEntry } from "@/lib/llms"
import { appName, githubUrl, siteUrl } from "@/lib/shared"
import { createSeo, homeSeo } from "@/lib/seo"

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>

// In sidebar order (content/docs/meta.json), not file order.
export function docsPages(): DocsPage[] {
  const pages = new Map(source.getPages().map((page) => [page.url, page]))
  return flattenTree(source.getPageTree().children).flatMap((node) => {
    const page = pages.get(node.url)
    return page ? [page] : []
  })
}

export function docsEntries(): DocsEntry[] {
  return docsPages().map((page) => ({
    path: page.url,
    title: page.data.title,
    description: docsSeo({
      slugs: page.slugs,
      title: page.data.title,
      description: page.data.description ?? "",
    }).description,
  }))
}

export function indexablePaths(): string[] {
  return [homeSeo.path, createSeo.path, ...docsPages().map((page) => page.url)]
}

export async function docsMarkdown(page: DocsPage): Promise<string> {
  const body = await page.data.getText("processed")
  const description = page.data.description
    ? `\n\n${page.data.description}`
    : ""
  return `# ${page.data.title}${description}\n\n${body.trim()}\n`
}

function homeMarkdown(): string {
  return [
    `# ${appName}`,
    "",
    `${appName} makes shadcn/ui overlays responsive: a Dialog on desktop, a Drawer on a phone. Swap the import and keep every prop, on Base UI or Radix.`,
    "",
    "## Pairs",
    "",
    ...PAIRS.map(
      (pair) =>
        `- [${pair.desktop} → ${pair.mobile}](${siteUrl}/docs/${pair.slug}.md): a ${pair.desktop} at 768px and up, a ${pair.mobile} below. Install: \`${npxCommand(pair.slug)}\``
    ),
    "",
    "## Links",
    "",
    `- [Docs](${siteUrl}/docs.md)`,
    `- [Playground](${siteUrl}/create.md)`,
    `- [llms.txt](${siteUrl}/llms.txt)`,
    `- [Source code](${githubUrl})`,
    "",
  ].join("\n")
}

function createMarkdown(): string {
  return [
    "# Playground",
    "",
    createSeo.description,
    "",
    "The playground is interactive and has no Markdown equivalent. Each pair it previews:",
    "",
    ...PAIRS.map(
      (pair) =>
        `- ${pair.desktop} → ${pair.mobile}: [docs](${siteUrl}/docs/${pair.slug}.md), \`${npxCommand(pair.slug)}\``
    ),
    "",
  ].join("\n")
}

// The Markdown twin of a page, or undefined when the path has none.
export async function pageMarkdown(path: string): Promise<string | undefined> {
  if (path === homeSeo.path) return homeMarkdown()
  if (path === createSeo.path) return createMarkdown()
  const [first, ...slugs] = path.split("/").filter(Boolean)
  if (first !== "docs") return undefined
  const page = source.getPage(slugs)
  return page ? docsMarkdown(page) : undefined
}
