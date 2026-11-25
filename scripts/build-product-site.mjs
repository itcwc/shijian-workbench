import { copyFile, cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = join(root, 'product-site', 'dist')

await mkdir(output, { recursive: true })
await Promise.all([
  copyFile(join(root, 'site', 'index.html'), join(output, 'index.html')),
  copyFile(join(root, 'site', 'product.css'), join(output, 'product.css')),
  copyFile(join(root, 'site', 'preview.js'), join(output, 'preview.js')),
  copyFile(join(root, 'src', 'brand.css'), join(output, 'brand.css')),
  copyFile(join(root, 'site', 'tokens.css'), join(output, 'tokens.css')),
  cp(join(root, 'site', 'screenshots'), join(output, 'screenshots'), { recursive: true }),
  copyFile(join(root, 'public', 'shijian-icon.svg'), join(output, 'shijian-icon.svg')),
])

await build({
  root,
  base: './',
  build: { outDir: join(output, 'app'), emptyOutDir: true },
})
