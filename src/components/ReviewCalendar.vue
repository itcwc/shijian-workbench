<script setup lang="ts">
import type { CalendarInstance } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { computed, ref } from 'vue'
import { colorHex, fmt, tasks, type Task, type TaskColor } from '../data/taskStore'
import TaskColorFilter from './TaskColorFilter.vue'

const value = ref(new Date())
const calendar = ref<CalendarInstance>()
const selectedColors = ref<TaskColor[]>([])

const completedByDate = computed(() => {
  const byDate = new Map<string, Task[]>()
  for (const task of tasks.value) {
    if (!task.done || !task.completedOn) continue
    const dayTasks = byDate.get(task.completedOn)
    if (dayTasks) dayTasks.push(task)
    else byDate.set(task.completedOn, [task])
  }
  return byDate
})

const visibleTasksByDate = computed(() => {
  const selected = new Set(selectedColors.value)
  if (selected.size === 0) return completedByDate.value

  const visible = new Map<string, Task[]>()
  for (const [date, completed] of completedByDate.value) {
    const matches = completed.filter((task) => selected.has(task.color))
    if (matches.length) visible.set(date, matches)
  }
  return visible
})

const monthlyTasks = computed(() => {
  const year = value.value.getFullYear()
  const month = value.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, index) => {
    const dateKey = fmt(new Date(year, month, index + 1))
    return completedByDate.value.get(dateKey) ?? []
  }).flat()
})
</script>

<template>
  <section class="review-calendar" aria-label="任务完成日历">
    <el-config-provider :locale="zhCn">
      <el-calendar ref="calendar" v-model="value">
        <template #header="{ date }">
          <el-text size="large">{{ date }}</el-text>
          <div class="calendar-tools">
            <TaskColorFilter v-model="selectedColors" :items="monthlyTasks" size="small" placeholder="全部颜色" />
            <el-button-group>
              <el-button size="small" @click="calendar?.selectDate('prev-month')">上个月</el-button>
              <el-button size="small" @click="calendar?.selectDate('today')">今天</el-button>
              <el-button size="small" @click="calendar?.selectDate('next-month')">下个月</el-button>
            </el-button-group>
          </div>
        </template>

        <template #date-cell="{ data }">
          <time :datetime="data.day">{{ data.date.getDate() }}</time>

          <div v-if="data.type === 'current-month' && visibleTasksByDate.has(data.day)" class="day-points">
            <el-tooltip
              v-for="task in visibleTasksByDate.get(data.day)"
              :key="task.id"
              :trigger="['hover', 'focus']"
              :show-after="120"
              effect="light"
              placement="top"
            >
              <template #content>
                <div class="task-preview">
                  <strong>{{ task.title }}</strong>
                  <p v-if="task.content">{{ task.content }}</p>
                </div>
              </template>
              <button
                type="button"
                class="task-point"
                :aria-label="task.title"
                :style="{ '--point-color': colorHex(task.color) }"
                @click.stop
              />
            </el-tooltip>
          </div>
        </template>
      </el-calendar>
    </el-config-provider>
  </section>
</template>

<style scoped>
.review-calendar {
  min-height: 0;
  overflow: auto;
}

.calendar-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.review-calendar :deep(.el-calendar) {
  min-width: 320px;
}

.review-calendar :deep(.el-calendar__header) {
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
}

.review-calendar :deep(.el-calendar-day) {
  height: auto;
  min-height: var(--el-calendar-cell-width);
}

.day-points {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.task-point {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.task-point::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--point-color);
}

.task-point:hover::before,
.task-point:focus-visible::before {
  transform: scale(1.35);
}

.task-point:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.task-preview {
  max-width: 260px;
  overflow-wrap: anywhere;
}

.task-preview p {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  overflow: hidden;
  margin: 6px 0 0;
  white-space: pre-wrap;
  color: var(--el-text-color-regular);
}
</style>
