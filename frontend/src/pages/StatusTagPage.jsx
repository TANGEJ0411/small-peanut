import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import DateNavigator from '../components/DateNavigator'
import { nowLocalString, formatDate, formatTime, localDayRange } from '../utils/dateUtils'

const PRESET_GROUPS = [
  {
    label: '每日狀態',
    tags: ['開心', '哭鬧', '發燒', '猛長期'],
  },
  {
    label: '里程碑',
    tags: ['翻身', '坐起來', '會站', '長牙', '走路', '說話'],
  },
]

function makeDefaultForm() {
  return { tagName: '', customTag: '', note: '', recordedAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function TagChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] px-4 rounded-xl text-sm font-medium border transition-colors ${
        selected
          ? 'bg-blue-500 border-blue-500 text-white'
          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

export default function StatusTagPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(makeDefaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const fetchRecords = useCallback(async (date) => {
    const { from, to } = localDayRange(date)
    try {
      const res = await fetch(`/api/v1/tags?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])

  function selectTag(tag) {
    setForm(f => ({ ...f, tagName: f.tagName === tag ? '' : tag, customTag: '' }))
  }

  const resolvedTagName = form.tagName === '自訂'
    ? form.customTag.trim()
    : form.tagName

  async function handleSubmit() {
    if (!resolvedTagName) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagName: resolvedTagName,
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
    await fetch(`/api/v1/tags/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  function openModal() {
    setForm(makeDefaultForm())
    setModalOpen(true)
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">狀態標籤</h2>

      <DateNavigator date={selectedDate} onChange={d => { setLoading(true); setSelectedDate(d) }} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState message="這天沒有狀態紀錄" />
      ) : (
        <div className="flex flex-col gap-2">
          {records.map(record => (
            <div
              key={record.id}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {record.tagName}
                  </span>
                  {record.note && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{record.note}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatDate(record.recordedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(record.recordedAt)}</span>
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
        title="新增狀態標籤"
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {PRESET_GROUPS.map(group => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map(tag => (
                <TagChip
                  key={tag}
                  label={tag}
                  selected={form.tagName === tag}
                  onClick={() => selectTag(tag)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">自訂</p>
          <div className="flex flex-wrap gap-2 items-center">
            <TagChip
              label="自訂..."
              selected={form.tagName === '自訂'}
              onClick={() => setForm(f => ({ ...f, tagName: f.tagName === '自訂' ? '' : '自訂' }))}
            />
          </div>
          {form.tagName === '自訂' && (
            <input
              type="text"
              placeholder="請輸入標籤名稱..."
              value={form.customTag}
              onChange={e => setForm(f => ({ ...f, customTag: e.target.value }))}
              className={inputClass}
            />
          )}
        </div>

        <TimeInput label="時間" value={form.recordedAt} onChange={v => setForm(f => ({ ...f, recordedAt: v }))} />

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
