import { ref, watch } from 'vue'

/** 任务数据层：只做任务记录（标题 + 内容 + 完成），localStorage 持久化 */

export interface Task {
  id: string
  title: string
  /** 任务内容 / 摘要详情 */
  content: string
  done: boolean
  /** 标记完成时的本地日期，格式为 YYYY-MM-DD */
  completedOn?: string
  /** 图钉固定：固定后不可拖动排序 */
  pinned: boolean
  /** 标题前的颜色圆点 */
  color: TaskColor
  createdAt: string
}

export const TASK_STORAGE_KEY = 'wb_taskboard_v1'
const CALENDAR_EXAMPLES_KEY = 'wb_calendar_examples_v1'

/** 任务颜色：使用 Element Plus 语义色 */
export type TaskColor = 'success' | 'warning' | 'danger' | 'primary' | 'info'
export const TASK_COLORS: { name: TaskColor; hex: string; label: string; shortLabel: string }[] = [
  { name: 'success', hex: '#67C23A', label: '绿色 Success', shortLabel: '绿色' },
  { name: 'warning', hex: '#E6A23C', label: '橙色 Warning', shortLabel: '橙色' },
  { name: 'danger', hex: '#F56C6C', label: '红色 Danger', shortLabel: '红色' },
  { name: 'primary', hex: '#409EFF', label: 'Element Plus 蓝', shortLabel: '蓝色' },
  { name: 'info', hex: '#909399', label: '灰色 Info', shortLabel: '灰色' },
]

export function isTaskColor(value: unknown): value is TaskColor {
  return TASK_COLORS.some((color) => color.name === value)
}

export function colorHex(name: TaskColor): string {
  return TASK_COLORS.find((c) => c.name === name)?.hex ?? '#909399'
}

export function pad(n: number) {
  return String(n).padStart(2, '0')
}
export function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function todayStr() {
  return fmt(new Date())
}

export function seedTasks(): Task[] {
  const t = todayStr()
  return [
    {
      id: 't1',
      title: '把 Q3 增长方案的结论页写完',
      content: '结论页分三块：\n1. 核心指标达成情况\n2. 增长驱动因素分析\n3. 下一步建议\n\n6 月渠道口径数据找数据组确认。',
      done: false,
      pinned: false,
      color: 'danger',
      createdAt: t,
    },
    { id: 't2', title: '和设计过一遍首页改版稿', content: '', done: false, pinned: false, color: 'warning', createdAt: t },
    {
      id: 't3',
      title: '整理下半年个人学习清单',
      content: '方向：前端工程化、数据可视化、英语。',
      done: false,
      pinned: false,
      color: 'success',
      createdAt: t,
    },
    { id: 't4', title: '预约体检', content: '', done: false, pinned: false, color: 'info', createdAt: t },
    { id: 't5', title: '周会材料发群里', content: '', done: true, completedOn: t, pinned: false, color: 'info', createdAt: t },
  ]
}

/** 读取任务：兼容旧版字段（priority/due/project/postponed 直接丢弃），空数组不复活种子 */
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data)) {
        return data.map(
          (d: Partial<Task> & { id?: string }): Task => ({
            id: d.id ?? `t_${Date.now()}`,
            title: d.title ?? '',
            content: d.content ?? '',
            done: !!d.done,
            completedOn: d.done && typeof d.completedOn === 'string' ? d.completedOn : undefined,
            pinned: !!d.pinned,
            color: isTaskColor(d.color) ? d.color : 'info',
            createdAt: d.createdAt ?? todayStr(),
          }),
        )
      }
    }
  } catch {
    /* ignore */
  }
  return seedTasks()
}

function calendarExamples(): Task[] {
  const today = new Date()
  const examples: { daysAgo: number; title: string; content: string; color: TaskColor }[] = [
    { daysAgo: 0, title: '整理复盘笔记', content: '记录本月的关键进展和下月要改进的一件事。', color: 'primary' },
    { daysAgo: 0, title: '发出项目更新', content: '同步当前进度、待确认事项和下一步安排。', color: 'success' },
    { daysAgo: 0, title: '修复表单校验问题', content: '检查空值提交和错误提示，验证修复结果。', color: 'danger' },
    { daysAgo: 2, title: '核对活动物料', content: '逐项检查文案、配图和发布链接。', color: 'warning' },
    { daysAgo: 5, title: '归档会议纪要', content: '整理决议和待办，按主题归档。', color: 'info' },
    { daysAgo: 8, title: '更新项目清单', content: '补齐负责人、交付物和当前状态。', color: 'primary' },
  ]

  return examples.map(({ daysAgo, title, content, color }, index) => {
    const day = Math.max(1, today.getDate() - daysAgo)
    const completedOn = fmt(new Date(today.getFullYear(), today.getMonth(), day))
    return {
      id: `calendar_demo_${index + 1}`,
      title: `【示例】${title}`,
      content,
      done: true,
      completedOn,
      pinned: false,
      color,
      createdAt: completedOn,
    }
  })
}

function loadInitialTasks(): Task[] {
  let initialTasks = loadTasks()
  try {
    if (localStorage.getItem(CALENDAR_EXAMPLES_KEY)) return initialTasks

    const existingIds = new Set(initialTasks.map((task) => task.id))
    const examples = calendarExamples().filter((task) => !existingIds.has(task.id))
    initialTasks = [...initialTasks, ...examples]
    saveTasks(initialTasks)
    localStorage.setItem(CALENDAR_EXAMPLES_KEY, '1')
  } catch {
    /* ignore */
  }
  return initialTasks
}

function saveTasks(items: Task[]) {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(items))
}

/** 全局共享任务列表：任务看板与快捷创建入口共用，任何页面创建都会实时同步 */
export const tasks = ref<Task[]>(loadInitialTasks())
watch(
  tasks,
  (v) => {
    try {
      saveTasks(v)
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

export function restoreTasks(restoredTasks: Task[]) {
  try {
    localStorage.setItem(CALENDAR_EXAMPLES_KEY, '1')
    saveTasks(restoredTasks)
  } catch {
    throw new Error('写入浏览器存储失败，任务未导入。')
  }
  tasks.value = restoredTasks
}

export function toggleTaskDone(id: string) {
  const task = tasks.value.find((item) => item.id === id)
  if (!task) return

  task.completedOn = task.done ? undefined : todayStr()
  task.done = !task.done
}

/** 快捷创建任务（供快速添加框与全局浮动入口调用） */
export function addTask(title: string, content = '', color: TaskColor = 'info') {
  const t = title.trim()
  if (!t) return
  tasks.value.unshift({
    id: `t_${Date.now()}`,
    title: t,
    content,
    done: false,
    pinned: false,
    color,
    createdAt: todayStr(),
  })
}
