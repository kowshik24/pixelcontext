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
let composerSubmit: HTMLButtonElement | null = null
let composerClosing = false
let submitInFlight = false

const ensureOverlay = () => {
  if (overlay) {
    return overlay
  }

  overlay = document.createElement("div")
  overlay.id = "pixelcontext-capture-overlay"
  overlay.style.position = "fixed"
  overlay.style.zIndex = "2147483647"
  overlay.style.pointerEvents = "none"
  overlay.style.border = "2px dashed #6a4dff"
  overlay.style.background = "rgba(106, 77, 255, 0.12)"
  overlay.style.display = "none"
  overlay.style.boxSizing = "border-box"
  overlay.style.transition = "all 40ms linear"
  overlay.style.borderRadius = "8px"
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

const highlightSelector = (selector: string) => {
  const element = document.querySelector(selector)
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

const ensureComposer = () => {
  if (composer) {
    return composer
  }

  composer = document.createElement("div")
  composer.id = "pixelcontext-quick-composer"
  composer.style.position = "fixed"
  composer.style.zIndex = "2147483647"
  composer.style.background = "#ffffff"
  composer.style.border = "1px solid #d7ddef"
  composer.style.borderRadius = "14px"
  composer.style.padding = "12px 14px"
  composer.style.boxShadow = "0 18px 40px rgba(18,23,43,.25)"
  composer.style.width = "min(680px, calc(100vw - 40px))"
  composer.style.display = "none"
  composer.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  composer.style.backdropFilter = "blur(2px)"
  composer.style.transform = "translateY(4px)"
  composer.style.opacity = "0"
  composer.style.transition = "opacity 120ms ease, transform 140ms ease"

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
  icon.textContent = "↳"
  icon.style.color = "#5a3df0"
  icon.style.fontWeight = "700"

  composerTitle = document.createElement("span")
  composerTitle.style.fontSize = "22px"
  composerTitle.style.color = "#1a2140"
  composerTitle.style.fontWeight = "600"
  composerTitle.textContent = "element"

  const closeBtn = document.createElement("button")
  closeBtn.type = "button"
  closeBtn.textContent = "×"
  closeBtn.style.appearance = "none"
  closeBtn.style.border = "none"
  closeBtn.style.background = "transparent"
  closeBtn.style.color = "#64748b"
  closeBtn.style.fontSize = "30px"
  closeBtn.style.lineHeight = "1"
  closeBtn.style.cursor = "pointer"
  closeBtn.style.padding = "0 6px"
  closeBtn.style.borderRadius = "8px"
  closeBtn.style.transition = "background-color 120ms ease, color 120ms ease, transform 80ms ease"
  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.background = "#eef2f7"
    closeBtn.style.color = "#334155"
  })
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.background = "transparent"
    closeBtn.style.color = "#64748b"
  })
  closeBtn.addEventListener("mousedown", () => {
    closeBtn.style.transform = "scale(0.96)"
  })
  closeBtn.addEventListener("mouseup", () => {
    closeBtn.style.transform = "scale(1)"
  })

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
  composerInput.style.padding = "11px 13px"
  composerInput.style.border = "1px solid #cad1e4"
  composerInput.style.borderRadius = "11px"
  composerInput.style.fontSize = "16px"
  composerInput.style.color = "#0f172a"
  composerInput.style.background = "#ffffff"
  composerInput.style.caretColor = "#0f172a"
  composerInput.style.fontWeight = "500"
  composerInput.style.outline = "none"
  composerInput.style.transition = "border-color 120ms ease, box-shadow 120ms ease"
  const input = composerInput
  input.addEventListener("focus", () => {
    input.style.borderColor = "#6449ff"
    input.style.boxShadow = "0 0 0 3px rgba(100,73,255,.16)"
  })
  input.addEventListener("blur", () => {
    input.style.borderColor = "#cad1e4"
    input.style.boxShadow = "none"
  })

  const submit = document.createElement("button")
  submit.type = "button"
  submit.textContent = "↑"
  submit.style.width = "44px"
  submit.style.height = "44px"
  submit.style.borderRadius = "999px"
  submit.style.border = "none"
  submit.style.background = "linear-gradient(140deg,#6248ff,#7a5cff)"
  submit.style.color = "#fff"
  submit.style.fontSize = "22px"
  submit.style.fontWeight = "700"
  submit.style.cursor = "pointer"
  submit.style.transition = "background-color 120ms ease, transform 80ms ease, box-shadow 120ms ease"
  submit.addEventListener("mouseenter", () => {
    submit.style.background = "linear-gradient(140deg,#573ee9,#6f53fb)"
  })
  submit.addEventListener("mouseleave", () => {
    submit.style.background = "linear-gradient(140deg,#6248ff,#7a5cff)"
    submit.style.transform = "scale(1)"
  })
  submit.addEventListener("mousedown", () => {
    submit.style.transform = "scale(0.96)"
  })
  submit.addEventListener("mouseup", () => {
    submit.style.transform = "scale(1)"
  })
  submit.addEventListener("focus", () => {
    submit.style.boxShadow = "0 0 0 3px rgba(37,99,235,.22)"
  })
  submit.addEventListener("blur", () => {
    submit.style.boxShadow = "none"
  })
  composerSubmit = submit

  const close = () => {
    composerClosing = true
    if (composer) {
      composer.style.display = "none"
      composer.style.opacity = "0"
      composer.style.transform = "translateY(4px)"
    }
    composerTarget = null
    if (composerInput) {
      composerInput.value = ""
    }
    submitInFlight = false
    if (composerSubmit) {
      composerSubmit.disabled = false
      composerSubmit.style.opacity = "1"
      composerSubmit.style.cursor = "pointer"
    }
    setTimeout(() => {
      composerClosing = false
    }, 0)
  }

  closeBtn.addEventListener("click", close)

  const submitCapture = async () => {
    if (submitInFlight) {
      return
    }
    if (!composerTarget) {
      close()
      return
    }
    submitInFlight = true
    const target = composerTarget
    const note = composerInput?.value?.trim() ?? ""
    close()
    try {
      const capture = await captureElement(target)
      capture.note = note
      await chrome.runtime.sendMessage({ type: "PIXELCONTEXT_CAPTURE_ADDED", payload: capture })
    } finally {
      submitInFlight = false
    }
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
  node.style.opacity = "1"
  node.style.transform = "translateY(0)"

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
  if (composerClosing || submitInFlight) {
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
    highlightSelector(message.selector)
  }
})

window.addEventListener("pixelcontext-highlight-selector", (event: Event) => {
  const customEvent = event as CustomEvent<{ selector?: string }>
  const selector = customEvent.detail?.selector
  if (!selector) {
    return
  }
  highlightSelector(selector)
})

ensureOverlay()
ensureComposer()

const CaptureOverlayEntry = () => null

export default CaptureOverlayEntry
