import { createMiddleware, createStart } from "@tanstack/react-start"
import { pageMarkdown } from "@/lib/agent-content"
import { agentResponse } from "@/lib/agent-responses"

const agentMiddleware = createMiddleware().server(async ({ request, next }) => {
  const response = await agentResponse(request, pageMarkdown)
  if (response) return response

  const result = await next()
  // Pages also answer Accept: text/markdown, so caches must key on Accept.
  if (result.response.headers.get("content-type")?.startsWith("text/html")) {
    result.response.headers.append("vary", "Accept")
  }
  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [agentMiddleware],
}))
