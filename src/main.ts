import { createApp, watch } from 'vue'
import {
  Bell,
  Close,
  Expand,
  Fold,
  House,
  List,
  Notebook,
  Plus,
  Setting,
  Timer,
  Tools,
  TrendCharts,
} from '@element-plus/icons-vue'
import App from './App.vue'
import { workbenchTheme } from './data/theme'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './brand.css'
import './styles.css'

const app = createApp(App)

watch(workbenchTheme, (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}, { immediate: true, flush: 'sync' })

// 只注册实际用到的图标（菜单图标通过字符串动态引用，需要全局注册）
const icons = {
  Bell,
  Close,
  Expand,
  Fold,
  House,
  List,
  Notebook,
  Plus,
  Setting,
  Timer,
  Tools,
  TrendCharts,
}
for (const [name, icon] of Object.entries(icons)) {
  app.component(name, icon)
}

app.mount('#app')
