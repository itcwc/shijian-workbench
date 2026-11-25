<script setup lang="ts">
import { isWorkbenchTheme, saveTheme, workbenchTheme } from '../data/theme'

function changeTheme(value: unknown) {
  if (!isWorkbenchTheme(value)) return

  try {
    saveTheme(value)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '主题切换失败。')
  }
}
</script>

<template>
  <section class="theme-settings" aria-labelledby="theme-title">
    <div>
      <h2 id="theme-title"><el-text>界面主题</el-text></h2>
      <el-text tag="p" size="small">主题会保存在当前浏览器，并随数据备份导出。</el-text>
    </div>
    <el-radio-group :model-value="workbenchTheme" aria-label="界面主题" @update:model-value="changeTheme">
      <el-radio-button value="light">浅色</el-radio-button>
      <el-radio-button value="dark">暗色</el-radio-button>
    </el-radio-group>
  </section>
</template>

<style scoped>
.theme-settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.theme-settings h2 {
  margin: 0;
  font-size: inherit;
  font-weight: 600;
}

.theme-settings p {
  margin-block-start: 6px;
  line-height: 1.5;
}
</style>
