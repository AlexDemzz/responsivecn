const changeListeners = new Set<() => void>()

export function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  })
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: () => void) => {
        changeListeners.add(listener)
      },
      removeEventListener: (_type: string, listener: () => void) => {
        changeListeners.delete(listener)
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

export function resizeViewport(width: number) {
  setViewportWidth(width)
  for (const listener of changeListeners) listener()
}

export const MOBILE_WIDTH = 375
export const DESKTOP_WIDTH = 1024
