import { useState, useEffect, useCallback } from 'react'
import RecordList from '../components/RecordList'
import RecordCard from '../components/RecordCard'
import RecordFormModal from '../components/RecordFormModal'
import SegmentedControl from '../components/SegmentedControl'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { nowLocalString, formatTime, formatDate } from '../utils/dateUtils'

const TAB_OPTIONS = [
  { value: 'pumping', label: '擠奶紀錄' },
  { value: 'storage', label: '母乳庫存' },
]

const STORAGE_OPTIONS = [
  { value: 'FRIDGE', label: '冷藏' },
  { value: 'FREEZER', label: '冷凍' },
]

function makeDefaultPumpingForm() {
  return { leftDuration: '', rightDuration: '', leftAmount: '', rightAmount: '', note: '', pumpedAt: nowLocalString() }
}

function makeDefaultStorageForm() {
  return { amount: '', storageType: 'FRIDGE', note: '', storedAt: nowLocalString() }
}

const inputClass =
  'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function NumberInput({ label, value, onChange, placeholder, unit }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputClass + ' pr-10'}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date()
}

function isExpiringSoon(expiresAt) {
  const diff = new Date(expiresAt) - new Date()
  return diff > 0 && diff < 48 * 60 * 60 * 1000
}

export default function BreastMilkPage() {
  const [tab, setTab] = useState('pumping')
  const [pumpingRecords, setPumpingRecords] = useState([])
  const [storageRecords, setStorageRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [pumpingForm, setPumpingForm] = useState(makeDefaultPumpingForm)
  const [storageForm, setStorageForm] = useState(makeDefaultStorageForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchPumping = useCallback(async () => {
    const res = await fetch('/api/v1/pumping')
    if (res.ok) setPumpingRecords(await res.json())
  }, [])

  const fetchStorage = useCallback(async () => {
    const res = await fetch('/api/v1/milk-storage')
    if (res.ok) setStorageRecords(await res.json())
  }, [])

  useEffect(() => {
    Promise.all([fetchPumping(), fetchStorage()]).finally(() => setLoading(false))
  }, [fetchPumping, fetchStorage])

  async function handlePumpingSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/pumping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leftDuration: pumpingForm.leftDuration ? parseInt(pumpingForm.leftDuration) : null,
          rightDuration: pumpingForm.rightDuration ? parseInt(pumpingForm.rightDuration) : null,
          leftAmount: pumpingForm.leftAmount ? parseInt(pumpingForm.leftAmount) : null,
          rightAmount: pumpingForm.rightAmount ? parseInt(pumpingForm.rightAmount) : null,
          note: pumpingForm.note || null,
          pumpedAt: new Date(pumpingForm.pumpedAt).toISOString(),
        }),
      })
      if (res.ok) { await fetchPumping(); setModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStorageSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/milk-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(storageForm.amount),
          storageType: storageForm.storageType,
          note: storageForm.note || null,
          storedAt: new Date(storageForm.storedAt).toISOString(),
        }),
      })
      if (res.ok) { await fetchStorage(); setModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePumping(id) {
    await fetch(`/api/v1/pumping/${id}`, { method: 'DELETE' })
    setPumpingRecords(prev => prev.filter(r => r.id !== id))
  }

  async function handleDeleteStorage(id) {
    await fetch(`/api/v1/milk-storage/${id}`, { method: 'DELETE' })
    setStorageRecords(prev => prev.filter(r => r.id !== id))
  }

  function openModal() {
    if (tab === 'pumping') setPumpingForm(makeDefaultPumpingForm())
    else setStorageForm(makeDefaultStorageForm())
    setModalOpen(true)
  }

  function pumpingTitle(r) {
    const total = r.totalAmount
    return total > 0 ? `共 ${total} ml` : '擠奶'
  }

  function pumpingSubtitle(r) {
    const parts = []
    if (r.leftDuration) parts.push(`左 ${r.leftDuration} 分`)
    if (r.rightDuration) parts.push(`右 ${r.rightDuration} 分`)
    if (r.leftAmount) parts.push(`左 ${r.leftAmount} ml`)
    if (r.rightAmount) parts.push(`右 ${r.rightAmount} ml`)
    return parts.join('・')
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">母乳紀錄</h2>

      <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'pumping' ? (
          pumpingRecords.length === 0 ? (
            <EmptyState message="還沒有擠奶紀錄，點擊右下角 + 新增" />
          ) : (
            <RecordList
              records={pumpingRecords}
              renderCard={record => (
                <RecordCard
                  key={record.id}
                  title={pumpingTitle(record)}
                  subtitle={pumpingSubtitle(record)}
                  time={formatTime(record.pumpedAt)}
                  onDelete={() => handleDeletePumping(record.id)}
                />
              )}
            />
          )
        ) : storageRecords.length === 0 ? (
          <EmptyState message="還沒有母乳庫存，點擊右下角 + 新增" />
        ) : (
          <div className="flex flex-col gap-2">
            {storageRecords.map(record => {
              const expired = isExpired(record.expiresAt)
              const expiringSoon = !expired && isExpiringSoon(record.expiresAt)
              return (
                <div
                  key={record.id}
                  className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border ${
                    expired
                      ? 'border-red-300 dark:border-red-700'
                      : expiringSoon
                      ? 'border-yellow-300 dark:border-yellow-600'
                      : 'border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {record.amount} ml・{record.storageType === 'FRIDGE' ? '冷藏' : '冷凍'}
                    </p>
                    <p className={`text-xs mt-0.5 ${expired ? 'text-red-500' : expiringSoon ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {expired ? '已過期・' : expiringSoon ? '即將到期・' : ''}
                      到期：{formatDate(record.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(record.storedAt)}</span>
                    <button
                      onClick={() => handleDeleteStorage(record.id)}
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
      </div>

      <FAB onClick={openModal} />

      <RecordFormModal
        open={modalOpen && tab === 'pumping'}
        onClose={() => setModalOpen(false)}
        title="新增擠奶紀錄"
        onSubmit={handlePumpingSubmit}
        submitting={submitting}
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="左側時長"
            value={pumpingForm.leftDuration}
            onChange={v => setPumpingForm(f => ({ ...f, leftDuration: v }))}
            placeholder="0"
            unit="分"
          />
          <NumberInput
            label="右側時長"
            value={pumpingForm.rightDuration}
            onChange={v => setPumpingForm(f => ({ ...f, rightDuration: v }))}
            placeholder="0"
            unit="分"
          />
          <NumberInput
            label="左側量"
            value={pumpingForm.leftAmount}
            onChange={v => setPumpingForm(f => ({ ...f, leftAmount: v }))}
            placeholder="0"
            unit="ml"
          />
          <NumberInput
            label="右側量"
            value={pumpingForm.rightAmount}
            onChange={v => setPumpingForm(f => ({ ...f, rightAmount: v }))}
            placeholder="0"
            unit="ml"
          />
        </div>
        <TimeInput label="時間" value={pumpingForm.pumpedAt} onChange={v => setPumpingForm(f => ({ ...f, pumpedAt: v }))} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
          <textarea
            placeholder="備註..."
            value={pumpingForm.note}
            onChange={e => setPumpingForm(f => ({ ...f, note: e.target.value }))}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </RecordFormModal>

      <RecordFormModal
        open={modalOpen && tab === 'storage'}
        onClose={() => setModalOpen(false)}
        title="新增母乳庫存"
        onSubmit={handleStorageSubmit}
        submitting={submitting}
      >
        <NumberInput
          label="量"
          value={storageForm.amount}
          onChange={v => setStorageForm(f => ({ ...f, amount: v }))}
          placeholder="0"
          unit="ml"
        />
        <SegmentedControl
          options={STORAGE_OPTIONS}
          value={storageForm.storageType}
          onChange={v => setStorageForm(f => ({ ...f, storageType: v }))}
        />
        <TimeInput label="儲存時間" value={storageForm.storedAt} onChange={v => setStorageForm(f => ({ ...f, storedAt: v }))} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
          <textarea
            placeholder="備註..."
            value={storageForm.note}
            onChange={e => setStorageForm(f => ({ ...f, note: e.target.value }))}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </RecordFormModal>
    </>
  )
}
