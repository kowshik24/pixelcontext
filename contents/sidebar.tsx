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
.pc-shell{position:fixed;right:20px;top:20px;width:min(390px,calc(100vw - 32px));max-height:84vh;background:#f8fafc;color:#0f172a;font:14px/1.45 "SF Pro Text",-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;border:1px solid #cbd5e1;border-radius:18px;box-shadow:0 22px 44px rgba(15,23,42,.2);z-index:2147483646;display:flex;flex-direction:column;overflow:hidden}
.pc-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#ffffff}
.pc-header strong{font-size:20px;line-height:1.1;letter-spacing:-.01em}
.pc-badge{padding:6px 12px;border-radius:999px;background:#e2e8f0;color:#334155;font-weight:600;font-size:14px;line-height:1}
.pc-badge.on{background:#dcfce7;color:#166534}
.pc-actions{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#ffffff}
.pc-actions button{appearance:none;-webkit-appearance:none;font-size:14px;line-height:1.15;font-weight:650;color:#0f172a;padding:8px 11px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;cursor:pointer;transition:all .16s ease}
.pc-actions button:hover:not(:disabled){border-color:#94a3b8;background:#f1f5f9}
.pc-actions button:disabled{opacity:.5;cursor:not-allowed}
.pc-list{overflow:auto;padding:12px 16px 16px;display:flex;flex-direction:column;gap:12px}
.pc-card{border:1px solid #dbe3ee;border-radius:14px;padding:12px;background:#ffffff;display:flex;flex-direction:column;gap:9px}
.pc-card img{width:100%;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc}
.pc-meta{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.pc-meta code{font-size:12px;font-weight:560;line-height:1.2;word-break:break-all;color:#475569;background:transparent}
.pc-meta button,.pc-card button{appearance:none;-webkit-appearance:none;font-size:13px;line-height:1.15;font-weight:620;color:#0f172a;padding:8px 10px;border:1px solid #cbd5e1;border-radius:11px;background:#f8fafc;cursor:pointer}
.pc-meta button:hover,.pc-card button:hover{border-color:#94a3b8;background:#f1f5f9}
.pc-path{font-size:12px;line-height:1.45;color:#475569;word-break:break-word}
.pc-card textarea{min-height:74px;width:100%;resize:vertical;border:1px solid #cbd5e1;border-radius:11px;padding:10px 12px;font-size:14px;line-height:1.35;color:#0f172a;background:#ffffff}
.pc-card textarea:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.18)}
.pc-toast{padding:10px 14px;background:#eff6ff;border-top:1px solid #bfdbfe;color:#1e3a8a;font-size:16px;font-weight:560}
`

const Sidebar = () => {
  const [captures, setCaptureState] = useState<CaptureItem[]>([])
  const [captureMode, setCaptureMode] = useState(false)
  const [visible, setVisible] = useState(true)
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
      if (message?.type === "PIXELCONTEXT_TOGGLE_SIDEBAR") {
        setVisible((prev) => {
          const next = !prev
          if (!next) {
            chrome.runtime.sendMessage({ type: "PIXELCONTEXT_SET_CAPTURE_MODE", enabled: false })
          }
          return next
        })
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
    chrome.runtime.sendMessage({ type: "PIXELCONTEXT_SET_CAPTURE_MODE", enabled: !captureMode })
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

  if (!visible) {
    return null
  }

  return (
    <div className="pc-shell">
      <header className="pc-header">
        <strong>PixelContext</strong>
        <span className={captureMode ? "pc-badge on" : "pc-badge"}>{captureMode ? "Capture ON" : "Capture OFF"}</span>
      </header>

      <div className="pc-actions">
        <button onClick={toggleCapture}>{captureMode ? "Turn Off" : "Turn On"}</button>
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
let style = root.querySelector("style[data-pixelcontext='sidebar']") as HTMLStyleElement | null
if (!style) {
  style = document.createElement("style")
  style.dataset.pixelcontext = "sidebar"
  root.appendChild(style)
}
style.textContent = SIDEBAR_CSS
const mount = document.createElement("div")
root.appendChild(mount)
createRoot(mount).render(<Sidebar />)

const SidebarEntry = () => null

export default SidebarEntry
