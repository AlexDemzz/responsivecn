import * as React from "react"

// Copy text to the clipboard and briefly flag what was copied. `copied` holds
// the key of the last successful copy (defaults to the copied text) and resets
// after `timeout`; pass an explicit key to tell multiple copy targets apart.
export function useCopyToClipboard({ timeout = 2000 } = {}) {
  const [copied, setCopied] = React.useState<string | null>(null)
  const resetTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copy = React.useCallback(
    (text: string, key: string = text) => {
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(key)
          clearTimeout(resetTimer.current)
          resetTimer.current = setTimeout(() => setCopied(null), timeout)
        })
        .catch(() => {})
    },
    [timeout]
  )

  return { copied, copy }
}
