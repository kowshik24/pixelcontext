export type CaptureComputedStyles = Record<string, string>

export type CaptureItem = {
  id: string
  url: string
  createdAt: string
  note: string
  domPath: string
  selector: string
  html: string
  css: string
  computedStyles: CaptureComputedStyles
  screenshotRef: string
  screenshotDataUrl?: string
  screenshotWidth?: number
  screenshotHeight?: number
}
