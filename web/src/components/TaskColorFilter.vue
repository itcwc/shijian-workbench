<script setup lang="ts">
import { computed } from 'vue'
import { TASK_COLORS, type Task, type TaskColor } from '../data/taskStore'

const props = defineProps<{
  items: readonly Task[]
  placeholder: string
  size?: 'small' | 'default'
}>()
const selected = defineModel<TaskColor[]>({ required: true })

const counts = computed(() => {
  const byColor = new Map<TaskColor, number>()
  for (const { color } of props.items) byColor.set(color, (byColor.get(color) ?? 0) + 1)
  return byColor
})
</script>

<template>
  <el-select
    v-model="selected"
    class="task-color-filter"
    aria-label="筛选任务颜色"
    :placeholder="placeholder"
    :size="size"
    multiple
    clearable
    collapse-tags
  >
    <template #header>
      <div class="filter-total">
        <el-text size="small">全部</el-text>
        <el-text class="filter-count" size="small">{{ items.length }}</el-text>
      </div>
    </template>

    <el-option v-for="color in TASK_COLORS" :key="color.name" :label="color.shortLabel" :value="color.name">
      <div class="filter-option">
        <span class="filter-color">
          <span class="filter-dot" :style="{ backgroundColor: color.hex }" aria-hidden="true" />
          <el-text size="small">{{ color.shortLabel }}</el-text>
        </span>
        <el-text class="filter-count" size="small">{{ counts.get(color.name) ?? 0 }}</el-text>
      </div>
    </el-option>
  </el-select>
</template>

<style scoped>
.task-color-filter {
  width: 156px;
  max-width: 100%;
}

.filter-total,
.filter-option,
.filter-color {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-total,
.filter-option {
  justify-content: space-between;
}

.filter-total {
  padding-inline: 10px 28px;
}

.filter-option {
  padding-inline-end: 6px;
}

.filter-color > .el-text {
  color: inherit;
}

.filter-dot {
  flex: 0 0 8px;
  height: 8px;
  border-radius: 50%;
}

.filter-count {
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
