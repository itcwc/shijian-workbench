<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { Pin } from 'lucide-vue-next'
import { addTask as createTask, colorHex, tasks, toggleTaskDone, type Task, type TaskColor } from '../data/taskStore'
import TaskColorFilter from './TaskColorFilter.vue'
import TaskFields from './TaskFields.vue'

/* ---------- 筛选（由内容区三级页签驱动） ---------- */
const props = defineProps<{
  filter: 'all' | 'active' | 'done'
}>()
const emit = defineEmits<{ (e: 'count-change', count: number): void }>()
const search = ref('')
const selectedColors = ref<TaskColor[]>([])
const keyword = computed(() => search.value.trim().toLowerCase())

const availableTasks = computed(() => tasks.value.filter((task) => {
  if (props.filter !== 'all' && task.done !== (props.filter === 'done')) return false
  return !keyword.value || task.title.toLowerCase().includes(keyword.value) ||
    task.content.toLowerCase().includes(keyword.value)
}))

const filteredTasks = computed(() => {
  const colors = new Set(selectedColors.value)
  return colors.size ? availableTasks.value.filter((task) => colors.has(task.color)) : availableTasks.value
})

watch(
  () => filteredTasks.value.length,
  (n) => emit('count-change', n),
  { immediate: true },
)

/** 图钉固定：固定后不可拖动排序 */
function togglePin(id: string) {
  const t = tasks.value.find((x) => x.id === id)
  if (t) t.pinned = !t.pinned
}
function removeTask(id: string) {
  tasks.value = tasks.value.filter((x) => x.id !== id)
}

const taskDialogVisible = ref(false)
const taskFields = ref<InstanceType<typeof TaskFields>>()
const taskForm = ref({ id: '', title: '', content: '', color: 'info' as TaskColor })

function openAdd() {
  taskForm.value = { id: '', title: '', content: '', color: 'info' }
  taskDialogVisible.value = true
}

function openDetail(task: Task) {
  taskForm.value = { id: task.id, title: task.title, content: task.content, color: task.color }
  taskDialogVisible.value = true
}

function saveTaskForm() {
  const { id, title, content, color } = taskForm.value
  if (id) {
    const task = tasks.value.find((item) => item.id === id)
    if (task) {
      task.title = title.trim() || task.title
      task.content = content
      task.color = color
    }
  } else {
    if (!title.trim()) {
      ElMessage.warning('先写个标题')
      return
    }
    createTask(title, content, color)
    ElMessage.success('已添加任务')
  }
  taskDialogVisible.value = false
}

/* ---------- 右键菜单：完成 / 删除 ---------- */
const menu = ref({ visible: false, x: 0, y: 0, task: null as Task | null })

function onContextMenu(e: MouseEvent, task: Task) {
  const w = 140
  const h = 92
  menu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - w - 8),
    y: Math.min(e.clientY, window.innerHeight - h - 8),
    task,
  }
}
function closeMenu() {
  menu.value.visible = false
}
function onToggleDone() {
  if (menu.value.task) toggleTaskDone(menu.value.task.id)
  closeMenu()
}
function onRemove() {
  if (menu.value.task) removeTask(menu.value.task.id)
  closeMenu()
}

/* ---------- 拖拽排序（与点击看详情、右键菜单共存） ---------- */
interface Dragging {
  id: string
  task: Task
  w: number
  h: number
  ox: number
  oy: number
  x: number
  y: number
}
interface CardItem {
  key: string
  task: Task | null
  ph: boolean
}

const gridEl = ref<HTMLElement | null>(null)
const dragging = ref<Dragging | null>(null)
const placeholderIndex = ref(0)
const viewOrder = ref<Task[]>([])
/** 拖拽开始时各卡片的布局位置，插入判定基于此，避免 FLIP 动画反向干扰造成闪动 */
let dragRects = new Map<string, DOMRect>()

/** 渲染列表：固定卡片锁定原位，被拖项移出，占位符只在非固定槽位间移动 */
const displayList = computed<CardItem[]>(() => {
  if (!dragging.value) {
    return filteredTasks.value.map((t) => ({ key: t.id, task: t, ph: false }))
  }
  const dragId = dragging.value!.id
  // 可排序任务（非固定、非被拖），占位符插入其中
  const movable: (Task | null)[] = viewOrder.value.filter((t) => !t.pinned && t.id !== dragId)
  movable.splice(Math.min(placeholderIndex.value, movable.length), 0, null)
  // 重建：固定任务原位不动，非固定槽位依次取可排序序列（含占位符）
  let mi = 0
  return viewOrder.value.map((t): CardItem => {
    if (t.pinned) return { key: t.id, task: t, ph: false }
    const m = movable[mi++]
    return m ? { key: m.id, task: m, ph: false } : { key: '__ph__', task: null, ph: true }
  })
})

/** 把新的可见顺序写回完整 tasks：只重排可见项原本占据的位置，隐藏项保持原位 */
function commitOrder(orderedVisibleIds: string[]) {
  const visibleIds = new Set(filteredTasks.value.map((t) => t.id))
  if (orderedVisibleIds.length !== visibleIds.size || orderedVisibleIds.some((id) => !visibleIds.has(id))) return
  const positions: number[] = []
  tasks.value.forEach((t, i) => {
    if (visibleIds.has(t.id)) positions.push(i)
  })
  const map = new Map(tasks.value.map((t) => [t.id, t]))
  const next = tasks.value.slice()
  orderedVisibleIds.forEach((id, i) => {
    const task = map.get(id)
    if (task && positions[i] !== undefined) next[positions[i]] = task
  })
  tasks.value = next
}

/** 计算插入索引：基于拖拽开始时的缓存位置，不被动画反向影响 */
function computeInsert(cx: number, cy: number): number {
  // 只考虑可排序卡片（非固定、非被拖），固定卡片不参与插入判定
  const others = viewOrder.value.filter((t) => !t.pinned && t.id !== dragging.value!.id)

  let hitIdx = -1
  let hitR: DOMRect | null = null
  for (let i = 0; i < others.length; i++) {
    const r = dragRects.get(others[i].id)
    if (!r) continue
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      hitIdx = i
      hitR = r
      break
    }
  }
  if (hitIdx >= 0 && hitR) {
    return cx < hitR.left + hitR.width / 2 ? hitIdx : hitIdx + 1
  }

  let best = others.length
  let bestD = Infinity
  for (let i = 0; i < others.length; i++) {
    const r = dragRects.get(others[i].id)
    if (!r) continue
    const d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2))
    if (d < bestD) {
      bestD = d
      best = cx < r.left + r.width / 2 ? i : i + 1
    }
  }
  return best
}

interface Pending {
  task: Task
  x: number
  y: number
}
let pending: Pending | null = null
let suppressClickFlag = false

function onPointerDown(e: PointerEvent, task: Task) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (task.pinned) return // 图钉固定的任务不可拖动
  pending = { task, x: e.clientX, y: e.clientY }
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function startDrag(task: Task, e: PointerEvent) {
  const grid = gridEl.value
  viewOrder.value = filteredTasks.value.slice()
  dragRects = new Map()
  let rect: DOMRect | undefined
  if (grid) {
    for (const t of viewOrder.value) {
      const el = grid.querySelector<HTMLElement>(`[data-task-id="${t.id}"]`)
      if (!el) continue
      const r = el.getBoundingClientRect()
      dragRects.set(t.id, r)
      if (t.id === task.id) rect = r
    }
  }
  dragging.value = {
    id: task.id,
    task,
    w: rect?.width ?? 0,
    h: rect?.height ?? 0,
    ox: e.clientX - (rect?.left ?? 0),
    oy: e.clientY - (rect?.top ?? 0),
    x: rect?.left ?? e.clientX,
    y: rect?.top ?? e.clientY,
  }
  placeholderIndex.value = Math.max(0, viewOrder.value.findIndex((t) => t.id === task.id))
}

function onPointerMove(e: PointerEvent) {
  if (pending && !dragging.value) {
    // 移动超过阈值才进入拖拽，否则当作点击
    if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < 5) return
    startDrag(pending.task, e)
    pending = null
  }
  const d = dragging.value
  if (!d) return
  e.preventDefault()
  d.x = e.clientX - d.ox
  d.y = e.clientY - d.oy
  placeholderIndex.value = computeInsert(e.clientX, e.clientY)
}

function onPointerUp() {
  const d = dragging.value
  if (d) {
    // 固定卡片保持原位，被拖任务只插入到非固定槽位
    const movable = viewOrder.value.filter((t) => !t.pinned && t.id !== d.id)
    movable.splice(Math.min(placeholderIndex.value, movable.length), 0, d.task)
    let mi = 0
    const newViewOrder = viewOrder.value.map((t) => (t.pinned ? t : movable[mi++]))
    commitOrder(newViewOrder.map((t) => t.id))
    // 拖拽结束后吞掉紧随的 click，避免误触打开详情
    suppressClickFlag = true
    setTimeout(() => {
      suppressClickFlag = false
    }, 0)
  }
  pending = null
  dragging.value = null
  cleanupDragListeners()
}

function cleanupDragListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}
onBeforeUnmount(cleanupDragListeners)

const ghostStyle = computed(() => {
  const d = dragging.value
  if (!d) return {}
  return {
    left: `${d.x}px`,
    top: `${d.y}px`,
    width: `${d.w}px`,
    height: `${d.h}px`,
  }
})

function onCardClick(task: Task) {
  if (suppressClickFlag) return
  openDetail(task)
}
</script>

<template>
  <div class="board">
    <!-- 搜索、颜色筛选与添加 -->
    <div class="board-head">
      <el-input
        v-model="search"
        class="search-input"
        :prefix-icon="Search"
        placeholder="搜索任务标题或内容"
        aria-label="搜索任务"
        clearable
      />
      <TaskColorFilter v-model="selectedColors" :items="availableTasks" placeholder="筛选颜色" />
      <el-button type="primary" @click="openAdd">
        <el-icon><Plus /></el-icon><span>添加</span>
      </el-button>
      <span class="ctx-tip">拖动排序 · 右键完成/删除 · 点击查看</span>
    </div>

    <!-- 卡片网格 -->
    <div class="grid-wrap" ref="gridEl">
      <TransitionGroup name="flip" tag="div" class="task-grid">
        <div
          v-for="item in displayList"
          :key="item.key"
          class="task-card"
          :class="{ 'is-placeholder': item.ph, 'is-done': item.task?.done, 'is-pinned': item.task?.pinned }"
          :data-task-id="item.task?.id"
          :style="item.ph && dragging ? { height: dragging.h + 'px' } : {}"
          @pointerdown="item.task && onPointerDown($event, item.task)"
          @click="item.task && onCardClick(item.task)"
          @contextmenu.prevent="item.task && onContextMenu($event, item.task)"
        >
          <template v-if="item.task">
            <button
              class="pin-btn"
              :class="{ 'is-pinned': item.task.pinned }"
              :title="item.task.pinned ? '取消固定' : '固定（固定后不可拖动）'"
              @pointerdown.stop
              @click.stop="togglePin(item.task.id)"
            >
              <Pin :size="14" :stroke-width="2" />
            </button>
            <div class="card-top">
              <span class="color-dot" :style="{ background: colorHex(item.task.color) }" />
              <span class="card-title" :title="item.task.title">{{ item.task.title }}</span>
            </div>
          </template>
        </div>
      </TransitionGroup>

      <el-empty
        v-if="!dragging && filteredTasks.length === 0"
        :description="keyword || selectedColors.length ? '没有匹配的任务' : '这里还没有任务'"
        class="board-empty"
      />
    </div>

    <!-- 拖拽浮层 -->
    <div v-if="dragging" class="drag-ghost" :style="ghostStyle">
      <div class="card-top">
        <span class="card-title">{{ dragging.task.title }}</span>
      </div>
    </div>

    <el-dialog
      v-model="taskDialogVisible"
      :title="taskForm.id ? '任务详情' : '添加任务'"
      width="min(720px, calc(100vw - 32px))"
      align-center
      @opened="taskFields?.focusTitle()"
    >
      <TaskFields
        ref="taskFields"
        v-model:title="taskForm.title"
        v-model:content="taskForm.content"
        v-model:color="taskForm.color"
        :rows="taskForm.id ? 14 : 10"
        @submit="saveTaskForm"
      />
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTaskForm">{{ taskForm.id ? '保存' : '添加任务' }}</el-button>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="menu.visible"
        class="ctx-mask"
        @click="closeMenu"
        @contextmenu.prevent="closeMenu"
      >
        <div
          class="ctx-menu"
          :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
          @click.stop
        >
          <button class="ctx-item" @click="onToggleDone">
            {{ menu.task?.done ? '标记为未完成' : '标记完成' }}
          </button>
          <button class="ctx-item is-danger" @click="onRemove">删除</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.board {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.board-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.ctx-tip {
  margin-left: auto;
  align-self: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.search-input {
  width: min(420px, 100%);
}
.grid-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* 给图钉和阴影留出空间，同时让卡片与工具栏对齐。 */
  margin-inline: -14px;
  padding: 12px 14px 24px;
}
.task-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  align-content: start;
  align-items: start;
}

.task-card {
  position: relative;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 16px 18px;
  min-width: 0;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  cursor: grab;
  user-select: none;
  touch-action: none;
  box-shadow: 0 1px 3px rgba(31, 58, 95, 0.05);
  transition: box-shadow 0.18s, border-color 0.18s;
}
.task-card:hover {
  box-shadow: 0 6px 18px rgba(31, 58, 95, 0.1);
  border-color: var(--el-color-primary-light-5);
}
.task-card:active {
  cursor: grabbing;
}
.task-card.is-done {
  opacity: 0.6;
}
.task-card.is-done .card-title {
  text-decoration: line-through;
  color: var(--el-text-color-secondary);
}
/* 固定的任务不可拖动，光标不再显示抓手 */
.task-card.is-pinned {
  cursor: default;
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.color-dot {
  flex-shrink: 0;
  margin-top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.card-title {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: anywhere;
}
/* 图钉：半入侵卡片左上角，圆形钉头一半露在卡片顶边外 */
.pin-btn {
  position: absolute;
  top: -10px;
  left: -10px;
  z-index: 2;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-placeholder);
  box-shadow: 0 2px 6px rgba(31, 58, 95, 0.12);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, transform 0.15s;
}
.task-card:hover .pin-btn {
  opacity: 1;
}
.pin-btn:hover {
  color: var(--el-color-primary);
  transform: scale(1.08);
}
.pin-btn.is-pinned {
  opacity: 1;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.pin-btn.is-pinned :deep(svg) {
  fill: currentColor;
}

/* 占位符：拖拽时提示插入位置 */
.task-card.is-placeholder {
  background: var(--el-color-primary-light-9);
  border: 2px dashed var(--el-color-primary);
  cursor: default;
  box-shadow: none;
}

/* 拖拽浮层 */
.drag-ghost {
  position: fixed;
  z-index: 3000;
  pointer-events: none;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-color-primary);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 18px 44px rgba(31, 58, 95, 0.24);
  transform: rotate(1.5deg);
  opacity: 0.96;
}

/* FLIP：其它卡片顺次移位时的平滑动画 */
.flip-move {
  transition: transform 0.16s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.board-empty {
  margin-top: 80px;
}

/* 右键菜单 */
.ctx-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
.ctx-menu {
  position: fixed;
  min-width: 132px;
  padding: 6px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 58, 95, 0.16);
  display: flex;
  flex-direction: column;
}
.ctx-item {
  text-align: left;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
  cursor: pointer;
}
.ctx-item:hover {
  background: var(--el-fill-color-light);
}
.ctx-item.is-danger {
  color: var(--el-color-danger);
}
.ctx-item.is-danger:hover {
  background: var(--el-color-danger-light-9);
}
</style>
