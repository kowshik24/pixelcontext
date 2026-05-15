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
  const tabId = sender.tab?.id
  if (!tabId || !message?.type) {
    return
  }

  if (message.type === "PIXELCONTEXT_TOGGLE_CAPTURE") {
    chrome.tabs.sendMessage(tabId, { type: "PIXELCONTEXT_TOGGLE_CAPTURE" })
    return
  }

  if (message.type === "PIXELCONTEXT_SET_CAPTURE_MODE") {
    chrome.tabs.sendMessage(tabId, { type: "PIXELCONTEXT_SET_CAPTURE_MODE", enabled: Boolean(message.enabled) })
    return
  }

  if (message.type === "PIXELCONTEXT_TOGGLE_SIDEBAR") {
    chrome.tabs.sendMessage(tabId, { type: "PIXELCONTEXT_TOGGLE_SIDEBAR" })
    return
  }

  if (message.type === "PIXELCONTEXT_HIGHLIGHT_SELECTOR") {
    chrome.tabs.sendMessage(tabId, message)
    return
  }

  if (message.type === "PIXELCONTEXT_CAPTURE_ADDED" || message.type === "PIXELCONTEXT_CAPTURE_MODE") {
    chrome.tabs.sendMessage(tabId, message)
  }
})
