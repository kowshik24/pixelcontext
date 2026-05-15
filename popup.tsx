import { useEffect, useState } from "react"

import "./contents/styles.css"

function Popup() {
  const [status, setStatus] = useState("Toggling sidebar...")

  useEffect(() => {
    const run = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab?.id) {
          setStatus("No active tab")
          return
        }
        await chrome.tabs.sendMessage(tab.id, { type: "PIXELCONTEXT_TOGGLE_SIDEBAR" })
        setStatus("Done")
      } catch {
        setStatus("Open a normal web page and try again")
      }
      setTimeout(() => window.close(), 120)
    }
    run().catch(() => setStatus("Failed to toggle"))
  }, [])

  return (
    <main className="pc-popup">
      <h1>PixelContext</h1>
      <p>{status}</p>
    </main>
  )
}

export default Popup
