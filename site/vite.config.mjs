import { defineConfig } from 'vite'
import { projectPath } from '../scripts/project-paths.mjs'

export default defineConfig({
  root: projectPath('site'),
  publicDir: projectPath('packages', 'brand'),
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5189,
    strictPort: true,
    fs: { allow: [projectPath()] },
  },
  build: {
    outDir: projectPath('product-site', 'dist'),
    emptyOutDir: false,
  },
  plugins: [{
    name: 'workbench-development-entry',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0]
        if (pathname !== '/app/' && pathname !== '/app') return next()
        response.writeHead(302, { Location: 'http://127.0.0.1:5188/' })
        response.end()
      })
    },
  }],
})
