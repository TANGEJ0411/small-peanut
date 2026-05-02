import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import SegmentedControl from '../components/SegmentedControl'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { nowLocalString, formatTime, formatDuration } from '../utils/dateUtils'

const TYPE_OPTIONS = [
  { value: 'BREASTFEED', label: '親餵母乳' },
  { value: 'BOTTLE_BREAST_MILK', label: '瓶餵母乳' },
  { value: 'FORMULA', label: '配方奶' },
]

const SIDE_OPTIONS = [
  { value: '左側', label: '左側' },
  { value: '右側', label: '右側' },
  { value: '雙側', label: '雙側' },
]

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map(o => [o.value, o.label]))

function makeDefaultForm() {
  return {
    feedingType: 'BREASTFEED',
    side: '左側',
    amountMl: '',
    startedAt: nowLocalString(),
    endedAt: '',
    note: '',
  }
}

function makeEndForm() {
  return { endedAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function cardTitle(record) {
  const label = TYPE_LABELS[record.feedingType]
  if (record.feedingType === 'BREASTFEED' && record.side) return `${label}・${record.side}`
  if (record.amountMl) return `${label}・${record.amountMl} ml`
  return label
}

function cardSubtitle(record) {
  if (record.durationMinutes) return `時長 ${formatDuration(record.durationMinutes)}`
  return null
}

export default function FeedingPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [endModalId, setEndModalId] = useState(null)
  const [form, setForm] = useState(makeDefaultForm)
  const [endForm, setEndForm] = useState(makeEndForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/feeding')
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const activeFeeding = records.find(r => r.endedAt == null)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const body = {
        feedingType: form.feedingType,
        side: form.feedingType === 'BREASTFEED' ? form.side : null,
        amountMl: form.feedingType !== 'BREASTFEED' && form.amountMl ? parseInt(form.amountMl) : null,
        startedAt: new Date(form.startedAt).toISOString(),
        endedAt: form.endedAt ? new Date(form.endedAt).toISOString() : null,
        note: form.note || null,
      }
      const res = await fetch('/api/v1/feeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { await fetchRecords(); setAddModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEnd() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/feeding/${endModalId}/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endedAt: new Date(endForm.endedAt).toISOString() }),
      })
      if (res.ok) { await fetchRecords(); setEndModalId(null) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/v1/feeding/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  function openAdd() {
    setForm(makeDefaultForm())
    setAddModalOpen(true)
  }

  function openEnd(id) {
    setEndForm(makeEndForm())
    setEndModalId(id)
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">餵食紀錄</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeFeeding && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-700 rounded-2xl p-4 flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-orange-500 dark:text-orange-400 font-medium">餵食中</p>
                <p className="text-base font-bold text-orange-700 dark:text-orange-300 mt-0.5">
                  {cardTitle(activeFeeding)}
                </p>
                <p className="text-xs text-orange-400 dark:text-orange-500 mt-0.5">
                  開始 {formatTime(activeFeeding.startedAt)}
                </p>
              </div>
              <button
                onClick={() => openEnd(activeFeeding.id)}
                className="min-h-[44px] px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                結束用餐
              </button>
            </div>
          )}

          {records.length === 0 ? (
            <EmptyState message="還沒有餵食紀錄，點擊右下角 + 新增" />
          ) : (
            <div className="flex flex-col gap-2">
              {records.map(record => {
                const active = record.endedAt == null
                const subtitle = cardSubtitle(record)
                return (
                  <div
                    key={record.id}
                    className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border ${
                      active
                        ? 'border-orange-200 dark:border-orange-700'
                        : 'border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {cardTitle(record)}
                      </p>
                      {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(record.startedAt)}
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
        title="新增餵食紀錄"
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={form.feedingType}
          onChange={v => setForm(f => ({ ...f, feedingType: v }))}
        />

        {form.feedingType === 'BREASTFEED' && (
          <SegmentedControl
            options={SIDE_OPTIONS}
            value={form.side}
            onChange={v => setForm(f => ({ ...f, side: v }))}
          />
        )}

        {form.feedingType !== 'BREASTFEED' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">量（選填）</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.amountMl}
                onChange={e => setForm(f => ({ ...f, amountMl: e.target.value }))}
                className={inputClass + ' pr-10'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
                ml
              </span>
            </div>
          </div>
        )}

        <TimeInput
          label="開始時間"
          value={form.startedAt}
          onChange={v => setForm(f => ({ ...f, startedAt: v }))}
        />
        <TimeInput
          label="結束時間（選填，可事後補填）"
          value={form.endedAt}
          onChange={v => setForm(f => ({ ...f, endedAt: v }))}
        />

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
        open={endModalId != null}
        onClose={() => setEndModalId(null)}
        title="結束用餐"
        onSubmit={handleEnd}
        submitting={submitting}
      >
        <TimeInput
          label="結束時間"
          value={endForm.endedAt}
          onChange={v => setEndForm(f => ({ ...f, endedAt: v }))}
        />
      </RecordFormModal>
    </>
  )
}
