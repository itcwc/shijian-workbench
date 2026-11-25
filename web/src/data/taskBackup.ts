import { fmt, isTaskColor, restoreTasks, type Task } from './taskStore'
import { isWorkbenchTheme, saveTheme, workbenchTheme, type WorkbenchTheme } from './theme'

const BACKUP_FORMAT = 'workbench-backup'
const BACKUP_VERSION = 1

interface TaskBackupData {
  tasks: Task[]
  theme?: WorkbenchTheme
}

export function serializeTaskBackup(tasks: Task[]): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    theme: workbenchTheme.value,
    tasks,
  }, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCompletionDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    fmt(new Date(`${value}T00:00:00`)) === value
}

function isBackupTask(value: unknown): value is Task {
  return isRecord(value) &&
    typeof value.id === 'string' && value.id.trim() !== '' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    typeof value.done === 'boolean' &&
    typeof value.pinned === 'boolean' &&
    isTaskColor(value.color) &&
    typeof value.createdAt === 'string' &&
    (value.completedOn === undefined || (value.done && isCompletionDate(value.completedOn)))
}

export function parseTaskBackup(json: string): TaskBackupData {
  let backup: unknown
  try {
    backup = JSON.parse(json)
  } catch {
    throw new Error('文件不是有效的 JSON。')
  }

  if (!isRecord(backup) || backup.format !== BACKUP_FORMAT || !Array.isArray(backup.tasks)) {
    throw new Error('请选择事间导出的备份文件。')
  }
  if (backup.version !== BACKUP_VERSION) {
    throw new Error('当前版本的事间无法读取这个备份文件。')
  }
  const items: unknown[] = backup.tasks
  if (!items.every(isBackupTask)) {
    throw new Error('备份中有任务字段缺失或格式错误。')
  }
  if (new Set(items.map((task) => task.id)).size !== items.length) {
    throw new Error('备份中有重复的任务 ID。')
  }
  if (backup.theme !== undefined && !isWorkbenchTheme(backup.theme)) {
    throw new Error('备份中的主题设置无效。')
  }
  return { tasks: items, theme: backup.theme }
}

export function restoreTaskBackup(backup: TaskBackupData) {
  const previousTheme = workbenchTheme.value
  const theme = backup.theme ?? previousTheme
  const themeChanged = theme !== previousTheme
  if (themeChanged) saveTheme(theme)

  try {
    restoreTasks(backup.tasks)
  } catch (error) {
    if (themeChanged) saveTheme(previousTheme)
    throw error
  }
}
