import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"

export const config = {
  matches: ["<all_urls>"],
  run_at: "document_idle" as const
}

import { buildPromptMarkdown } from "~core/prompt-builder"
import { getCaptures, setCaptures } from "~core/storage"
import type { CaptureItem } from "~core/types"

const SIDEBAR_CSS = `
.pc-shell{position:fixed;right:20px;top:20px;width:350px;max-height:80vh;background:#fff;color:#111;font:12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;border:1px solid #d1d5db;border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,.15);z-index:2147483646;display:flex;flex-direction:column}
.pc-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #e5e7eb}
.pc-badge{padding:2px 8px;border-radius:999px;background:#e5e7eb}
.pc-badge.on{background:#dcfce7;color:#166534}
.pc-actions{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid #e5e7eb}
.pc-actions button{font-size:12px;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer}
.pc-actions button:disabled{opacity:.45;cursor:not-allowed}
.pc-list{overflow:auto;padding:8px 12px;display:flex;flex-direction:column;gap:8px}
.pc-card{border:1px solid #e5e7eb;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px}
.pc-card img{width:100%;border:1px solid #e5e7eb;border-radius:6px}
.pc-meta{display:flex;justify-content:space-between;align-items:center;gap:8px}
.pc-meta button,.pc-card button{font-size:11px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer}
.pc-path{font-size:11px;color:#334155;word-break:break-word}
.pc-card textarea{min-height:52px;width:100%;resize:vertical;border:1px solid #cbd5e1;border-radius:6px;padding:6px;font-size:12px}
.pc-toast{padding:8px 12px;background:#eff6ff;border-top:1px solid #bfdbfe}
`

const Sidebar = () => {
  const [captures, setCaptureState] = useState<CaptureItem[]>([])
  const [captureMode, setCaptureMode] = useState(false)
  const [toast, setToast] = useState<string>("")

  const pageUrl = useMemo(() => location.href, [])

  useEffect(() => {
    getCaptures(pageUrl).then(setCaptureState)

    const listener = (message: any) => {
      if (message?.type === "PIXELCONTEXT_CAPTURE_ADDED") {
        setCaptureState((prev) => {
          const next = [message.payload as CaptureItem, ...prev]
          setCaptures(pageUrl, next)
          return next
        })
      }
      if (message?.type === "PIXELCONTEXT_CAPTURE_MODE") {
        setCaptureMode(Boolean(message.enabled))
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [pageUrl])

  const updateNote = (id: string, note: string) => {
    setCaptureState((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, note } : item))
      setCaptures(pageUrl, next)
      return next
    })
  }

  const removeCapture = (id: string) => {
    setCaptureState((prev) => {
      const next = prev.filter((item) => item.id !== id)
      setCaptures(pageUrl, next)
      return next
    })
  }

  const clearAll = () => {
    setCaptureState([])
    setCaptures(pageUrl, [])
  }

  const rehighlight = (selector: string) => {
    chrome.runtime.sendMessage({ type: "PIXELCONTEXT_HIGHLIGHT_SELECTOR", selector })
  }

  const toggleCapture = () => {
    chrome.runtime.sendMessage({ type: "PIXELCONTEXT_TOGGLE_CAPTURE" })
  }

  const exportMarkdown = async () => {
    const text = buildPromptMarkdown(pageUrl, captures)
    try {
      await navigator.clipboard.writeText(text)
      setToast("Copied Markdown prompt")
    } catch {
      setToast("Clipboard copy failed")
    }
    setTimeout(() => setToast(""), 1800)
  }

  return (
    <div className="pc-shell">
      <header className="pc-header">
        <strong>PixelContext</strong>
        <span className={captureMode ? "pc-badge on" : "pc-badge"}>{captureMode ? "Capture ON" : "Capture OFF"}</span>
      </header>

      <div className="pc-actions">
        <button onClick={toggleCapture}>Toggle</button>
        <button onClick={exportMarkdown} disabled={!captures.length}>Export Markdown</button>
        <button onClick={clearAll} disabled={!captures.length}>Clear</button>
      </div>

      <div className="pc-list">
        {captures.map((item) => (
          <article key={item.id} className="pc-card">
            <div className="pc-meta">
              <code>{item.screenshotRef}</code>
              <button onClick={() => rehighlight(item.selector)}>Re-highlight</button>
            </div>
            {item.screenshotDataUrl ? <img src={item.screenshotDataUrl} alt="capture" /> : <p>No screenshot</p>}
            <p className="pc-path">{item.domPath}</p>
            <textarea
              placeholder="Add note"
              value={item.note}
              onChange={(event) => updateNote(item.id, event.target.value)}
            />
            <button onClick={() => removeCapture(item.id)}>Delete</button>
          </article>
        ))}
      </div>

      {toast ? <footer className="pc-toast">{toast}</footer> : null}
    </div>
  )
}

const hostId = "pixelcontext-sidebar-host"
let host = document.getElementById(hostId)
if (!host) {
  host = document.createElement("div")
  host.id = hostId
  document.body.appendChild(host)
}

const root = host.shadowRoot ?? host.attachShadow({ mode: "open" })
if (!root.querySelector("style[data-pixelcontext='sidebar']")) {
  const style = document.createElement("style")
  style.dataset.pixelcontext = "sidebar"
  style.textContent = SIDEBAR_CSS
  root.appendChild(style)
}
const mount = document.createElement("div")
root.appendChild(mount)
createRoot(mount).render(<Sidebar />)
