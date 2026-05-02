import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import DateNavigator from '../components/DateNavigator'
import { nowLocalString, formatDate, localDayRange } from '../utils/dateUtils'

function makeDefaultForm() {
  return { heightCm: '', weightKg: '', headCircumferenceCm: '', note: '', recordedAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function DecimalInput({ label, value, onChange, placeholder, unit }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputClass + ' pr-12'}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  )
}

function MetricBadge({ label, value, unit }) {
  if (value == null) return null
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span>
    </span>
  )
}

export default function GrowthPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(makeDefaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const fetchRecords = useCallback(async (date) => {
    const { from, to } = localDayRange(date)
    try {
      const res = await fetch(`/api/v1/growth?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
          headCircumferenceCm: form.headCircumferenceCm ? parseFloat(form.headCircumferenceCm) : null,
          note: form.note || null,
          recordedAt: new Date(form.recordedAt).toISOString(),
        }),
      })
      if (res.ok) { await fetchRecords(selectedDate); setModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/v1/growth/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  function openModal() {
    setForm(makeDefaultForm())
    setModalOpen(true)
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">成長指標</h2>

      <DateNavigator date={selectedDate} onChange={d => { setLoading(true); setSelectedDate(d) }} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState message="這天沒有成長紀錄" />
      ) : (
        <div className="flex flex-col gap-2">
          {records.map(record => (
            <div
              key={record.id}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <MetricBadge label="身高 " value={record.heightCm} unit="cm" />
                  <MetricBadge label="體重 " value={record.weightKg} unit="kg" />
                  <MetricBadge label="頭圍 " value={record.headCircumferenceCm} unit="cm" />
                </div>
                {record.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{record.note}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500 text-right">
                  {formatDate(record.recordedAt)}
                </span>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors rounded-lg"
                  aria-label="刪除"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FAB onClick={openModal} />

      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增成長紀錄"
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <DecimalInput
          label="身高（選填）"
          value={form.heightCm}
          onChange={v => setForm(f => ({ ...f, heightCm: v }))}
          placeholder="例：52.5"
          unit="cm"
        />
        <DecimalInput
          label="體重（選填）"
          value={form.weightKg}
          onChange={v => setForm(f => ({ ...f, weightKg: v }))}
          placeholder="例：4.2"
          unit="kg"
        />
        <DecimalInput
          label="頭圍（選填）"
          value={form.headCircumferenceCm}
          onChange={v => setForm(f => ({ ...f, headCircumferenceCm: v }))}
          placeholder="例：35.0"
          unit="cm"
        />
        <TimeInput label="量測時間" value={form.recordedAt} onChange={v => setForm(f => ({ ...f, recordedAt: v }))} />
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
    </>
  )
}
