import { describe, expect, it } from "vitest"

import registry from "../../../registry.json"
import { PAIRS, parsePreviewSearch } from "./pairs"

describe("PAIRS", () => {
  it("lists every item the registry ships, in registry order", () => {
    expect(PAIRS.map((pair) => pair.slug)).toEqual(
      registry.items.map((item) => item.name)
    )
  })

  it("names each pair the way the registry titles it", () => {
    expect(PAIRS.map((pair) => `${pair.desktop} ${pair.mobile}`)).toEqual(
      registry.items.map((item) => item.title)
    )
  })
})

describe("parsePreviewSearch", () => {
  it("opens the requested pair when asked to", () => {
    expect(parsePreviewSearch({ pair: "sheet-drawer", open: true })).toEqual({
      pair: "sheet-drawer",
      open: true,
    })
  })

  it("falls back to a closed dialog-drawer for anything else", () => {
    expect(parsePreviewSearch({ pair: "menu-drawer", open: "yes" })).toEqual({
      pair: "dialog-drawer",
      open: false,
    })
  })
})
