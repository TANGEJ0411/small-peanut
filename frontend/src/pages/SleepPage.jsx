import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { nowLocalString, formatTime } from '../utils/dateUtils'

const LOCATION_OPTIONS = ['嬰兒床', '大床', '推車', '揹巾']

function makeDefaultForm() {
  return { fellAsleepAt: nowLocalString(), wokeUpAt: '', location: '', customLocation: '', note: '' }
}

function makeWakeForm() {
  return { wokeUpAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function formatDuration(minutes) {
  if (minutes == null) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} 分鐘`
  if (m === 0) return `${h} 小時`
  return `${h} 小時 ${m} 分`
}

export default function SleepPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [wakeModalId, setWakeModalId] = useState(null)
  const [form, setForm] = useState(makeDefaultForm)
  const [wakeForm, setWakeForm] = useState(makeWakeForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/sleep')
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fellAsleepAt: new Date(form.fellAsleepAt).toISOString(),
          wokeUpAt: form.wokeUpAt ? new Date(form.wokeUpAt).toISOString() : null,
          location: form.location === '其他' ? (form.customLocation || null) : (form.location || null),
          note: form.note || null,
        }),
      })
      if (res.ok) { await fetchRecords(); setAddModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleWake() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/sleep/${wakeModalId}/wake`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fellAsleepAt: records.find(r => r.id === wakeModalId)?.fellAsleepAt,
          wokeUpAt: new Date(wakeForm.wokeUpAt).toISOString(),
        }),
      })
      if (res.ok) { await fetchRecords(); setWakeModalId(null) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/v1/sleep/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  function openAdd() {
    setForm(makeDefaultForm())
    setAddModalOpen(true)
  }

  function openWake(record) {
    setWakeForm(makeWakeForm())
    setWakeModalId(record.id)
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">睡眠紀錄</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState message="還沒有睡眠紀錄，點擊右下角 + 新增" />
      ) : (
        <div className="flex flex-col gap-2">
          {records.map(record => {
            const sleeping = record.wokeUpAt == null
            const duration = formatDuration(record.durationMinutes)
            return (
              <div
                key={record.id}
                className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border ${
                  sleeping ? 'border-blue-200 dark:border-blue-700' : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {sleeping ? '睡眠中' : duration}
                    </p>
                    {sleeping && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                        進行中
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    入睡 {formatTime(record.fellAsleepAt)}
                    {record.wokeUpAt ? `・醒來 ${formatTime(record.wokeUpAt)}` : ''}
                    {record.location ? `・${record.location}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {sleeping && (
                    <button
                      onClick={() => openWake(record)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors rounded-lg text-xs font-medium"
                      aria-label="記錄醒來時間"
                    >
                      醒了
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors rounded-lg"
                    aria-label="刪除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FAB onClick={openAdd} />

      <RecordFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="新增睡眠紀錄"
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <TimeInput label="入睡時間" value={form.fellAsleepAt} onChange={v => setForm(f => ({ ...f, fellAsleepAt: v }))} />
        <TimeInput label="醒來時間（選填）" value={form.wokeUpAt} onChange={v => setForm(f => ({ ...f, wokeUpAt: v }))} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">睡覺地點（選填）</label>
          <div className="flex flex-wrap gap-2">
            {[...LOCATION_OPTIONS, '其他'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm(f => ({ ...f, location: f.location === opt ? '' : opt, customLocation: '' }))}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-medium border transition-colors ${
                  form.location === opt
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {form.location === '其他' && (
            <input
              type="text"
              placeholder="請輸入地點..."
              value={form.customLocation}
              onChange={e => setForm(f => ({ ...f, customLocation: e.target.value }))}
              className={inputClass}
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
          <textarea
            placeholder="備註..."
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </RecordFormModal>

      <RecordFormModal
        open={wakeModalId != null}
        onClose={() => setWakeModalId(null)}
        title="記錄醒來時間"
        onSubmit={handleWake}
        submitting={submitting}
      >
        <TimeInput label="醒來時間" value={wakeForm.wokeUpAt} onChange={v => setWakeForm(f => ({ ...f, wokeUpAt: v }))} />
      </RecordFormModal>
    </>
  )
}
