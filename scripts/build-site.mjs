import { copyFile, cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { projectPath } from './project-paths.mjs'

const root = projectPath()
const output = join(root, 'product-site', 'dist')

await mkdir(output, { recursive: true })
await Promise.all([
  ...['index.html', 'product.css', 'preview.js', 'tokens.css'].map((filename) =>
    copyFile(join(root, 'site', filename), join(output, filename))),
  ...['brand.css', 'shijian-icon.svg'].map((filename) =>
    copyFile(join(root, 'packages', 'brand', filename), join(output, filename))),
  cp(join(root, 'site', 'screenshots'), join(output, 'screenshots'), { recursive: true }),
])
