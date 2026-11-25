import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

export function projectPath(...segments) {
  return join(root, ...segments)
}
