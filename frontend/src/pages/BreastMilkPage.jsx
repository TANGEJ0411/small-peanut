import { useState, useEffect, useCallback } from 'react'
import RecordList from '../components/RecordList'
import RecordCard from '../components/RecordCard'
import RecordFormModal from '../components/RecordFormModal'
import SegmentedControl from '../components/SegmentedControl'
import TimeInput from '../components/TimeInput'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import DateNavigator from '../components/DateNavigator'
import { nowLocalString, formatTime, formatDate, localDayRange } from '../utils/dateUtils'

const TAB_OPTIONS = [
  { value: 'pumping', label: '擠奶紀錄' },
  { value: 'storage', label: '母乳庫存' },
]

const STORAGE_OPTIONS = [
  { value: 'ROOM_TEMP', label: '常溫' },
  { value: 'FRIDGE',    label: '冷藏' },
  { value: 'FREEZER',   label: '冷凍' },
]

const STORAGE_LABEL = { ROOM_TEMP: '常溫', FRIDGE: '冷藏', FREEZER: '冷凍' }

const STORAGE_EXPIRY_HINT = { ROOM_TEMP: '有效 3 小時', FRIDGE: '有效 3 天', FREEZER: '有效 3 個月' }

function batchNo(id) {
  return `#${String(id).padStart(3, '0')}`
}

function isExpired(expiresAt) {
  return new Date(expiresAt) < new Date()
}

function isExpiringSoon(expiresAt, storageType) {
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return false
  const thresholds = {
    ROOM_TEMP: 30 * 60 * 1000,
    FRIDGE:    12 * 60 * 60 * 1000,
    FREEZER:   7 * 24 * 60 * 60 * 1000,
  }
  return diff < (thresholds[storageType] ?? 48 * 60 * 60 * 1000)
}

function expiryText(record) {
  return record.storageType === 'ROOM_TEMP'
    ? `${formatDate(record.expiresAt)} ${formatTime(record.expiresAt)}`
    : formatDate(record.expiresAt)
}

function makeDefaultPumpingForm() {
  return { leftDuration: '', rightDuration: '', leftAmount: '', rightAmount: '', note: '', pumpedAt: nowLocalString(), storageType: '' }
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

export default function BreastMilkPage() {
  const [tab, setTab] = useState('pumping')
  const [pumpingRecords, setPumpingRecords] = useState([])
  const [storageRecords, setStorageRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [pumpingForm, setPumpingForm] = useState(makeDefaultPumpingForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [remainingRecord, setRemainingRecord] = useState(null)
  const [remainingInput, setRemainingInput] = useState('')
  const [remainingSubmitting, setRemainingSubmitting] = useState(false)

  const fetchPumping = useCallback(async (date) => {
    const { from, to } = localDayRange(date)
    const res = await fetch(`/api/v1/pumping?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    if (res.ok) setPumpingRecords(await res.json())
  }, [])

  const fetchStorage = useCallback(async () => {
    const res = await fetch('/api/v1/pumping/storage')
    if (res.ok) setStorageRecords(await res.json())
  }, [])

  useEffect(() => {
    Promise.all([fetchPumping(selectedDate), fetchStorage()]).finally(() => setLoading(false))
  }, [fetchPumping, fetchStorage, selectedDate])

  async function handlePumpingSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/pumping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leftDuration:  pumpingForm.leftDuration  ? parseInt(pumpingForm.leftDuration)  : null,
          rightDuration: pumpingForm.rightDuration ? parseInt(pumpingForm.rightDuration) : null,
          leftAmount:    pumpingForm.leftAmount    ? parseInt(pumpingForm.leftAmount)    : null,
          rightAmount:   pumpingForm.rightAmount   ? parseInt(pumpingForm.rightAmount)   : null,
          note:          pumpingForm.note || null,
          pumpedAt:      new Date(pumpingForm.pumpedAt).toISOString(),
          storageType:   pumpingForm.storageType   || null,
        }),
      })
      if (res.ok) {
        await Promise.all([fetchPumping(selectedDate), fetchStorage()])
        setModalOpen(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePumping(id) {
    await fetch(`/api/v1/pumping/${id}`, { method: 'DELETE' })
    setPumpingRecords(prev => prev.filter(r => r.id !== id))
    setStorageRecords(prev => prev.filter(r => r.id !== id))
  }

  async function handleRemainingSubmit() {
    if (remainingRecord == null) return
    setRemainingSubmitting(true)
    try {
      const res = await fetch(`/api/v1/pumping/${remainingRecord.id}/remaining`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remaining: parseInt(remainingInput) || 0 }),
      })
      if (res.ok) {
        const updated = await res.json()
        setStorageRecords(prev => prev.map(r => r.id === updated.id ? updated : r))
        setRemainingRecord(null)
      }
    } finally {
      setRemainingSubmitting(false)
    }
  }

  function openModal() {
    setPumpingForm(makeDefaultPumpingForm())
    setModalOpen(true)
  }

  function openRemainingModal(record) {
    setRemainingRecord(record)
    setRemainingInput(String(record.remainingAmount ?? 0))
  }

  function pumpingTitle(r) {
    const total = r.totalAmount
    return total > 0 ? `共 ${total} ml` : '擠奶'
  }

  function pumpingSubtitle(r) {
    const parts = []
    if (r.leftDuration)  parts.push(`左 ${r.leftDuration} 分`)
    if (r.rightDuration) parts.push(`右 ${r.rightDuration} 分`)
    if (r.leftAmount)    parts.push(`左 ${r.leftAmount} ml`)
    if (r.rightAmount)   parts.push(`右 ${r.rightAmount} ml`)
    if (r.storageType)   parts.push(STORAGE_LABEL[r.storageType])
    return parts.join('・')
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">母乳紀錄</h2>

      <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />

      {tab === 'pumping' && (
        <div className="mt-4">
          <DateNavigator date={selectedDate} onChange={d => { setLoading(true); setSelectedDate(d) }} />
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'pumping' ? (
          pumpingRecords.length === 0 ? (
            <EmptyState message="這天沒有擠奶紀錄" />
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
          <EmptyState message="還沒有庫存，擠奶時選擇儲存方式即可加入" />
        ) : (
          <div className="flex flex-col gap-2">
            {storageRecords.map(record => {
              const expired = isExpired(record.expiresAt)
              const expiringSoon = !expired && isExpiringSoon(record.expiresAt, record.storageType)
              const depleted = record.remainingAmount != null && record.remainingAmount === 0
              return (
                <div
                  key={record.id}
                  className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border ${
                    expired || depleted
                      ? 'border-gray-200 dark:border-gray-700 opacity-50'
                      : expiringSoon
                      ? 'border-yellow-300 dark:border-yellow-600'
                      : 'border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 shrink-0">
                        {batchNo(record.id)}
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {record.remainingAmount != null
                          ? `剩 ${record.remainingAmount} ml`
                          : record.totalAmount > 0 ? `${record.totalAmount} ml` : '—'}
                        ・{STORAGE_LABEL[record.storageType]}
                      </p>
                      {depleted && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">（已用完）</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      expired    ? 'text-red-500' :
                      expiringSoon ? 'text-yellow-500 dark:text-yellow-400' :
                                   'text-gray-500 dark:text-gray-400'
                    }`}>
                      {expired ? '已過期・' : expiringSoon ? '即將到期・' : ''}
                      到期：{expiryText(record)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(record.pumpedAt)}</span>
                    {!depleted && (
                      <button
                        onClick={() => openRemainingModal(record)}
                        className="min-h-[44px] px-3 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 transition-colors rounded-lg"
                      >
                        更新
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePumping(record.id)}
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

      {tab === 'pumping' && <FAB onClick={openModal} />}

      {/* 擠奶紀錄表單 */}
      <RecordFormModal
        open={modalOpen}
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">儲存方式（選填）</label>
          <div className="flex gap-2 flex-wrap">
            {STORAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPumpingForm(f => ({ ...f, storageType: f.storageType === opt.value ? '' : opt.value }))}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-medium border transition-colors ${
                  pumpingForm.storageType === opt.value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {pumpingForm.storageType && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {STORAGE_EXPIRY_HINT[pumpingForm.storageType]}
            </p>
          )}
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

      {/* 更新存量 modal */}
      <RecordFormModal
        open={remainingRecord != null}
        onClose={() => setRemainingRecord(null)}
        title={`更新存量 ${remainingRecord ? batchNo(remainingRecord.id) : ''}`}
        onSubmit={handleRemainingSubmit}
        submitting={remainingSubmitting}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          原始：{remainingRecord?.totalAmount ?? 0} ml・{remainingRecord ? STORAGE_LABEL[remainingRecord.storageType] : ''}
        </p>
        <NumberInput
          label="剩餘量"
          value={remainingInput}
          onChange={setRemainingInput}
          placeholder="0"
          unit="ml"
        />
      </RecordFormModal>
    </>
  )
}
