const pad = n => String(n).padStart(2, '0')

export function nowLocalString() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('zh-TW', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}

export function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

export function formatDuration(minutes) {
  if (minutes == null || minutes === 0) return '0 分鐘'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} 分鐘`
  if (m === 0) return `${h} 小時`
  return `${h} 小時 ${m} 分`
}

export function todayString() {
  return new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}

export function localDayRange(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

export function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function formatShortDate(date) {
  return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
}
