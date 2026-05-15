import { captureElement } from "~core/element-capture"

export const config = {
  matches: ["<all_urls>"],
  run_at: "document_idle" as const
}

type ToggleMessage = { type: "PIXELCONTEXT_TOGGLE_CAPTURE" }
type HighlightMessage = { type: "PIXELCONTEXT_HIGHLIGHT_SELECTOR"; selector: string }

type RuntimeMessage = ToggleMessage | HighlightMessage

let captureMode = false
let overlay: HTMLDivElement | null = null
let currentElement: Element | null = null
let rafPending = false

const ensureOverlay = () => {
  if (overlay) {
    return overlay
  }

  overlay = document.createElement("div")
  overlay.id = "pixelcontext-capture-overlay"
  overlay.style.position = "fixed"
  overlay.style.zIndex = "2147483647"
  overlay.style.pointerEvents = "none"
  overlay.style.border = "2px solid #2563eb"
  overlay.style.background = "rgba(37, 99, 235, 0.12)"
  overlay.style.display = "none"
  overlay.style.boxSizing = "border-box"
  overlay.style.transition = "all 40ms linear"
  document.documentElement.appendChild(overlay)

  return overlay
}

const drawOverlay = (target: Element | null) => {
  if (!captureMode || !target || !overlay) {
    if (overlay) {
      overlay.style.display = "none"
    }
    return
  }

  const rect = target.getBoundingClientRect()
  overlay.style.display = "block"
  overlay.style.left = `${rect.left}px`
  overlay.style.top = `${rect.top}px`
  overlay.style.width = `${rect.width}px`
  overlay.style.height = `${rect.height}px`
}

const onMove = (event: MouseEvent) => {
  if (!captureMode) {
    return
  }

  currentElement = document.elementFromPoint(event.clientX, event.clientY)
  if (rafPending) {
    return
  }

  rafPending = true
  requestAnimationFrame(() => {
    rafPending = false
    drawOverlay(currentElement)
  })
}

const onClick = async (event: MouseEvent) => {
  if (!captureMode) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const target = document.elementFromPoint(event.clientX, event.clientY)
  if (
    !target ||
    (target instanceof Element &&
      (target.id === "pixelcontext-sidebar-host" || Boolean(target.closest("#pixelcontext-sidebar-host"))))
  ) {
    return
  }

  const capture = await captureElement(target)
  await chrome.runtime.sendMessage({ type: "PIXELCONTEXT_CAPTURE_ADDED", payload: capture })
}

const setMode = (enabled: boolean) => {
  captureMode = enabled
  ensureOverlay()

  if (enabled) {
    document.addEventListener("mousemove", onMove, true)
    document.addEventListener("click", onClick, true)
  } else {
    document.removeEventListener("mousemove", onMove, true)
    document.removeEventListener("click", onClick, true)
    drawOverlay(null)
  }

  chrome.runtime.sendMessage({ type: "PIXELCONTEXT_CAPTURE_MODE", enabled }).catch(() => undefined)
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === "PIXELCONTEXT_TOGGLE_CAPTURE") {
    setMode(!captureMode)
    return
  }

  if (message.type === "PIXELCONTEXT_HIGHLIGHT_SELECTOR") {
    const element = document.querySelector(message.selector)
    if (!element) {
      return
    }
    ensureOverlay()
    const prevMode = captureMode
    captureMode = true
    drawOverlay(element)
    setTimeout(() => {
      if (!prevMode) {
        captureMode = false
        drawOverlay(null)
      }
    }, 1200)
  }
})

ensureOverlay()
