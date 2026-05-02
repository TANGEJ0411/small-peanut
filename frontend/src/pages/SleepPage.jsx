import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import DateNavigator from '../components/DateNavigator'
import { nowLocalString, formatTime, formatDuration, localDayRange } from '../utils/dateUtils'

const LOCATION_OPTIONS = ['嬰兒床', '大床', '推車', '揹巾']

function makeDefaultForm() {
  return { fellAsleepAt: nowLocalString(), wokeUpAt: '', location: '', customLocation: '', note: '' }
}

function makeWakeForm() {
  return { wokeUpAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function elapsedMinutes(fellAsleepAt) {
  return Math.floor((Date.now() - new Date(fellAsleepAt)) / 60000)
}

export default function SleepPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [wakeModalId, setWakeModalId] = useState(null)
  const [form, setForm] = useState(makeDefaultForm)
  const [wakeForm, setWakeForm] = useState(makeWakeForm)
  const [submitting, setSubmitting] = useState(false)
  const [tick, setTick] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const fetchRecords = useCallback(async (date) => {
    const { from, to } = localDayRange(date)
    try {
      const res = await fetch(`/api/v1/sleep?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const activeSleep = records.find(r => r.wokeUpAt == null)

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
      if (res.ok) { await fetchRecords(selectedDate); setAddModalOpen(false) }
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
      if (res.ok) { await fetchRecords(selectedDate); setWakeModalId(null) }
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

  function openWake(id) {
    setWakeForm(makeWakeForm())
    setWakeModalId(id)
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">睡眠紀錄</h2>

      <DateNavigator date={selectedDate} onChange={d => { setLoading(true); setSelectedDate(d) }} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeSleep && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">睡眠中</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                  已睡 {formatDuration(elapsedMinutes(activeSleep.fellAsleepAt))}
                </p>
                <p className="text-xs text-blue-400 dark:text-blue-500 mt-0.5">
                  入睡 {formatTime(activeSleep.fellAsleepAt)}
                  {activeSleep.location ? `・${activeSleep.location}` : ''}
                </p>
              </div>
              <button
                onClick={() => openWake(activeSleep.id)}
                className="min-h-[44px] px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                記錄醒來
              </button>
            </div>
          )}

          {records.length === 0 ? (
            <EmptyState message="這天沒有睡眠紀錄" />
          ) : (
            <div className="flex flex-col gap-2">
              {records.map(record => {
                const sleeping = record.wokeUpAt == null
                return (
                  <div
                    key={record.id}
                    className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border ${
                      sleeping ? 'border-blue-200 dark:border-blue-700' : 'border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {sleeping ? '睡眠中' : formatDuration(record.durationMinutes)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        入睡 {formatTime(record.fellAsleepAt)}
                        {record.wokeUpAt ? `・醒來 ${formatTime(record.wokeUpAt)}` : ''}
                        {record.location ? `・${record.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
        </>
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
        <TimeInput label="醒來時間（選填，可事後補填）" value={form.wokeUpAt} onChange={v => setForm(f => ({ ...f, wokeUpAt: v }))} />
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
