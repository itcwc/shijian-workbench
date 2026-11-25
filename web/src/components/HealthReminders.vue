<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  browserNotificationStatus,
  HEALTH_REMINDERS,
  healthReminderSettings,
  saveHealthReminderSettings,
  showHealthNotification,
} from '../data/healthReminders'

const draft = reactive({
  water: { ...healthReminderSettings.value.water },
  walk: { ...healthReminderSettings.value.walk },
})
const permission = ref(browserNotificationStatus())
const requesting = ref(false)
const permissionLabels = {
  default: '尚未授权浏览器通知。',
  granted: '浏览器通知已启用。',
  denied: '浏览器已阻止通知，可在地址栏的站点权限中改为允许。',
  unsupported: '当前页面无法使用浏览器通知。请用 Chrome 或 Edge 打开 localhost 或 HTTPS 页面。',
}

function refreshPermission() {
  permission.value = browserNotificationStatus()
}

onMounted(() => window.addEventListener('focus', refreshPermission))
onBeforeUnmount(() => window.removeEventListener('focus', refreshPermission))

async function enableNotifications() {
  if (browserNotificationStatus() !== 'default') {
    refreshPermission()
    return
  }

  requesting.value = true
  try {
    permission.value = await Notification.requestPermission()
  } catch {
    ElMessage.error('无法请求通知权限，请检查浏览器的站点权限。')
  } finally {
    requesting.value = false
  }
}

function testNotification() {
  refreshPermission()
  if (showHealthNotification('事间健康提醒', '这是一条测试通知。')) {
    ElMessage.success('测试通知已交给浏览器')
  } else {
    ElMessage.error('无法发送测试通知，请检查浏览器的通知权限。')
  }
}

function saveSettings() {
  try {
    saveHealthReminderSettings(draft)
    ElMessage.success('健康提醒设置已保存')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败，请重试。')
  }
}
</script>

<template>
  <section class="health-reminders" aria-label="健康提醒">
    <div class="notification-panel">
      <div class="notification-copy">
        <h2><el-text size="large">桌面通知</el-text></h2>
        <el-text tag="p" role="status">{{ permissionLabels[permission] }}</el-text>
        <el-text tag="p" size="small">请保持事间标签页打开。后台或电脑休眠时，提醒可能延迟。</el-text>
      </div>
      <el-button v-if="permission === 'default'" type="primary" :loading="requesting" @click="enableNotifications">
        启用浏览器通知
      </el-button>
      <el-button v-else-if="permission === 'granted'" @click="testNotification">发送测试通知</el-button>
    </div>

    <el-config-provider :locale="zhCn">
      <form class="reminder-form" @submit.prevent="saveSettings">
        <section
          v-for="reminder in HEALTH_REMINDERS"
          :key="reminder.id"
          class="reminder-card"
          :aria-labelledby="`${reminder.id}-reminder-title`"
        >
          <h2 :id="`${reminder.id}-reminder-title`"><el-text>{{ reminder.label }}</el-text></h2>

          <div class="reminder-fields">
            <div class="reminder-field">
              <el-text tag="label" :for="`${reminder.id}-start`" size="small">开始时间</el-text>
              <el-time-picker
                :id="`${reminder.id}-start`"
                v-model="draft[reminder.id].start"
                class="reminder-input"
                format="HH:mm"
                value-format="HH:mm"
                :clearable="false"
              />
            </div>
            <div class="reminder-field">
              <el-text tag="label" :for="`${reminder.id}-end`" size="small">结束时间</el-text>
              <el-time-picker
                :id="`${reminder.id}-end`"
                v-model="draft[reminder.id].end"
                class="reminder-input"
                format="HH:mm"
                value-format="HH:mm"
                :clearable="false"
              />
            </div>
            <div class="reminder-field">
              <el-text tag="label" :for="`${reminder.id}-interval`" size="small">间隔（分钟）</el-text>
              <el-input-number
                :id="`${reminder.id}-interval`"
                v-model="draft[reminder.id].intervalMinutes"
                class="reminder-input"
                :min="1"
                :max="1440"
                step-strictly
                controls-position="right"
              />
            </div>
            <el-switch v-model="draft[reminder.id].enabled" :aria-label="reminder.label" active-text="启用" />
          </div>
        </section>

        <div class="reminder-actions">
          <el-text size="small">从开始时间起按间隔提醒。结束早于开始时，范围延续到次日。</el-text>
          <el-button type="primary" native-type="submit">保存设置</el-button>
        </div>
      </form>
    </el-config-provider>
  </section>
</template>

<style scoped>
.health-reminders {
  min-height: 0;
  overflow: auto;
}

.notification-panel,
.reminder-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.notification-panel,
.reminder-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.notification-panel {
  padding: 16px 20px;
}

.notification-panel h2,
.reminder-card h2 {
  margin: 0;
  line-height: 1.5;
  font-size: inherit;
  font-weight: 600;
}

.notification-copy {
  display: grid;
  gap: 6px;
  min-width: 0;
  line-height: 1.5;
}

.notification-panel :deep(.el-button) {
  max-width: 100%;
  min-height: 32px;
  height: auto;
  white-space: normal;
}

.reminder-form {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.reminder-card {
  min-width: 0;
  padding: 14px 20px 16px;
}

.reminder-card h2 {
  margin-bottom: 10px;
}

.reminder-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px 18px;
}

.reminder-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  width: 140px;
  min-width: 0;
  max-width: 100%;
}

.reminder-field > :deep(.reminder-input) {
  width: 100%;
}

.reminder-actions {
  padding-bottom: 8px;
  line-height: 1.5;
}
</style>
