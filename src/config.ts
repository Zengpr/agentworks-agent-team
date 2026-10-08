/**
 * 轻量 .env 加载器（零依赖，与作品 1 共用模式）。
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

export function loadEnv(filePath = ".env"): void {
  const full = resolve(filePath)
  if (!existsSync(full)) return
  const content = readFileSync(full, "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}
