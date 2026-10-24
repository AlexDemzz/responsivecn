import { markdownTwinPath, prefersMarkdown } from "@/lib/markdown-negotiation"
import { canonicalUrl } from "@/lib/seo"
import { siteUrl } from "@/lib/shared"

type ResolveMarkdown = (path: string) => Promise<string | undefined>

const REGISTRY_PREFIX = "/r/"

function notFoundMarkdown(path: string): string {
  return [
    "# Page not found",
    "",
    `Nothing is published at ${canonicalUrl(path)}.`,
    "",
    `Start from [llms.txt](${siteUrl}/llms.txt), which lists every docs page, or the [sitemap](${siteUrl}/sitemap.xml).`,
    "",
  ].join("\n")
}

function markdownResponse(
  markdown: string | undefined,
  path: string,
  headers: HeadersInit
): Response {
  return new Response(markdown ?? notFoundMarkdown(path), {
    status: markdown === undefined ? 404 : 200,
    headers: { "content-type": "text/markdown; charset=utf-8", ...headers },
  })
}

// Static assets answer registry hits before the worker runs, so a request
// that reaches here under /r/ names an item that does not exist.
function registryNotFound(path: string): Response {
  const problem = {
    type: "about:blank",
    title: "Not Found",
    status: 404,
    code: "registry_item_not_found",
    detail: `No registry item is published at ${path}.`,
    resolution: `List the available items at ${siteUrl}/r/registry.json.`,
  }
  return new Response(JSON.stringify(problem), {
    status: 404,
    headers: { "content-type": "application/problem+json" },
  })
}

// The response an agent gets instead of the app's HTML, or undefined when the
// request is the app's to answer.
export async function agentResponse(
  request: Request,
  resolveMarkdown: ResolveMarkdown
): Promise<Response | undefined> {
  if (request.method !== "GET" && request.method !== "HEAD") return undefined
  const { pathname } = new URL(request.url)

  if (pathname.startsWith(REGISTRY_PREFIX)) return registryNotFound(pathname)

  const twin = markdownTwinPath(pathname)
  if (twin !== undefined) {
    return markdownResponse(await resolveMarkdown(twin), twin, {
      link: `<${canonicalUrl(twin)}>; rel="canonical"`,
    })
  }

  if (prefersMarkdown(request.headers.get("accept"))) {
    return markdownResponse(await resolveMarkdown(pathname), pathname, {
      vary: "Accept",
    })
  }

  return undefined
}
