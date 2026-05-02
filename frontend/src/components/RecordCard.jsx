export default function RecordCard({ title, subtitle, time, onDelete }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
        <button
          onClick={onDelete}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors rounded-lg"
          aria-label="刪除"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
