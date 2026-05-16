chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-capture-mode") {
    return
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    return
  }

  chrome.tabs.sendMessage(tab.id, { type: "PIXELCONTEXT_TOGGLE_CAPTURE" })
})

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message?.type) {
    return
  }

  const dispatchToTab = async (payload: unknown) => {
    const senderTabId = sender.tab?.id
    if (senderTabId) {
      chrome.tabs.sendMessage(senderTabId, payload)
      return
    }
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (activeTab?.id) {
      chrome.tabs.sendMessage(activeTab.id, payload)
    }
  }

  if (message.type === "PIXELCONTEXT_TOGGLE_CAPTURE") {
    dispatchToTab({ type: "PIXELCONTEXT_TOGGLE_CAPTURE" })
    return
  }

  if (message.type === "PIXELCONTEXT_SET_CAPTURE_MODE") {
    dispatchToTab({ type: "PIXELCONTEXT_SET_CAPTURE_MODE", enabled: Boolean(message.enabled) })
    return
  }

  if (message.type === "PIXELCONTEXT_TOGGLE_SIDEBAR") {
    dispatchToTab({ type: "PIXELCONTEXT_TOGGLE_SIDEBAR" })
    return
  }

  if (message.type === "PIXELCONTEXT_HIGHLIGHT_SELECTOR") {
    dispatchToTab(message)
    return
  }

  if (message.type === "PIXELCONTEXT_CAPTURE_ADDED" || message.type === "PIXELCONTEXT_CAPTURE_MODE") {
    dispatchToTab(message)
  }
})
