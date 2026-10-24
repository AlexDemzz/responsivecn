import { describe, expect, it } from "vitest"
import { agentResponse } from "./agent-responses"

const pages: Record<string, string> = {
  "/": "# responsivecn\n",
  "/docs/dialog-drawer": "# DialogDrawer\n",
}

async function resolve(path: string) {
  return pages[path]
}

function get(path: string, accept?: string): Request {
  return new Request(`https://responsive-cn.dev${path}`, {
    headers: accept ? { accept } : {},
  })
}

describe("agentResponse", () => {
  it("answers Accept: text/markdown with the page's Markdown at its own URL", async () => {
    const response = await agentResponse(get("/", "text/markdown"), resolve)
    expect(response?.status).toBe(200)
    expect(response?.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8"
    )
    expect(response?.headers.get("vary")).toBe("Accept")
    expect(await response?.text()).toBe("# responsivecn\n")
  })

  it("serves the .md twin and points search engines at the HTML page", async () => {
    const response = await agentResponse(get("/docs/dialog-drawer.md"), resolve)
    expect(response?.status).toBe(200)
    expect(await response?.text()).toBe("# DialogDrawer\n")
    expect(response?.headers.get("link")).toBe(
      '<https://responsive-cn.dev/docs/dialog-drawer>; rel="canonical"'
    )
  })

  it("returns a Markdown 404 that leads back to llms.txt", async () => {
    const response = await agentResponse(
      get("/docs/missing", "text/markdown"),
      resolve
    )
    expect(response?.status).toBe(404)
    expect(await response?.text()).toContain(
      "https://responsive-cn.dev/llms.txt"
    )
  })

  it("leaves browser requests to the app", async () => {
    expect(
      await agentResponse(get("/", "text/html,*/*;q=0.8"), resolve)
    ).toBeUndefined()
  })

  it("answers a missing registry item with a JSON problem", async () => {
    const response = await agentResponse(get("/r/carousel-sheet.json"), resolve)
    expect(response?.status).toBe(404)
    expect(response?.headers.get("content-type")).toBe(
      "application/problem+json"
    )
    const problem = await response?.json()
    expect(problem).toMatchObject({
      status: 404,
      code: "registry_item_not_found",
    })
    expect(problem.resolution).toContain(
      "https://responsive-cn.dev/r/registry.json"
    )
  })
})
