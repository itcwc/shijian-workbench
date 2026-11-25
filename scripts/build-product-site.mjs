import './build-site.mjs'
import { join } from 'node:path'
import { projectPath } from './project-paths.mjs'
import { build } from 'vite'

const root = projectPath()
const output = join(root, 'product-site', 'dist')

await build({
  configFile: join(root, 'web', 'vite.config.ts'),
  base: './',
  build: { outDir: join(output, 'app'), emptyOutDir: true },
})
