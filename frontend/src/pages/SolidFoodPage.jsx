import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import DateNavigator from '../components/DateNavigator'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { nowLocalString, localDayRange, formatTime } from '../utils/dateUtils'

const REACTION_OPTIONS = [
  { value: '',         label: '未記錄' },
  { value: 'ACCEPTED', label: '接受' },
  { value: 'PARTIAL',  label: '部分接受' },
  { value: 'REJECTED', label: '拒絕' },
  { value: 'ALLERGIC', label: '疑似過敏' },
]

const REACTION_STYLE = {
  ACCEPTED: { label: '接受',    bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300' },
  PARTIAL:  { label: '部分接受', bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300' },
  REJECTED: { label: '拒絕',    bg: 'bg-red-100 dark:bg-red-900/40',     text: 'text-red-700 dark:text-red-300' },
  ALLERGIC: { label: '疑似過敏', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
}

const inputClass = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const selectClass = `${inputClass} cursor-pointer`
const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300'

function makeDefaultForm() {
  return { foodName: '', amountG: '', newFood: false, reaction: '', notes: '', recordedAt: nowLocalString() }
}

export default function SolidFoodPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(makeDefaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const fetchRecords = useCallback(async (date) => {
    const { from, to } = localDayRange(date)
    try {
      const res = await fetch(`/api/v1/solid-food?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const body = {
        recordedAt: new Date(form.recordedAt).toISOString(),
        foodName: form.foodName,
        amountG: form.amountG !== '' ? Number(form.amountG) : null,
        newFood: form.newFood,
        reaction: form.reaction || null,
        notes: form.notes || null,
      }
      const res = await fetch('/api/v1/solid-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { await fetchRecords(selectedDate); setModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/v1/solid-food/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const set = field => value => setForm(f => ({ ...f, [field]: value }))

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">副食品紀錄</h2>
      <DateNavigator
        date={selectedDate}
        onChange={d => { setLoading(true); setSelectedDate(d) }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState message="這天沒有副食品紀錄" />
      ) : (
        <div className="flex flex-col gap-2 mt-3">
          {records.map(r => {
            const rs = r.reaction ? REACTION_STYLE[r.reaction] : null
            return (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">{r.foodName}</span>
                      {r.newFood && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          初次嘗試
                        </span>
                      )}
                      {rs && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${rs.bg} ${rs.text}`}>
                          {rs.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatTime(r.recordedAt)}</span>
                      {r.amountG != null && <span>{r.amountG} g</span>}
                    </div>
                    {r.notes && (
                      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{r.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <FAB onClick={() => { setForm(makeDefaultForm()); setModalOpen(true) }} />

      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增副食品紀錄"
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>食物名稱</label>
          <input
            type="text"
            placeholder="例：胡蘿蔔泥、蘋果汁"
            value={form.foodName}
            onChange={e => set('foodName')(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>食用量（選填）</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.amountG}
              onChange={e => set('amountG')(e.target.value)}
              className={`${inputClass} pr-10`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">g</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>反應（選填）</label>
          <select
            value={form.reaction}
            onChange={e => set('reaction')(e.target.value)}
            className={selectClass}
          >
            {REACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => set('newFood')(!form.newFood)}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            form.newFood
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
          }`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            form.newFood ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-gray-500'
          }`}>
            {form.newFood && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">初次嘗試此食物</span>
        </button>

        <TimeInput label="時間" value={form.recordedAt} onChange={set('recordedAt')} />

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>備註（選填）</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => set('notes')(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>
      </RecordFormModal>
    </>
  )
}
