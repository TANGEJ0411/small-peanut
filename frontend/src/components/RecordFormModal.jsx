import { useEffect, useRef } from 'react'

export default function RecordFormModal({ open, onClose, title, onSubmit, submitting, children }) {
  const dragStartY = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div
          className="flex justify-center py-3 cursor-grab"
          style={{ touchAction: 'none' }}
          onTouchStart={e => { dragStartY.current = e.touches[0].clientY }}
          onTouchEnd={e => {
            if (dragStartY.current !== null && e.changedTouches[0].clientY - dragStartY.current > 80) onClose()
            dragStartY.current = null
          }}
        >
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          {children}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full min-h-[44px] py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors mt-2"
          >
            {submitting ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
