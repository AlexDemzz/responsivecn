import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page"
import { useFumadocsLoader } from "fumadocs-core/source/client"
import { Suspense } from "react"
import browserCollections from "collections/browser"
import { source } from "@/lib/source"
import { baseOptions } from "@/lib/layout.shared"
import { legacyDocsRedirect } from "@/lib/legacy-docs"
import { useMDXComponents } from "@/components/mdx"

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/").filter(Boolean) ?? []
    const target = legacyDocsRedirect(slugs)
    if (target !== undefined) {
      throw redirect({
        to: "/docs/$",
        params: { _splat: target },
        statusCode: 301,
      })
    }
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
})

const serverLoader = createServerFn({ method: "GET" })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc} className="max-w-3xl">
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription className="text-sm">
          {frontmatter.description}
        </DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const { path, pageTree } = useFumadocsLoader(Route.useLoaderData())

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense>{clientLoader.useContent(path)}</Suspense>
    </DocsLayout>
  )
}
