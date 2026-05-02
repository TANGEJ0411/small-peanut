import { useState, useEffect, useCallback } from 'react'
import RecordList from '../components/RecordList'
import RecordCard from '../components/RecordCard'
import RecordFormModal from '../components/RecordFormModal'
import SegmentedControl from '../components/SegmentedControl'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { nowLocalString, formatTime } from '../utils/dateUtils'

const TYPE_OPTIONS = [
  { value: 'CLEAN', label: '乾淨' },
  { value: 'URINE', label: '尿尿' },
  { value: 'STOOL', label: '便便' },
]

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map(o => [o.value, o.label]))

function makeDefaultForm() {
  return { type: 'URINE', color: '', texture: '', note: '', recordedAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function DiaperPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(makeDefaultForm)
  const [submitting, setSubmitting] = useState(false)

  // loading starts as true; fetchRecords only sets it to false so the
  // initial mount shows the spinner without a synchronous setState in effect
  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/diapers')
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/diapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recordedAt: new Date(form.recordedAt).toISOString() }),
      })
      if (res.ok) {
        await fetchRecords()
        setModalOpen(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/v1/diapers/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  function openModal() {
    setForm(makeDefaultForm())
    setModalOpen(true)
  }

  const set = field => value => setForm(f => ({ ...f, [field]: value }))

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">換尿布紀錄</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState message="還沒有換尿布紀錄，點擊右下角 + 新增" />
      ) : (
        <RecordList
          records={records}
          renderCard={record => (
            <RecordCard
              key={record.id}
              title={TYPE_LABELS[record.type]}
              subtitle={[record.color, record.texture].filter(Boolean).join('・')}
              time={formatTime(record.recordedAt)}
              onDelete={() => handleDelete(record.id)}
            />
          )}
        />
      )}

      <FAB onClick={openModal} />

      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增排泄紀錄"
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <SegmentedControl options={TYPE_OPTIONS} value={form.type} onChange={set('type')} />

        {form.type === 'STOOL' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">顏色</label>
              <input
                type="text"
                placeholder="例：黃色、綠色"
                value={form.color}
                onChange={e => set('color')(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">質地</label>
              <input
                type="text"
                placeholder="例：糊狀、軟條狀"
                value={form.texture}
                onChange={e => set('texture')(e.target.value)}
                className={inputClass}
              />
            </div>
          </>
        )}

        <TimeInput label="時間" value={form.recordedAt} onChange={set('recordedAt')} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
          <textarea
            placeholder="備註..."
            value={form.note}
            onChange={e => set('note')(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </RecordFormModal>
    </>
  )
}
