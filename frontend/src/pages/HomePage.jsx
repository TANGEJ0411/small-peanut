import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { timeAgo, formatDuration, todayString } from '../utils/dateUtils'

const DIAPER_LABELS = { CLEAN: '乾淨', URINE: '尿尿', STOOL: '便便' }
const FEEDING_LABELS = { BREASTFEED: '親餵母乳', BOTTLE_BREAST_MILK: '瓶餵母乳', FORMULA: '配方奶' }

const ROUTE_LABELS = { ORAL: '口服', TOPICAL: '外用', INJECTION: '注射', EYE_EAR_DROPS: '滴劑', INHALER: '吸入', SUPPOSITORY: '栓劑' }
const MEAL_SLOT_LABELS = { BEFORE_BREAKFAST: '早餐前', AFTER_BREAKFAST: '早餐後', BEFORE_LUNCH: '午餐前', AFTER_LUNCH: '午餐後', BEFORE_DINNER: '晚餐前', AFTER_DINNER: '晚餐後', BEFORE_SLEEP: '睡前' }

function SummaryCard({ icon, label, primary, secondary, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border text-left w-full transition-colors active:scale-95 ${
        highlight
          ? 'border-blue-200 dark:border-blue-700'
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-base font-semibold mt-0.5 ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
          {primary ?? '—'}
        </p>
        {secondary && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{secondary}</p>
        )}
      </div>
    </button>
  )
}

function QuickAction({ icon, label, to }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl py-3 px-2 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{label}</span>
    </button>
  )
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/dashboard')
      if (res.ok) setDashboard(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const id = setInterval(fetchDashboard, 60000)
    return () => clearInterval(id)
  }, [fetchDashboard])

  const activeSleep = dashboard?.activeSleep
  const lastDiaper = dashboard?.lastDiaper
  const lastFeeding = dashboard?.lastFeeding
  const todaySleep = dashboard?.todaySleepMinutes ?? 0
  const upcomingMeds = dashboard?.upcomingMedications ?? []

  async function markMedDone(pending) {
    await fetch('/api/v1/medication-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: pending.scheduleId,
        mealSlot: pending.mealSlot || null,
        administeredAt: new Date().toISOString(),
      }),
    })
    fetchDashboard()
  }

  function medPendingLabel(p) {
    if (p.timingType === 'MEAL_BASED') {
      return `${p.name}${p.dosage ? ` ${p.dosage}` : ''} • ${ROUTE_LABELS[p.route] ?? p.route} • ${MEAL_SLOT_LABELS[p.mealSlot] ?? p.mealSlot}`
    }
    return `${p.name}${p.dosage ? ` ${p.dosage}` : ''} • ${ROUTE_LABELS[p.route] ?? p.route} • 今日 ${p.doneToday}/${p.totalToday} 次`
  }

  function nextFeedingLabel() {
    if (!lastFeeding) return '尚無紀錄'
    const diff = new Date(lastFeeding.nextFeedingAt) - Date.now()
    if (diff <= 0) return '已到餵奶時間'
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} 分鐘後`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h} 小時 ${m} 分後` : `${h} 小時後`
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{todayString()}</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">今日總覽</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeSleep && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">睡眠中</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                  已睡 {formatDuration(activeSleep.elapsedMinutes)}
                </p>
              </div>
              <button
                onClick={() => navigate('/records/sleep')}
                className="min-h-[44px] px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                記錄醒來
              </button>
            </div>
          )}

          {upcomingMeds.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <span className="text-base">💊</span>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">今日待服藥提醒</p>
              </div>
              <div className="divide-y divide-amber-100 dark:divide-amber-900">
                {upcomingMeds.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <p className="flex-1 text-sm text-amber-900 dark:text-amber-200 min-w-0 truncate">
                      {medPendingLabel(p)}
                    </p>
                    <button
                      onClick={() => markMedDone(p)}
                      className="flex-shrink-0 min-h-[36px] px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      已服
                    </button>
                  </div>
                ))}
                {upcomingMeds.length > 3 && (
                  <div className="px-4 py-2">
                    <button onClick={() => navigate('/health')} className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      還有 {upcomingMeds.length - 3} 筆 →
                    </button>
                  </div>
                )}
              </div>
              <div className="pb-1" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon="🥛"
              label="上次餵食"
              primary={lastFeeding ? timeAgo(lastFeeding.startedAt) : '尚無紀錄'}
              secondary={lastFeeding ? FEEDING_LABELS[lastFeeding.feedingType] : null}
              onClick={() => navigate('/records/feeding')}
            />
            <SummaryCard
              icon="👶"
              label="上次換尿布"
              primary={lastDiaper ? timeAgo(lastDiaper.recordedAt) : '尚無紀錄'}
              secondary={lastDiaper ? DIAPER_LABELS[lastDiaper.type] : null}
              onClick={() => navigate('/records/diapers')}
            />
            <SummaryCard
              icon="😴"
              label="今日睡眠"
              primary={formatDuration(todaySleep)}
              secondary="過去 24 小時"
              onClick={() => navigate('/records/sleep')}
            />
            <SummaryCard
              icon="⏰"
              label="預計下次餵奶"
              primary={nextFeedingLabel()}
              secondary={lastFeeding ? `上次 ${timeAgo(lastFeeding.startedAt)}` : null}
              highlight={lastFeeding && new Date(lastFeeding.nextFeedingAt) <= Date.now()}
              onClick={() => navigate('/records/feeding')}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">快速新增</p>
            <div className="grid grid-cols-4 gap-2">
              <QuickAction icon="🍼" label="擠奶" to="/records/breast-milk" />
              <QuickAction icon="😴" label="睡眠" to="/records/sleep" />
              <QuickAction icon="👶" label="換尿布" to="/records/diapers" />
              <QuickAction icon="📏" label="成長" to="/records/growth" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
