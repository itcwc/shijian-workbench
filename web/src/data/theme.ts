import { ref } from 'vue'

const THEME_KEY = 'wb_theme_v1'
export type WorkbenchTheme = 'light' | 'dark'

export function isWorkbenchTheme(value: unknown): value is WorkbenchTheme {
  return value === 'light' || value === 'dark'
}

function loadTheme(): WorkbenchTheme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export const workbenchTheme = ref(loadTheme())

export function saveTheme(theme: WorkbenchTheme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    throw new Error('无法保存主题设置。')
  }
  workbenchTheme.value = theme
}
