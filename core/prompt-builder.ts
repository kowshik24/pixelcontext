import type { CaptureItem } from "./types"

const toComputedBlock = (styles: Record<string, string>) =>
  Object.entries(styles)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")

export const buildPromptMarkdown = (url: string, captures: CaptureItem[]) => {
  const sections = captures.map((capture, idx) => {
    return [
      `## Capture ${idx + 1}`,
      `- Ref: ${capture.screenshotRef}`,
      `- Created: ${capture.createdAt}`,
      `- DOM Path: ${capture.domPath}`,
      `- Screenshot: ${capture.screenshotWidth ?? "?"}x${capture.screenshotHeight ?? "?"}`,
      `- Note: ${capture.note || "(no note)"}`,
      "",
      "### HTML",
      "```html",
      capture.html,
      "```",
      "",
      "### CSS Rules",
      "```css",
      capture.css || "/* unavailable */",
      "```",
      "",
      "### Computed Styles",
      toComputedBlock(capture.computedStyles)
    ].join("\n")
  })

  return [
    "# UI Context Capture",
    "",
    `- Page: ${url}`,
    `- Captures: ${captures.length}`,
    "",
    ...sections
  ].join("\n")
}
