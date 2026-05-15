import { describe, expect, it } from "vitest"

import type { CaptureItem } from "./types"

describe("Capture type contract", () => {
  it("keeps selector and screenshotRef fields", () => {
    const sample: CaptureItem = {
      id: "id",
      url: "https://example.com",
      createdAt: new Date().toISOString(),
      note: "",
      domPath: "body > div",
      selector: "body > div:nth-child(1)",
      html: "<div />",
      css: "",
      computedStyles: {},
      screenshotRef: "capture-id"
    }

    expect(sample.selector).toContain("body")
    expect(sample.screenshotRef).toContain("capture")
  })
})
