import { Storage } from "@plasmohq/storage"

import type { CaptureItem } from "./types"

const storage = new Storage({ area: "local" })

const keyForUrl = (url: string) => {
  const normalized = new URL(url)
  normalized.hash = ""
  return `captures:${normalized.toString()}`
}

export const getCaptures = async (url: string): Promise<CaptureItem[]> => {
  const key = keyForUrl(url)
  return (await storage.get<CaptureItem[]>(key)) ?? []
}

export const setCaptures = async (url: string, captures: CaptureItem[]) => {
  const key = keyForUrl(url)
  await storage.set(key, captures)
}
