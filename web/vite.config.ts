import { defineConfig } from 'vite'
import { projectPath } from '../scripts/project-paths.mjs'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  root: projectPath('web'),
  publicDir: projectPath('packages', 'brand'),
  build: {
    outDir: projectPath('dist'),
    emptyOutDir: true,
  },
  // 固定端口与 host，避免与本机其它 Vite 项目（如 5173 上的信鸽）串台
  server: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
    fs: { allow: [projectPath()] },
  },
  plugins: [
    vue(),
    // Element Plus 组件与 API 按需加载
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: projectPath('web', 'auto-imports.d.ts'),
    }),
    Components({
      dirs: [projectPath('web', 'src', 'components')],
      resolvers: [ElementPlusResolver()],
      dts: projectPath('web', 'components.d.ts'),
    }),
  ],
})
