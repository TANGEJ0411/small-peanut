import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('/api/v1/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'ERROR' }))
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">育嬰紀錄</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {health === null && <span>連線檢查中...</span>}
          {health?.status === 'UP' && (
            <span className="text-green-600 dark:text-green-400 font-medium">後端連線正常</span>
          )}
          {health?.status === 'ERROR' && (
            <span className="text-red-500 dark:text-red-400">無法連線到後端，請確認 Spring Boot 是否啟動</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/diapers"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <p className="font-medium text-gray-800 dark:text-white text-sm">排泄紀錄</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">換尿布 / 便便</p>
        </Link>
      </div>
    </div>
  )
}
