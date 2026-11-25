<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { addTask, type TaskColor } from '../data/taskStore'
import TaskFields from './TaskFields.vue'

const BUTTON_RADIUS = 20 // Element Plus large 圆形按钮的半径
const DEFAULT_INSET = 28
const SNAP_DISTANCE = 24
const DRAG_THRESHOLD = 5
const PANEL_WIDTH = 300
const PANEL_INSET = 12
const PANEL_GAP = 12

type Edge = 'left' | 'right' | 'top' | 'bottom'
type Point = { x: number; y: number }
type Placement = Point & { edge: Edge | null }

const open = ref(false)
const title = ref('')
const content = ref('')
const color = ref<TaskColor>('info')
const taskFields = ref<InstanceType<typeof TaskFields>>()
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
const placement = ref<Placement | null>(null)
const dragPosition = ref<Point | null>(null)
let gesture: { id: number; start: Point; origin: Point } | null = null
let suppressClick = false

function updateViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

const buttonPosition = computed(() => {
  const { width, height } = viewport.value
  if (dragPosition.value) {
    return {
      x: clamp(dragPosition.value.x, 0, width),
      y: clamp(dragPosition.value.y, 0, height),
    }
  }

  const { x, y, edge } = placement.value ?? {
    x: width - DEFAULT_INSET - BUTTON_RADIUS,
    y: height - DEFAULT_INSET - BUTTON_RADIUS,
    edge: null,
  }
  const insetX = Math.min(BUTTON_RADIUS, width / 2)
  const insetY = Math.min(BUTTON_RADIUS, height / 2)
  return {
    x: edge === 'left' ? 0 : edge === 'right' ? width : clamp(x, insetX, width - insetX),
    y: edge === 'top' ? 0 : edge === 'bottom' ? height : clamp(y, insetY, height - insetY),
  }
})

const buttonStyle = computed(() => ({
  left: `${buttonPosition.value.x - BUTTON_RADIUS}px`,
  top: `${buttonPosition.value.y - BUTTON_RADIUS}px`,
}))

const panelStyle = computed(() => {
  const { width, height } = viewport.value
  const { x, y } = buttonPosition.value
  const gap = BUTTON_RADIUS + PANEL_GAP
  const maxAbove = y - gap - PANEL_INSET
  const maxBelow = height - y - gap - PANEL_INSET
  const above = maxAbove >= maxBelow
  const insetX = Math.min(PANEL_INSET, width / 2)
  const panelWidth = Math.min(PANEL_WIDTH, width - 2 * insetX)

  return {
    left: `${clamp(x + BUTTON_RADIUS - panelWidth, insetX, width - panelWidth - insetX)}px`,
    width: `${panelWidth}px`,
    maxHeight: `${Math.max(0, above ? maxAbove : maxBelow)}px`,
    [above ? 'bottom' : 'top']: `${(above ? height - y : y) + gap}px`,
  }
})

function onPointerDown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || gesture) return
  suppressClick = false
  gesture = {
    id: event.pointerId,
    start: { x: event.clientX, y: event.clientY },
    origin: buttonPosition.value,
  }
  const button = event.currentTarget as HTMLButtonElement
  button.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return
  const dx = event.clientX - gesture.start.x
  const dy = event.clientY - gesture.start.y
  if (!dragPosition.value && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
  dragPosition.value = { x: gesture.origin.x + dx, y: gesture.origin.y + dy }
}

function onPointerUp(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return
  onPointerMove(event)
  if (dragPosition.value) {
    const { x, y } = buttonPosition.value
    const { width, height } = viewport.value
    const distances: [Edge, number][] = [
      ['left', x], ['right', width - x], ['top', y], ['bottom', height - y],
    ]
    const [edge, distance] = distances.reduce((nearest, candidate) =>
      candidate[1] < nearest[1] ? candidate : nearest,
    )
    placement.value = { x, y, edge: distance <= BUTTON_RADIUS + SNAP_DISTANCE ? edge : null }
    suppressClick = true
  }
  cancelGesture(event)
}

function cancelGesture(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return
  gesture = null
  dragPosition.value = null
}

async function toggle(event: MouseEvent) {
  if (suppressClick && event.detail > 0) return
  open.value = !open.value
  if (open.value) {
    await nextTick()
    taskFields.value?.focusTitle()
  }
}

function submit() {
  if (!title.value.trim()) {
    ElMessage.warning('先写个标题')
    return
  }
  addTask(title.value, content.value.trim(), color.value)
  title.value = ''
  content.value = ''
  color.value = 'info'
  open.value = false
  ElMessage.success('已记录到任务')
}
</script>

<template>
  <div class="quick-capture" :style="buttonStyle">
    <!-- 弹出的小浮窗 -->
    <transition name="qc-pop">
      <div v-if="open" id="quick-capture-panel" class="qc-panel" :style="panelStyle">
        <el-text tag="p" class="qc-title">快捷记录</el-text>
        <TaskFields
          ref="taskFields"
          v-model:title="title"
          v-model:content="content"
          v-model:color="color"
          :rows="4"
          resize="none"
          @submit="submit"
        />
        <div class="qc-foot">
          <el-button size="small" @click="open = false">取消</el-button>
          <el-button size="small" type="primary" @click="submit">创建任务</el-button>
        </div>
      </div>
    </transition>

    <!-- 浮动按钮 -->
    <el-button
      type="primary"
      size="large"
      circle
      class="qc-fab"
      :class="{ 'is-open': open, 'is-dragging': dragPosition }"
      :data-edge="dragPosition ? undefined : placement?.edge"
      :aria-expanded="open"
      :aria-controls="open ? 'quick-capture-panel' : undefined"
      aria-label="快捷记录任务"
      title="快捷记录任务"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="cancelGesture"
      @lostpointercapture="cancelGesture"
      @click="toggle"
    >
      <template #icon><Notebook /></template>
    </el-button>
  </div>
</template>

<style scoped>
.quick-capture {
  position: fixed;
  z-index: 1500;
}

.qc-fab {
  display: flex;
  padding: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.4);
  transition: transform 0.18s, box-shadow 0.18s;
}
.qc-fab:hover:not(.is-dragging) {
  transform: scale(1.06);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
}
.qc-fab.is-open {
  background-color: var(--el-color-primary-dark-2);
  border-color: var(--el-color-primary-dark-2);
}
.qc-fab.is-dragging {
  cursor: grabbing;
}
.qc-fab > :deep(.el-icon) {
  font-size: 18px;
}
.qc-fab[data-edge='left'] > :deep(.el-icon) {
  transform: translateX(50%);
}
.qc-fab[data-edge='right'] > :deep(.el-icon) {
  transform: translateX(-50%);
}
.qc-fab[data-edge='top'] > :deep(.el-icon) {
  transform: translateY(50%);
}
.qc-fab[data-edge='bottom'] > :deep(.el-icon) {
  transform: translateY(-50%);
}

.qc-panel {
  position: fixed;
  overflow-y: auto;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(31, 58, 95, 0.18);
}
.qc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}
.qc-foot {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 弹入动画 */
.qc-pop-enter-active,
.qc-pop-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}
.qc-pop-enter-from,
.qc-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
</style>
