<script setup lang="ts">
import { CalendarDays, CheckCheck, ChevronLeft, ChevronRight, Layers, ListChecks } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'
import { colorHex, fmt, tasks, type Task, type TaskColor } from '../data/taskStore'
import TaskColorFilter from './TaskColorFilter.vue'

const selectedDate = ref(new Date())
const selectedColors = ref<TaskColor[]>([])
const showExamples = ref(false)
const calendarGrid = ref<HTMLDivElement>()
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const selectedKey = computed(() => fmt(selectedDate.value))
const monthKey = computed(() => selectedKey.value.slice(0, 7))
const monthLabel = computed(() => `${selectedDate.value.getFullYear()} 年 ${selectedDate.value.getMonth() + 1} 月`)
const dayLabel = computed(() => `${selectedDate.value.getMonth() + 1} 月 ${selectedDate.value.getDate()} 日`)
const weekdayLabel = computed(() => `星期${weekdays[(selectedDate.value.getDay() + 6) % 7]}`)

function isExample(task: Task) {
  return /^calendar_demo_\d+$/.test(task.id) && task.title.startsWith('【示例】')
}

const completedTasks = computed(() => tasks.value.filter((task) => task.done && task.completedOn))
const monthlyTasks = computed(() => completedTasks.value.filter((task) => task.completedOn!.startsWith(`${monthKey.value}-`)))
const monthlyRealTasks = computed(() => monthlyTasks.value.filter((task) => !isExample(task)))
const exampleCount = computed(() => monthlyTasks.value.filter(isExample).length)
const filteredTasks = computed(() => {
  const colors = new Set(selectedColors.value)
  return completedTasks.value.filter((task) => (!isExample(task) || showExamples.value) && (!colors.size || colors.has(task.color)))
})
const tasksByDate = computed(() => {
  const byDate = new Map<string, Task[]>()
  for (const task of filteredTasks.value) {
    const dayTasks = byDate.get(task.completedOn!) ?? []
    dayTasks.push(task)
    byDate.set(task.completedOn!, dayTasks)
  }
  return byDate
})
const monthlyStats = computed(() => {
  const colors = new Set(selectedColors.value)
  const realTasks = monthlyRealTasks.value.filter((task) => !colors.size || colors.has(task.color))
  const counts = new Map<string, number>()
  for (const task of realTasks) counts.set(task.completedOn!, (counts.get(task.completedOn!) ?? 0) + 1)
  return { completed: realTasks.length, days: counts.size, best: Math.max(0, ...counts.values()) }
})
const selectedTasks = computed(() => tasksByDate.value.get(selectedKey.value) ?? [])
const selectedRealCount = computed(() => selectedTasks.value.filter((task) => !isExample(task)).length)
const selectedExampleCount = computed(() => selectedTasks.value.filter(isExample).length)
const monthHasVisibleTasks = computed(() => [...tasksByDate.value.keys()].some((day) => day.startsWith(`${monthKey.value}-`)))
const emptyMonthMessage = computed(() => {
  if (monthHasVisibleTasks.value) return ''
  if (selectedColors.value.length) return '本月没有符合颜色筛选的记录，可以清除筛选查看全部。'
  return '本月还没有完成记录。完成任务后，会自动出现在对应日期。'
})
const emptyDayMessage = computed(() => {
  if (selectedColors.value.length) return '当天没有符合颜色筛选的记录，试试其他颜色或清除筛选。'
  return selectedKey.value === fmt(new Date()) ? '今天完成的任务会自动汇集到这里。' : '这一天还没有完成记录，可以选择其他日期回顾。'
})
const calendarDays = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7
  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1)
    const key = fmt(date)
    const items = tasksByDate.value.get(key) ?? []
    const realCount = items.filter((task) => !isExample(task)).length
    const examples = items.length - realCount
    return {
      date, key, items, realCount,
      isCurrentMonth: date.getMonth() === month,
      isToday: key === fmt(new Date()),
      label: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日，${realCount}项完成${examples ? `，${examples}项示例` : ''}`,
    }
  })
})

function changeMonth(offset: number) {
  const current = selectedDate.value
  const lastDay = new Date(current.getFullYear(), current.getMonth() + offset + 1, 0).getDate()
  selectedDate.value = new Date(current.getFullYear(), current.getMonth() + offset, Math.min(current.getDate(), lastDay))
}

function changeDay(offset: number) {
  const current = selectedDate.value
  selectedDate.value = new Date(current.getFullYear(), current.getMonth(), current.getDate() + offset)
}

async function moveCalendarFocus(event: KeyboardEvent) {
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
  const offset = offsets[event.key]
  if (offset === undefined) return
  event.preventDefault()
  changeDay(offset)
  await nextTick()
  calendarGrid.value?.querySelector<HTMLButtonElement>(`[data-date="${selectedKey.value}"]`)?.focus()
}
</script>

<template>
  <el-scrollbar class="review-scrollbar" aria-label="月度复盘滚动区域" tabindex="0">
    <section class="review-calendar" aria-label="月度复盘">
      <header class="review-heading">
        <div>
          <el-text tag="h1" size="large">每一件完成，都算进展</el-text>
          <el-text tag="p" size="small" type="info">回看这个月做成的事，也看见自己的节奏。</el-text>
        </div>
        <el-text class="review-local" size="small" type="info">
          <span />记录来自本地任务
        </el-text>
      </header>

      <div class="review-toolbar">
        <div class="month-navigation">
          <el-text tag="h2" size="large">{{ monthLabel }}</el-text>
          <el-button-group>
            <el-button :icon="ChevronLeft" size="small" aria-label="上个月" @click="changeMonth(-1)" />
            <el-button :icon="ChevronRight" size="small" aria-label="下个月" @click="changeMonth(1)" />
          </el-button-group>
          <el-button size="small" @click="selectedDate = new Date()">今天</el-button>
        </div>
        <TaskColorFilter v-model="selectedColors" :items="monthlyRealTasks" size="small" placeholder="全部颜色" />
      </div>

      <div class="review-summary" aria-label="本月真实任务统计" aria-live="polite">
        <div class="summary-item summary-item--primary">
          <span class="summary-icon"><CheckCheck :size="19" /></span>
          <el-statistic title="本月完成" :value="monthlyStats.completed">
            <template #suffix><el-text size="small" type="info">项任务</el-text></template>
          </el-statistic>
        </div>
        <div class="summary-item summary-item--success">
          <span class="summary-icon"><CalendarDays :size="19" /></span>
          <el-statistic title="有完成记录" :value="monthlyStats.days">
            <template #suffix><el-text size="small" type="info">天</el-text></template>
          </el-statistic>
        </div>
        <div class="summary-item summary-item--warning">
          <span class="summary-icon"><Layers :size="19" /></span>
          <el-statistic title="单日最多" :value="monthlyStats.best">
            <template #suffix><el-text size="small" type="info">项任务</el-text></template>
          </el-statistic>
        </div>
      </div>

      <div class="review-context">
        <el-text size="small" type="info">{{ selectedColors.length ? '已按颜色筛选 · ' : '' }}统计仅包含真实任务</el-text>
        <div v-if="exampleCount || showExamples" class="example-switch">
          <el-text size="small" type="info">显示示例<span v-if="exampleCount">（{{ exampleCount }}）</span></el-text>
          <el-switch v-model="showExamples" size="small" aria-label="显示示例记录，示例不计入统计" />
        </div>
      </div>

      <div class="review-layout">
        <section class="calendar-panel" aria-label="成果日历">
          <div class="panel-heading">
            <el-text tag="h3">成果日历</el-text>
            <el-text size="small" type="info">选择日期，回看当天</el-text>
          </div>
          <el-text v-if="emptyMonthMessage" tag="p" size="small" class="month-notice" role="status">{{ emptyMonthMessage }}</el-text>
          <div class="calendar-weekdays" aria-hidden="true">
            <el-text v-for="weekday in weekdays" :key="weekday" size="small" type="info">{{ weekday }}</el-text>
          </div>
          <div ref="calendarGrid" class="calendar-grid" @keydown="moveCalendarFocus">
            <button
              v-for="day in calendarDays"
              :key="day.key"
              type="button"
              class="calendar-day"
              :class="{ 'is-other-month': !day.isCurrentMonth, 'is-today': day.isToday, 'is-selected': day.key === selectedKey, 'has-records': day.realCount > 0 }"
              :data-date="day.key"
              :aria-label="day.label"
              :aria-current="day.isToday ? 'date' : undefined"
              :aria-pressed="day.key === selectedKey"
              :tabindex="day.key === selectedKey ? 0 : -1"
              @click="selectedDate = day.date"
            >
              <span class="day-top">
                <el-text tag="time" :datetime="day.key" size="small" :type="day.isToday ? 'primary' : !day.isCurrentMonth ? 'info' : undefined">{{ day.date.getDate() }}</el-text>
                <el-text v-if="day.isToday" class="today-label" size="small" type="primary">今</el-text>
              </span>
              <span v-if="day.isCurrentMonth && day.items.length" class="day-records">
                <span v-for="task in day.items.slice(0, 2)" :key="task.id" class="day-task">
                  <span class="task-dot" :style="{ backgroundColor: colorHex(task.color) }" />
                  <el-text size="small" truncated>{{ task.title }}</el-text>
                </span>
                <el-text v-if="day.items.length > 2" class="day-more" size="small" type="info">另有 {{ day.items.length - 2 }} 项</el-text>
              </span>
              <el-text v-if="day.isCurrentMonth && day.items.length" class="day-mobile-count" size="small" type="info">
                {{ day.realCount ? `${day.realCount} 项` : '示例' }}<span v-if="day.realCount && day.items.length > day.realCount"> · 示例</span>
              </el-text>
            </button>
          </div>
          <div class="calendar-footer">
            <span class="today-legend" /><el-text size="small" type="info">今天</el-text>
            <span class="selected-legend" /><el-text size="small" type="info">选中日期</el-text>
            <el-text class="calendar-help" size="small" type="info">方向键可切换日期</el-text>
          </div>
        </section>

        <aside class="day-panel" aria-labelledby="selected-day-title">
          <div class="day-heading">
            <div>
              <el-text size="small" type="info">当日回顾 · {{ weekdayLabel }}</el-text>
              <div class="day-title">
                <el-text id="selected-day-title" tag="h3" size="large">{{ dayLabel }}</el-text>
                <el-tag v-if="selectedKey === fmt(new Date())" size="small" type="primary">今天</el-tag>
              </div>
            </div>
            <el-button-group>
              <el-button :icon="ChevronLeft" size="small" aria-label="前一天" @click="changeDay(-1)" />
              <el-button :icon="ChevronRight" size="small" aria-label="后一天" @click="changeDay(1)" />
            </el-button-group>
          </div>
          <div class="day-count" aria-live="polite">
            <CheckCheck :size="15" />
            <el-text size="small" type="info">{{ selectedRealCount }} 项完成<span v-if="selectedExampleCount"> · {{ selectedExampleCount }} 项示例</span></el-text>
          </div>
          <ul v-if="selectedTasks.length" class="completed-list">
            <li v-for="task in selectedTasks" :key="task.id" class="completed-task">
              <span class="task-check" :style="{ color: colorHex(task.color) }"><CheckCheck :size="17" /></span>
              <div class="task-body">
                <el-text tag="h4">{{ task.title }}</el-text>
                <el-text v-if="isExample(task)" class="example-tag" size="small" type="info">示例记录 · 不计入统计</el-text>
                <details v-if="task.content" class="task-details">
                  <summary><el-text size="small" type="info">任务详情</el-text></summary>
                  <el-scrollbar class="task-detail-scrollbar" max-height="280px" aria-label="任务详情内容" tabindex="0">
                    <el-text tag="p" class="task-content">{{ task.content }}</el-text>
                  </el-scrollbar>
                </details>
              </div>
            </li>
          </ul>
          <div v-else class="day-empty" role="status">
            <span class="empty-icon"><ListChecks :size="25" :stroke-width="1.5" /></span>
            <el-text tag="h4">{{ selectedColors.length ? '暂无匹配记录' : '给这一天留一点空白' }}</el-text>
            <el-text tag="p" size="small" type="info">{{ emptyDayMessage }}</el-text>
            <el-button v-if="selectedColors.length" size="small" plain @click="selectedColors = []">清除颜色筛选</el-button>
          </div>
          <el-text tag="p" class="day-footnote" size="small" type="info">按任务完成日期归档，记录随任务实时更新。</el-text>
        </aside>
      </div>
    </section>
  </el-scrollbar>
</template>

<style scoped>
.review-scrollbar {
  flex: 1;
  min-height: 0;
}

.review-calendar {
  container-type: inline-size;
  min-width: 0;
  padding-inline-end: 12px;
}

.review-heading,
.review-toolbar,
.month-navigation,
.review-context,
.panel-heading,
.day-heading,
.day-title,
.day-count,
.calendar-footer,
.example-switch,
.review-local {
  display: flex;
  align-items: center;
}

.review-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.review-heading h1,
.month-navigation h2,
.panel-heading h3,
.day-title h3,
.task-body h4,
.day-empty h4 {
  font-weight: var(--el-font-weight-primary);
}

.review-heading p {
  margin-top: 6px;
}

.review-local {
  gap: 7px;
  white-space: nowrap;
}

.review-local > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.review-toolbar {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.month-navigation {
  flex-wrap: wrap;
  gap: 12px;
}

.month-navigation h2 {
  white-space: nowrap;
}

.month-navigation .el-button-group + .el-button {
  margin-left: 0;
}

.calendar-day:focus-visible,
.task-details summary:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -3px;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 21px 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.summary-item {
  --summary-color: var(--el-color-primary);
  --summary-background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 0 24px;
}

.summary-item + .summary-item {
  border-left: 1px solid var(--el-border-color-lighter);
}

.summary-item--success {
  --summary-color: var(--el-color-success);
  --summary-background: var(--el-color-success-light-9);
}

.summary-item--warning {
  --summary-color: var(--el-color-warning);
  --summary-background: var(--el-color-warning-light-9);
}

.summary-item :deep(.el-statistic) {
  --el-statistic-title-color: var(--summary-color);
  --el-statistic-content-color: var(--summary-color);
}

.summary-icon {
  display: grid;
  place-items: center;
  flex: 0 0 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--summary-background);
  color: var(--summary-color);
}

.review-context {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
  min-height: 43px;
  padding-block: 6px;
}

.example-switch {
  flex-shrink: 0;
  gap: 8px;
}

.review-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  align-items: start;
  gap: 18px;
  padding-bottom: 24px;
}

.calendar-panel,
.day-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.panel-heading {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 19px 20px 12px;
}

.month-notice {
  display: block;
  margin: 0 16px 10px;
  padding: 9px 11px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin: 0 12px;
}

.calendar-weekdays {
  padding: 8px 0 10px;
  text-align: center;
}

.calendar-grid {
  border-top: 1px solid var(--el-border-color-lighter);
  border-left: 1px solid var(--el-border-color-lighter);
}

.calendar-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  min-height: 92px;
  padding: 9px 7px;
  border: 0;
  border-right: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.calendar-day:hover {
  background: var(--el-fill-color-light);
}

.calendar-day.has-records {
  background: var(--el-fill-color-extra-light);
}

.calendar-day.is-selected {
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}

.calendar-day.is-other-month {
  background: var(--el-fill-color-lighter);
}

.day-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.day-top time {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
}

.is-today .day-top time {
  border: 1px solid var(--el-color-primary);
  border-radius: 6px;
}

.day-records {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 7px;
}

.day-task {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.task-dot {
  flex: 0 0 5px;
  height: 5px;
  border-radius: 50%;
}

.day-task .el-text {
  flex: 1;
  min-width: 0;
}

.day-more {
  align-self: start;
  padding-left: 10px;
}

.day-mobile-count {
  display: none;
}

.calendar-footer {
  gap: 6px;
  padding: 14px 17px;
}

.today-legend,
.selected-legend {
  width: 10px;
  height: 10px;
  border: 1px solid var(--el-color-primary);
  border-radius: 3px;
}

.selected-legend {
  margin-left: 10px;
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.calendar-help {
  margin-left: auto;
}

.day-heading {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 21px 20px 15px;
}

.day-title {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 7px;
}

.day-count {
  gap: 7px;
  margin: 0 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.day-count > svg {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.completed-list {
  margin: 0;
  padding: 0 20px;
  list-style: none;
}

.completed-task {
  display: flex;
  align-items: start;
  gap: 10px;
  padding: 18px 0;
}

.completed-task + .completed-task {
  border-top: 1px solid var(--el-border-color-lighter);
}

.task-check {
  flex: 0 0 17px;
  padding-top: 2px;
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-body h4 {
  overflow-wrap: anywhere;
}

.example-tag {
  display: block;
  margin-top: 5px;
}

.task-details {
  margin-top: 8px;
}

.task-details summary {
  width: fit-content;
  padding: 2px 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.task-detail-scrollbar {
  margin-top: 8px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.task-content {
  display: block;
  padding: 10px 16px 10px 10px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.day-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-placeholder);
}

.day-empty h4 {
  margin-top: 17px;
}

.day-empty p {
  max-width: 230px;
  margin-top: 8px;
}

.day-empty .el-button {
  margin-top: 14px;
}

.day-footnote {
  display: block;
  padding: 14px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
}

@container (max-width: 940px) {
  .review-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .day-empty {
    padding: 28px 24px;
  }

  .summary-item {
    padding: 0 18px;
  }

  .review-local {
    display: none;
  }
}

@container (max-width: 560px) {
  .review-heading {
    margin-bottom: 20px;
  }

  .review-toolbar {
    flex-wrap: wrap;
  }

  .month-navigation {
    gap: 8px;
  }

  .review-toolbar .task-color-filter {
    width: 124px;
  }

  .review-summary {
    padding: 16px 0;
    border-radius: 9px;
  }

  .summary-item {
    padding: 0 8px;
  }

  .summary-icon {
    display: none;
  }

  .example-switch {
    gap: 4px;
  }

  .calendar-panel,
  .day-panel {
    border-radius: 9px;
  }

  .panel-heading {
    padding: 16px 12px 10px;
  }

  .calendar-weekdays,
  .calendar-grid {
    margin-inline: 8px;
  }

  .calendar-day {
    min-height: 65px;
    padding: 6px 3px;
  }

  .day-top {
    justify-content: center;
  }

  .today-label,
  .day-records {
    display: none;
  }

  .day-mobile-count {
    display: block;
    margin-top: 6px;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .calendar-footer {
    padding: 12px;
  }

  .calendar-help {
    display: none;
  }

  .month-notice {
    margin-inline: 9px;
  }

  .day-heading {
    padding: 18px 16px 14px;
  }

  .day-count {
    margin-inline: 16px;
  }

  .completed-list {
    padding-inline: 16px;
  }
}
</style>
