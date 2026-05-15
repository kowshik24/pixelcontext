import { describe, expect, it } from "vitest"

import { buildPromptMarkdown } from "./prompt-builder"
import type { CaptureItem } from "./types"

describe("buildPromptMarkdown", () => {
  it("renders numbered sections and metadata", () => {
    const captures: CaptureItem[] = [
      {
        id: "1",
        url: "https://example.com",
        createdAt: "2026-05-16T00:00:00.000Z",
        note: "Button misaligned",
        domPath: "body > main > button",
        selector: "body > main:nth-child(1) > button:nth-child(1)",
        html: "<button>Click</button>",
        css: "button { color: red; }",
        computedStyles: { color: "rgb(255, 0, 0)" },
        screenshotRef: "capture-1",
        screenshotWidth: 300,
        screenshotHeight: 120
      }
    ]

    const output = buildPromptMarkdown("https://example.com", captures)

    expect(output).toContain("# UI Context Capture")
    expect(output).toContain("## Capture 1")
    expect(output).toContain("Ref: capture-1")
    expect(output).toContain("Button misaligned")
  })
})
