<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import TaskBoard from './components/TaskBoard.vue'
import QuickCapture from './components/QuickCapture.vue'
import ReviewCalendar from './components/ReviewCalendar.vue'
import DataBackup from './components/DataBackup.vue'
import HealthReminders from './components/HealthReminders.vue'
import ThemeSettings from './components/ThemeSettings.vue'
import { startHealthReminderScheduler } from './data/healthReminders'

/** 三级类目数据结构：一级 → 二级 → 三级（三级作为内容区分段） */
interface Third {
  label: string
  desc: string
}
interface Second {
  label: string
  icon: string
  thirds: Third[]
}
interface First {
  label: string
  icon: string
  seconds: Second[]
}

const menus: First[] = [
  {
    label: '工作台',
    icon: 'House',
    seconds: [
      {
        label: '任务管理',
        icon: 'List',
        thirds: [
          { label: '全部', desc: '查看所有任务，包含已完成。' },
          { label: '未完成', desc: '还需要处理的任务。' },
          { label: '已完成', desc: '归档已经完成的任务记录。' },
        ],
      },
      {
        label: '复盘',
        icon: 'TrendCharts',
        thirds: [],
      },
    ],
  },
  {
    label: '定时任务',
    icon: 'Timer',
    seconds: [{ label: '健康提醒', icon: 'Bell', thirds: [] }],
  },
  {
    label: '系统设置',
    icon: 'Setting',
    seconds: [
      {
        label: '基础设置',
        icon: 'Tools',
        thirds: [
          { label: '数据备份', desc: '导出或导入数据备份文件。' },
          { label: '主题设置', desc: '切换浅色或暗色主题。' },
        ],
      },
    ],
  },
]

const activeFirst = ref(0)
const activeSecond = ref(new URLSearchParams(window.location.search).get('view') === 'review' ? 1 : 0)
const activeThird = ref(0)

/** 一级导航是否收缩为窄条（只保留图标），默认收起 */
const collapsed = ref(true)

const currentFirst = computed(() => menus[activeFirst.value])
const currentSecond = computed(() => currentFirst.value.seconds[activeSecond.value])
const currentThird = computed<Third | undefined>(() => currentSecond.value.thirds[activeThird.value])

/** 当前是否为「工作台 / 任务管理」栏目（按名称判断，避免索引变化出错） */
const isTaskBoard = computed(
  () => activeFirst.value === 0 && currentSecond.value.label === '任务管理',
)
const isReview = computed(() => activeFirst.value === 0 && currentSecond.value.label === '复盘')
const isHealthReminders = computed(() => currentSecond.value.label === '健康提醒')
const isDataBackup = computed(() => currentThird.value?.label === '数据备份')
const isThemeSettings = computed(() => currentThird.value?.label === '主题设置')

let stopHealthReminderScheduler: (() => void) | undefined
onMounted(() => { stopHealthReminderScheduler = startHealthReminderScheduler() })
onBeforeUnmount(() => stopHealthReminderScheduler?.())

type TaskFilter = 'all' | 'active' | 'done'
/** 任务管理三级页签与看板筛选一一对应 */
const TASK_FILTERS: TaskFilter[] = ['all', 'active', 'done']
const taskFilter = computed<TaskFilter>(() => TASK_FILTERS[activeThird.value] ?? 'all')
/** 当前三级分类下的任务数，由看板同步上来 */
const taskCount = ref(0)

/** 切换一级导航时，重置二级、三级到第一项 */
function selectFirst(index: number) {
  activeFirst.value = index
  activeSecond.value = 0
  activeThird.value = 0
}

/** 切换二级导航时，重置三级到第一项 */
function selectSecond(index: number) {
  activeSecond.value = index
  activeThird.value = 0
}
</script>

<template>
  <div class="layout" :class="{ 'is-collapsed': collapsed, 'is-review': isReview }">
    <!-- 最左：一级导航（可收缩/展开） -->
    <aside class="nav-first">
      <div class="brand" title="事间">
        <span class="shijian-mark" aria-hidden="true">事</span>
        <span class="brand-name" v-show="!collapsed">事间</span>
      </div>

      <nav class="first-menu">
        <el-tooltip
          v-for="(first, fi) in menus"
          :key="first.label"
          :content="first.label"
          placement="right"
          :disabled="!collapsed"
        >
          <button
            class="first-item"
            :class="{ active: fi === activeFirst }"
            :aria-label="first.label"
            @click="selectFirst(fi)"
          >
            <el-icon class="first-icon"><component :is="first.icon" /></el-icon>
            <span class="first-label" v-show="!collapsed">{{ first.label }}</span>
          </button>
        </el-tooltip>
      </nav>

      <div class="first-foot">
        <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开菜单' : '收起菜单'">
          <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          <span class="collapse-label" v-show="!collapsed">收起菜单</span>
        </button>
      </div>
    </aside>

    <!-- 中间：二级导航 -->
    <aside class="nav-second">
      <div class="second-title">{{ currentFirst.label }}</div>
      <nav class="second-menu">
        <button
          v-for="(second, si) in currentFirst.seconds"
          :key="second.label"
          class="second-item"
          :class="{ active: si === activeSecond }"
          @click="selectSecond(si)"
        >
          <el-icon><component :is="second.icon" /></el-icon>
          <span>{{ second.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- 右侧：内容区（三级） -->
    <main class="content">
      <header class="topbar">
        <el-breadcrumb separator="/" class="crumb">
          <el-breadcrumb-item>{{ currentFirst.label }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentSecond.label }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="currentThird">{{ currentThird.label }}</el-breadcrumb-item>
        </el-breadcrumb>
      </header>

      <!-- 内容版面：三级页签 + 对应内容 -->
      <section class="content-body">
        <div v-if="currentSecond.thirds.length" class="third-tabs" :class="{ 'task-tabs': isTaskBoard }">
          <button
            v-for="(third, ti) in currentSecond.thirds"
            :key="third.label"
            class="third-tab"
            :class="{ active: ti === activeThird }"
            @click="activeThird = ti"
          >
            <el-text>{{ third.label }}</el-text>
          </button>
          <span v-if="isTaskBoard" class="tab-count">{{ taskCount }} 项任务</span>
        </div>

        <TaskBoard
          v-if="isTaskBoard"
          :filter="taskFilter"
          @count-change="taskCount = $event"
        />
        <ReviewCalendar v-else-if="isReview" />
        <HealthReminders v-else-if="isHealthReminders" />
        <DataBackup v-else-if="isDataBackup" />
        <ThemeSettings v-else-if="isThemeSettings" />
        <div v-else-if="currentThird" class="content-placeholder">
          <el-empty :description="`「${currentSecond.label}」栏目开发中`" />
        </div>
      </section>
    </main>

    <!-- 全局快捷创建任务浮动入口（每个页面可见） -->
    <QuickCapture />
  </div>
</template>
