<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import { ref } from 'vue'
import { parseTaskBackup, restoreTaskBackup, serializeTaskBackup } from '../data/taskBackup'
import { tasks, todayStr } from '../data/taskStore'

const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

function exportBackup() {
  const blob = new Blob([serializeTaskBackup(tasks.value)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `事间备份-${todayStr()}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function importBackup(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || importing.value) return

  importing.value = true
  try {
    const backup = parseTaskBackup(await file.text())
    const themeNotice = backup.theme ? '同时恢复备份中的主题。' : ''
    const confirmed = await ElMessageBox.confirm(
      `备份中有 ${backup.tasks.length} 项任务。导入后将替换当前的 ${tasks.value.length} 项任务。${themeNotice}`,
      '导入备份',
      { type: 'warning', confirmButtonText: '导入并替换', cancelButtonText: '取消' },
    ).then(() => true, () => false)
    if (!confirmed) return

    restoreTaskBackup(backup)
    ElMessage.success(`已导入 ${backup.tasks.length} 项任务`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导入失败，请重新选择备份文件。')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <section class="backup-panel" aria-label="数据备份">
    <div class="backup-row">
      <div>
        <h2><el-text>导出备份</el-text></h2>
        <el-text tag="p" size="small">将当前 {{ tasks.length }} 项任务和主题设置保存为 JSON 文件。</el-text>
      </div>
      <el-button type="primary" @click="exportBackup">导出 JSON</el-button>
    </div>

    <div class="backup-row">
      <div>
        <h2><el-text>导入备份</el-text></h2>
        <el-text tag="p" size="small">选择事间导出的 JSON 文件，确认后恢复任务和备份中的主题设置。</el-text>
      </div>
      <el-button :loading="importing" @click="fileInput?.click()">导入 JSON</el-button>
      <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="importBackup" />
    </div>
  </section>
</template>

<style scoped>
.backup-panel {
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.backup-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 18px 20px;
}

.backup-row + .backup-row {
  border-top: 1px solid var(--el-border-color-lighter);
}

.backup-row h2 {
  margin: 0;
  font-size: inherit;
  font-weight: 600;
}

.backup-row p {
  margin: 6px 0 0;
  line-height: 1.5;
}
</style>
