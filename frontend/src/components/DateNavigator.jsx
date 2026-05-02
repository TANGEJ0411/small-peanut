import { isSameLocalDay, formatShortDate } from '../utils/dateUtils'

export default function DateNavigator({ date, onChange }) {
  const today = new Date()
  const isToday = isSameLocalDay(date, today)

  function prev() {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    onChange(d)
  }

  function next() {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    onChange(d)
  }

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-2 py-1 mb-4 border border-gray-100 dark:border-gray-700 shadow-sm">
      <button
        onClick={prev}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg"
      >
        ‹
      </button>
      <div className="flex flex-col items-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {isToday ? '今天' : formatShortDate(date)}
        </p>
        {!isToday && (
          <button
            onClick={() => onChange(new Date())}
            className="text-xs text-blue-500 dark:text-blue-400 mt-0.5"
          >
            回到今天
          </button>
        )}
      </div>
      <button
        onClick={next}
        disabled={isToday}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors rounded-lg"
      >
        ›
      </button>
    </div>
  )
}
