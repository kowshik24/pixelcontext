import { toPng } from "html-to-image"

import { extractCssContext } from "./css-extractor"
import type { CaptureItem } from "./types"

const MAX_HTML_LINES = 200
const MAX_SHOT_WIDTH = 300

const truncateHtml = (html: string) => {
  const lines = html.split("\n")
  if (lines.length <= MAX_HTML_LINES) {
    return html
  }

  return [...lines.slice(0, MAX_HTML_LINES), "<!-- truncated -->"].join("\n")
}

const buildDomPath = (element: Element) => {
  const parts: string[] = []
  let current: Element | null = element

  while (current && parts.length < 8) {
    const tag = current.tagName.toLowerCase()
    const id = current.id ? `#${current.id}` : ""
    const cls = current.classList.length ? `.${Array.from(current.classList).slice(0, 2).join(".")}` : ""
    parts.unshift(`${tag}${id}${cls}`)
    current = current.parentElement
  }

  return parts.join(" > ")
}

const buildSelectorPath = (element: Element) => {
  if (element === document.body) {
    return "body"
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== document.body) {
    const parent = current.parentElement
    if (!parent) {
      break
    }
    const index = Array.from(parent.children).indexOf(current) + 1
    parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`)
    current = parent
  }

  if (!parts.length) {
    return element.tagName.toLowerCase()
  }

  return `body > ${parts.join(" > ")}`
}

const resizeDataUrl = async (dataUrl: string, width: number, height: number) => {
  if (width <= MAX_SHOT_WIDTH) {
    return { dataUrl, width, height }
  }

  const nextWidth = MAX_SHOT_WIDTH
  const nextHeight = Math.round((height * nextWidth) / width)

  const img = new Image()
  img.src = dataUrl

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Unable to load screenshot for resize"))
  })

  const canvas = document.createElement("canvas")
  canvas.width = nextWidth
  canvas.height = nextHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return { dataUrl, width, height }
  }
  ctx.drawImage(img, 0, 0, nextWidth, nextHeight)

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: nextWidth,
    height: nextHeight
  }
}

export const captureElement = async (element: Element): Promise<CaptureItem> => {
  const id = crypto.randomUUID()
  const { css, computed } = extractCssContext(element)

  let screenshotDataUrl: string | undefined
  let screenshotWidth: number | undefined
  let screenshotHeight: number | undefined

  try {
    const rawDataUrl = await toPng(element as HTMLElement, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: "#ffffff",
      fontEmbedCSS: ""
    })
    const rect = element.getBoundingClientRect()
    const resized = await resizeDataUrl(rawDataUrl, rect.width, rect.height)
    screenshotDataUrl = resized.dataUrl
    screenshotWidth = resized.width
    screenshotHeight = resized.height
  } catch {
    // Screenshot is best-effort for MVP.
  }

  return {
    id,
    url: location.href,
    createdAt: new Date().toISOString(),
    note: "",
    domPath: buildDomPath(element),
    selector: buildSelectorPath(element),
    html: truncateHtml((element as HTMLElement).outerHTML),
    css,
    computedStyles: computed,
    screenshotRef: `capture-${id}`,
    screenshotDataUrl,
    screenshotWidth,
    screenshotHeight
  }
}
