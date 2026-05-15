import { captureElement } from "~core/element-capture"

export const config = {
  matches: ["<all_urls>"],
  run_at: "document_idle" as const
}

type ToggleMessage = { type: "PIXELCONTEXT_TOGGLE_CAPTURE" }
type HighlightMessage = { type: "PIXELCONTEXT_HIGHLIGHT_SELECTOR"; selector: string }
type SetModeMessage = { type: "PIXELCONTEXT_SET_CAPTURE_MODE"; enabled: boolean }

type RuntimeMessage = ToggleMessage | HighlightMessage | SetModeMessage

let captureMode = false
let overlay: HTMLDivElement | null = null
let currentElement: Element | null = null
let rafPending = false
let composer: HTMLDivElement | null = null
let composerInput: HTMLInputElement | null = null
let composerTitle: HTMLSpanElement | null = null
let composerTarget: Element | null = null

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

const ensureComposer = () => {
  if (composer) {
    return composer
  }

  composer = document.createElement("div")
  composer.id = "pixelcontext-quick-composer"
  composer.style.position = "fixed"
  composer.style.zIndex = "2147483647"
  composer.style.background = "#f8fafc"
  composer.style.border = "1px solid #d1d5db"
  composer.style.borderRadius = "16px"
  composer.style.padding = "14px 16px"
  composer.style.boxShadow = "0 10px 28px rgba(0,0,0,.18)"
  composer.style.width = "min(680px, calc(100vw - 40px))"
  composer.style.display = "none"
  composer.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"

  const topRow = document.createElement("div")
  topRow.style.display = "flex"
  topRow.style.alignItems = "center"
  topRow.style.justifyContent = "space-between"
  topRow.style.gap = "8px"
  topRow.style.marginBottom = "10px"

  const titleWrap = document.createElement("div")
  titleWrap.style.display = "flex"
  titleWrap.style.alignItems = "center"
  titleWrap.style.gap = "8px"

  const icon = document.createElement("span")
  icon.textContent = "↱"
  icon.style.color = "#0f766e"
  icon.style.fontWeight = "700"

  composerTitle = document.createElement("span")
  composerTitle.style.fontSize = "24px"
  composerTitle.style.color = "#0f766e"
  composerTitle.style.fontWeight = "500"
  composerTitle.textContent = "element"

  const closeBtn = document.createElement("button")
  closeBtn.type = "button"
  closeBtn.textContent = "×"
  closeBtn.style.appearance = "none"
  closeBtn.style.border = "none"
  closeBtn.style.background = "transparent"
  closeBtn.style.color = "#64748b"
  closeBtn.style.fontSize = "28px"
  closeBtn.style.lineHeight = "1"
  closeBtn.style.cursor = "pointer"
  closeBtn.style.padding = "0 6px"

  titleWrap.append(icon, composerTitle)
  topRow.append(titleWrap, closeBtn)

  const bottomRow = document.createElement("div")
  bottomRow.style.display = "flex"
  bottomRow.style.gap = "10px"
  bottomRow.style.alignItems = "center"

  composerInput = document.createElement("input")
  composerInput.type = "text"
  composerInput.placeholder = "Describe the change"
  composerInput.style.flex = "1"
  composerInput.style.padding = "12px 14px"
  composerInput.style.border = "1px solid #cbd5e1"
  composerInput.style.borderRadius = "12px"
  composerInput.style.fontSize = "18px"
  composerInput.style.color = "#0f172a"
  composerInput.style.background = "#ffffff"
  composerInput.style.caretColor = "#0f172a"
  composerInput.style.fontWeight = "500"
  composerInput.style.outline = "none"

  const submit = document.createElement("button")
  submit.type = "button"
  submit.textContent = "↑"
  submit.style.width = "48px"
  submit.style.height = "48px"
  submit.style.borderRadius = "999px"
  submit.style.border = "none"
  submit.style.background = "#64748b"
  submit.style.color = "#fff"
  submit.style.fontSize = "24px"
  submit.style.fontWeight = "700"
  submit.style.cursor = "pointer"

  const close = () => {
    if (composer) {
      composer.style.display = "none"
    }
    composerTarget = null
    if (composerInput) {
      composerInput.value = ""
    }
  }

  closeBtn.addEventListener("click", close)

  const submitCapture = async () => {
    if (!composerTarget) {
      close()
      return
    }
    const note = composerInput?.value?.trim() ?? ""
    const capture = await captureElement(composerTarget)
    capture.note = note
    await chrome.runtime.sendMessage({ type: "PIXELCONTEXT_CAPTURE_ADDED", payload: capture })
    close()
  }

  submit.addEventListener("click", () => {
    submitCapture().catch(() => close())
  })

  composerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      submitCapture().catch(() => close())
    }
    if (event.key === "Escape") {
      event.preventDefault()
      close()
    }
  })

  bottomRow.append(composerInput, submit)
  composer.append(topRow, bottomRow)
  document.documentElement.appendChild(composer)

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close()
    }
  })

  return composer
}

const closeComposer = () => {
  if (composer) {
    composer.style.display = "none"
  }
  composerTarget = null
  if (composerInput) {
    composerInput.value = ""
  }
}

const openComposer = (target: Element) => {
  const node = ensureComposer()
  composerTarget = target
  if (composerTitle) {
    composerTitle.textContent = target.tagName.toLowerCase()
  }
  if (composerInput) {
    composerInput.value = ""
  }

  const rect = target.getBoundingClientRect()
  const desiredTop = Math.max(16, rect.top - 132)
  const desiredLeft = Math.min(window.innerWidth - node.offsetWidth - 16, Math.max(16, rect.left))
  node.style.left = `${desiredLeft}px`
  node.style.top = `${desiredTop}px`
  node.style.display = "block"

  composerInput?.focus()
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

  const target = document.elementFromPoint(event.clientX, event.clientY)
  if (
    !target ||
    (target instanceof Element &&
      (target.id === "pixelcontext-sidebar-host" ||
        Boolean(target.closest("#pixelcontext-sidebar-host")) ||
        target.id === "pixelcontext-quick-composer" ||
        Boolean(target.closest("#pixelcontext-quick-composer"))))
  ) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  openComposer(target)
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
    closeComposer()
    drawOverlay(null)
  }

  chrome.runtime.sendMessage({ type: "PIXELCONTEXT_CAPTURE_MODE", enabled }).catch(() => undefined)
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === "PIXELCONTEXT_TOGGLE_CAPTURE") {
    setMode(!captureMode)
    return
  }

  if (message.type === "PIXELCONTEXT_SET_CAPTURE_MODE") {
    setMode(Boolean(message.enabled))
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
ensureComposer()

const CaptureOverlayEntry = () => null

export default CaptureOverlayEntry
