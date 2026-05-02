import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { timeAgo, formatDuration, todayString } from '../utils/dateUtils'

const DIAPER_LABELS = { CLEAN: '乾淨', URINE: '尿尿', STOOL: '便便' }

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
  const lastPumping = dashboard?.lastPumping
  const todaySleep = dashboard?.todaySleepMinutes ?? 0

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

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon="🍼"
              label="上次擠奶"
              primary={lastPumping ? timeAgo(lastPumping.pumpedAt) : '尚無紀錄'}
              secondary={lastPumping?.totalAmount > 0 ? `${lastPumping.totalAmount} ml` : null}
              onClick={() => navigate('/records/breast-milk')}
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
              icon="📋"
              label="所有紀錄"
              primary="查看紀錄"
              onClick={() => navigate('/records')}
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
