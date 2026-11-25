import { shallowRef, watch } from 'vue'

const SETTINGS_KEY = 'wb_health_reminders_v1'
const MINUTE_MS = 60_000
const CHECK_INTERVAL_MS = 15_000

export const HEALTH_REMINDERS = [
  { id: 'water', label: '每日喝水提醒', message: '该喝水了，起来喝几口水。' },
  { id: 'walk', label: '每日走动提醒', message: '该起身走动了，离开座位活动一会儿。' },
] as const

type ReminderId = typeof HEALTH_REMINDERS[number]['id']
type BrowserNotificationStatus = NotificationPermission | 'unsupported'

export interface DailyReminder {
  enabled: boolean
  start: string
  end: string
  intervalMinutes: number
}

export type HealthReminderSettings = Record<ReminderId, DailyReminder>

function defaultSettings(): HealthReminderSettings {
  return {
    water: { enabled: false, start: '09:00', end: '18:00', intervalMinutes: 60 },
    walk: { enabled: false, start: '09:00', end: '18:00', intervalMinutes: 90 },
  }
}

function validReminder(value: unknown): value is DailyReminder {
  if (!value || typeof value !== 'object') return false
  const rule = value as Partial<DailyReminder>
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  return typeof rule.enabled === 'boolean' &&
    typeof rule.start === 'string' && time.test(rule.start) &&
    typeof rule.end === 'string' && time.test(rule.end) && rule.start !== rule.end &&
    typeof rule.intervalMinutes === 'number' && Number.isInteger(rule.intervalMinutes) &&
    rule.intervalMinutes >= 1 && rule.intervalMinutes <= 1440
}

function loadSettings(): HealthReminderSettings {
  const defaults = defaultSettings()
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<HealthReminderSettings>
    return {
      water: validReminder(saved?.water) ? saved.water : defaults.water,
      walk: validReminder(saved?.walk) ? saved.walk : defaults.walk,
    }
  } catch {
    return defaults
  }
}

export const healthReminderSettings = shallowRef(loadSettings())

export function saveHealthReminderSettings(settings: HealthReminderSettings) {
  for (const { id, label } of HEALTH_REMINDERS) {
    if (!validReminder(settings[id])) {
      throw new Error(`${label}的开始和结束时间须不同，间隔须为 1 到 1440 分钟的整数。`)
    }
  }
  const saved = { water: { ...settings.water }, walk: { ...settings.walk } }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved))
  } catch {
    throw new Error('无法保存健康提醒设置。')
  }
  healthReminderSettings.value = saved
}

function timeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/** 当前时间范围内最近一次应触发的提醒，起止时间按分钟计算。 */
export function latestReminderTime(rule: DailyReminder, now: Date): number | undefined {
  if (!rule.enabled) return

  const start = timeOnDate(now, rule.start)
  if (now < start) start.setDate(start.getDate() - 1)
  const end = timeOnDate(start, rule.end)
  if (rule.end < rule.start) end.setDate(end.getDate() + 1)
  if (now.getTime() >= end.getTime() + MINUTE_MS) return

  const interval = rule.intervalMinutes * MINUTE_MS
  return start.getTime() + Math.floor((now.getTime() - start.getTime()) / interval) * interval
}

export function browserNotificationStatus(): BrowserNotificationStatus {
  if (!window.isSecureContext || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function showHealthNotification(title: string, body: string, tag?: string): boolean {
  if (browserNotificationStatus() !== 'granted') return false
  try {
    new Notification(title, { body, tag })
    return true
  } catch {
    return false
  }
}

export function startHealthReminderScheduler() {
  const lastDelivered = new Map<ReminderId, number>()
  let active = true
  const currentMinute = () => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS
  let scheduleStarted = currentMinute()

  function checkReminders() {
    if (browserNotificationStatus() !== 'granted') return
    const now = new Date()

    for (const reminder of HEALTH_REMINDERS) {
      const due = latestReminderTime(healthReminderSettings.value[reminder.id], now)
      if (due === undefined || due < scheduleStarted || lastDelivered.get(reminder.id) === due) continue

      const key = `${SETTINGS_KEY}_${reminder.id}_sent`
      const mark = String(due)
      const dispatch = () => {
        if (!active || due < scheduleStarted || lastDelivered.get(reminder.id) === due ||
          latestReminderTime(healthReminderSettings.value[reminder.id], new Date()) !== due) return

        try {
          if (localStorage.getItem(key) === mark) {
            lastDelivered.set(reminder.id, due)
            return
          }
        } catch {
          /* 当前标签页仍可去重。 */
        }
        if (!showHealthNotification(reminder.label, reminder.message, `${reminder.id}-${mark}`)) return
        lastDelivered.set(reminder.id, due)
        try {
          localStorage.setItem(key, mark)
        } catch {
          /* 当前标签页已记录发送。 */
        }
      }

      if (navigator.locks) void navigator.locks.request(key, dispatch).catch(dispatch)
      else dispatch()
    }
  }

  function syncSettings(event: StorageEvent) {
    if (event.key === SETTINGS_KEY || event.key === null) healthReminderSettings.value = loadSettings()
  }

  const stopWatching = watch(healthReminderSettings, () => {
    scheduleStarted = currentMinute()
    checkReminders()
  })
  const timer = window.setInterval(checkReminders, CHECK_INTERVAL_MS)
  window.addEventListener('storage', syncSettings)
  window.addEventListener('focus', checkReminders)
  document.addEventListener('visibilitychange', checkReminders)
  checkReminders()

  return () => {
    active = false
    stopWatching()
    window.clearInterval(timer)
    window.removeEventListener('storage', syncSettings)
    window.removeEventListener('focus', checkReminders)
    document.removeEventListener('visibilitychange', checkReminders)
  }
}
