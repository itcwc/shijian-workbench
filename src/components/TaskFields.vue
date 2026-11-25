<script setup lang="ts">
import type { InputInstance } from 'element-plus'
import { ref, useId } from 'vue'
import type { TaskColor } from '../data/taskStore'
import TaskColorPicker from './TaskColorPicker.vue'

defineProps<{ rows: number; resize?: 'none' | 'vertical' }>()
const emit = defineEmits<{ submit: [] }>()
const title = defineModel<string>('title', { required: true })
const content = defineModel<string>('content', { required: true })
const color = defineModel<TaskColor>('color', { required: true })

const id = useId()
const titleInput = ref<InputInstance>()
defineExpose({ focusTitle: () => titleInput.value?.focus() })
</script>

<template>
  <div class="task-fields">
    <div class="task-field">
      <el-text tag="label" :for="`${id}-title`" size="small">标题</el-text>
      <el-input
        :id="`${id}-title`"
        ref="titleInput"
        v-model="title"
        placeholder="任务标题"
        @keyup.enter="emit('submit')"
      />
    </div>
    <div class="task-field">
      <el-text tag="label" :for="`${id}-content`" size="small">内容</el-text>
      <el-input
        :id="`${id}-content`"
        v-model="content"
        type="textarea"
        :rows="rows"
        :resize="resize"
        placeholder="补充任务内容（可选）"
      />
    </div>
    <TaskColorPicker v-model="color" show-label />
  </div>
</template>

<style scoped>
.task-fields,
.task-field {
  display: grid;
  min-width: 0;
}

.task-fields {
  gap: 12px;
}

.task-field {
  gap: 6px;
}
</style>
