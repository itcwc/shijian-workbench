<script setup lang="ts">
import { TASK_COLORS, type TaskColor } from '../data/taskStore'

defineProps<{ showLabel?: boolean }>()
const color = defineModel<TaskColor>({ required: true })
</script>

<template>
  <div class="color-picker" role="group" aria-label="任务颜色">
    <span v-if="showLabel" class="color-label">颜色</span>
    <button
      v-for="option in TASK_COLORS"
      :key="option.name"
      type="button"
      class="color-option"
      :style="{ backgroundColor: option.hex }"
      :title="option.label"
      :aria-label="option.label"
      :aria-pressed="color === option.name"
      @click="color = option.name"
    />
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.color-option {
  flex: 0 0 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
}
.color-option:hover {
  transform: scale(1.15);
}
.color-option[aria-pressed='true'] {
  box-shadow: 0 0 0 2px var(--el-bg-color), 0 0 0 4px var(--el-text-color-primary);
}
</style>
