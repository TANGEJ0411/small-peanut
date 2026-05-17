import { useState, useEffect } from 'react'

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/settings')
      .then(r => r.json())
      .then(data => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateSetting(key, value) {
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (res.ok) setSettings(await res.json())
    } catch (e) {
      // silently fail
    }
  }

  async function unbindGroup() {
    await fetch('/api/v1/settings/line-group', { method: 'DELETE' })
    setSettings(s => ({ ...s, lineGroupBound: false }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">設定</h2>

      {/* LINE Bot 綁定 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          LINE 通知
        </h3>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">群組綁定</p>
          {settings?.lineGroupBound ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">已綁定群組</span>
              </div>
              <button
                onClick={unbindGroup}
                className="min-h-[44px] min-w-[44px] px-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg"
              >
                解除綁定
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">尚未綁定群組</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">綁定步驟：</p>
              <ol className="text-xs text-gray-500 dark:text-gray-400 list-decimal list-inside space-y-1">
                <li>將 Bot 加入 LINE 群組</li>
                <li>在群組內傳送任意訊息</li>
                <li>重新整理此頁確認綁定狀態</li>
              </ol>
            </div>
          )}
        </div>

        {/* 通知開關 */}
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">母奶到期提醒</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">每日 08:00</p>
            </div>
            <Toggle
              checked={settings?.milkExpiryNotificationEnabled ?? true}
              onChange={v => updateSetting('milkExpiryNotificationEnabled', v)}
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">用藥提醒</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">早餐 / 午餐 / 晚餐 / 睡前</p>
            </div>
            <Toggle
              checked={settings?.medicationNotificationEnabled ?? true}
              onChange={v => updateSetting('medicationNotificationEnabled', v)}
            />
          </div>

          {!settings?.lineGroupBound && (
            <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
              <span>⚠️</span>
              請先完成 LINE Bot 群組綁定，通知才會發送
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
