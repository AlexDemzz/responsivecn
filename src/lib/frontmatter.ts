// Reads the two frontmatter fields every docs page sets. Shared with
// scripts/generate-images.ts, which runs under plain Node without the MDX
// pipeline.
export type DocsFrontmatter = { title: string; description: string }

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/

function field(block: string, name: string): string {
  const match = new RegExp(`^${name}:\\s*(.+)$`, "m").exec(block)
  if (!match?.[1]) throw new Error(`Frontmatter is missing "${name}"`)
  return match[1].trim().replace(/^(["'])(.*)\1$/, "$2")
}

export function parseFrontmatter(source: string): DocsFrontmatter {
  const block = FRONTMATTER.exec(source)?.[1]
  if (block === undefined) throw new Error("Page has no frontmatter block")
  return {
    title: field(block, "title"),
    description: field(block, "description"),
  }
}
