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
:root{color-scheme:light}
.pc-shell{position:fixed;right:20px;top:20px;width:min(390px,calc(100vw - 24px));max-height:86vh;background:#f5f6fb;color:#12172b;font:13px/1.4 "SF Pro Text",-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;border:1px solid #d8ddec;border-radius:16px;box-shadow:0 18px 42px rgba(18,23,43,.18);z-index:2147483646;display:flex;flex-direction:column;overflow:hidden;animation:pc-fade-in .16s ease-out}
.pc-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e4e8f4;background:#ffffff}
.pc-brand{display:flex;align-items:center;gap:10px}
.pc-logo{width:24px;height:24px;display:grid;place-items:center;border-radius:8px;background:linear-gradient(145deg,#6c4cff,#7a5cff);color:#fff;font-size:13px;font-weight:700}
.pc-header strong{font-size:16px;line-height:1.1;letter-spacing:-.012em}
.pc-badge{padding:6px 12px;border-radius:999px;background:#eceffc;color:#485171;font-weight:650;font-size:13px;line-height:1;transition:background-color .18s ease,color .18s ease}
.pc-badge.on{background:#dff3e7;color:#14653f}
.pc-progress{display:flex;gap:6px;padding:9px 14px;border-bottom:1px solid #e4e8f4;background:#ffffff}
.pc-step{padding:4px 9px;border-radius:999px;font-size:11px;font-weight:620;color:#69748f;background:#f3f5fb}
.pc-step.active{color:#5a3df0;background:#ece9ff}
.pc-actions{display:flex;gap:7px;padding:10px 14px;border-bottom:1px solid #e4e8f4;background:#ffffff}
.pc-actions button{appearance:none;-webkit-appearance:none;font-size:12px;line-height:1.15;font-weight:620;color:#17213b;padding:7px 10px;border:1px solid #cad1e4;border-radius:10px;background:#f8f9fd;cursor:pointer;transition:background-color .14s ease,border-color .14s ease,transform .08s ease,box-shadow .14s ease}
.pc-actions button:hover:not(:disabled){border-color:#aeb8d2;background:#f1f4fb;transform:translateY(-1px)}
.pc-actions button:active:not(:disabled){transform:translateY(0) scale(.985)}
.pc-actions button:focus-visible{outline:none;border-color:#6449ff;box-shadow:0 0 0 3px rgba(100,73,255,.2)}
.pc-actions button:disabled{opacity:.45;cursor:not-allowed}
.pc-primary{margin-left:auto;background:linear-gradient(140deg,#6248ff,#7a5cff)!important;border-color:#5e45ef!important;color:#fff!important}
.pc-tools{margin:10px 14px 8px;padding:10px;border:1px solid #d7ddef;border-radius:12px;background:#ffffff}
.pc-tools-title{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#65708a;margin:0 0 8px}
.pc-list{overflow:auto;padding:0 14px 14px;display:flex;flex-direction:column;gap:8px;background:#f5f6fb}
.pc-list-head{display:flex;align-items:center;justify-content:space-between}
.pc-list-head h3{margin:0;font-size:12px;letter-spacing:.03em;text-transform:uppercase;color:#65708a}
.pc-count{font-size:11px;color:#7a849d;background:#e9edf8;padding:3px 8px;border-radius:999px}
.pc-empty{border:1px dashed #cbd3e8;border-radius:14px;padding:14px 12px;background:#ffffff;font-size:13px;color:#586483}
.pc-card{border:1px solid #d7ddef;border-radius:12px;padding:8px;background:#ffffff;display:flex;flex-direction:column;gap:7px;transition:border-color .16s ease,box-shadow .16s ease,transform .14s ease}
.pc-card:hover{border-color:#c7d0e7;box-shadow:0 7px 20px rgba(18,23,43,.08)}
.pc-card img{width:100%;max-height:140px;object-fit:cover;border:1px solid #e8ecf7;border-radius:9px;background:#f8fafc}
.pc-meta{display:flex;justify-content:space-between;align-items:center;gap:8px}
.pc-meta code{font-size:10px;font-weight:560;line-height:1.2;word-break:break-all;color:#55607b;background:transparent;max-width:185px}
.pc-meta button,.pc-card button{appearance:none;-webkit-appearance:none;font-size:11px;line-height:1.15;font-weight:620;color:#17213b;padding:6px 9px;border:1px solid #cad1e4;border-radius:9px;background:#f8f9fd;cursor:pointer;transition:background-color .14s ease,border-color .14s ease,transform .08s ease,box-shadow .14s ease}
.pc-meta button:hover,.pc-card button:hover{border-color:#aeb8d2;background:#f1f4fb;transform:translateY(-1px)}
.pc-meta button:active,.pc-card button:active{transform:translateY(0) scale(.985)}
.pc-meta button:focus-visible,.pc-card button:focus-visible{outline:none;border-color:#6449ff;box-shadow:0 0 0 3px rgba(100,73,255,.2)}
.pc-path{font-size:11px;line-height:1.35;color:#4e5a78;word-break:break-word}
.pc-card textarea{min-height:64px;width:100%;resize:vertical;border:1px solid #cad1e4;border-radius:10px;padding:8px 10px;font-size:14px;line-height:1.3;color:#12172b;background:#ffffff}
.pc-card textarea:focus,.pc-card textarea:focus-visible{outline:none;border-color:#6449ff;box-shadow:0 0 0 3px rgba(100,73,255,.16)}
.pc-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px}
.pc-card .pc-delete{background:#fff6f7;border-color:#efcfd3;color:#8a2230}
.pc-card .pc-delete:hover{background:#ffecf0;border-color:#e4b8bf}
.pc-toast{padding:8px 12px;background:#f2efff;border-top:1px solid #ded7ff;color:#4b31c6;font-size:12px;font-weight:600;animation:pc-toast-in .14s ease-out}
@keyframes pc-fade-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pc-toast-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){
  .pc-shell,.pc-badge,.pc-actions button,.pc-card,.pc-meta button,.pc-card button,.pc-toast{animation:none;transition:none}
}
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
    window.dispatchEvent(new CustomEvent("pixelcontext-highlight-selector", { detail: { selector } }))
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
        <div className="pc-brand">
          <span className="pc-logo">⌗</span>
          <strong>PromptCapture</strong>
        </div>
        <span className={captureMode ? "pc-badge on" : "pc-badge"}>{captureMode ? "Capture ON" : "Capture OFF"}</span>
      </header>

      <div className="pc-progress">
        <span className="pc-step active">1 Capture</span>
        <span className="pc-step">2 Refine</span>
        <span className="pc-step">3 Export</span>
      </div>

      <div className="pc-tools">
        <p className="pc-tools-title">Capture Tools</p>
        <div className="pc-actions">
          <button onClick={toggleCapture}>{captureMode ? "Turn Off" : "Turn On"}</button>
          <button onClick={exportMarkdown} disabled={!captures.length}>Copy Markdown</button>
          <button onClick={clearAll} disabled={!captures.length}>Clear</button>
          <button className="pc-primary" onClick={exportMarkdown} disabled={!captures.length}>Export</button>
        </div>
      </div>

      <div className="pc-list">
        <div className="pc-list-head">
          <h3>History</h3>
          <span className="pc-count">{captures.length}</span>
        </div>
        {!captures.length ? <div className="pc-empty">No captures yet. Turn capture on and click any element.</div> : null}
        {captures.map((item) => (
          <article key={item.id} className="pc-card">
            <div className="pc-row">
              <div className="pc-meta">
                <code>{item.screenshotRef}</code>
              </div>
              <button onClick={() => rehighlight(item.selector)}>Re-highlight</button>
            </div>
            {item.screenshotDataUrl ? <img src={item.screenshotDataUrl} alt="capture" /> : <p>No screenshot</p>}
            <p className="pc-path">{item.domPath}</p>
            <textarea
              placeholder="Add note"
              value={item.note}
              onChange={(event) => updateNote(item.id, event.target.value)}
            />
            <button className="pc-delete" onClick={() => removeCapture(item.id)}>Delete</button>
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
