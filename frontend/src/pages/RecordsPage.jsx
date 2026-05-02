import { useNavigate } from 'react-router-dom'

const RECORD_TYPES = [
  {
    path: '/records/breast-milk',
    label: '母乳紀錄',
    desc: '親餵・擠奶・庫存',
    bg: 'bg-pink-50 dark:bg-pink-950',
    iconBg: 'bg-pink-100 dark:bg-pink-900',
    iconColor: 'text-pink-500 dark:text-pink-300',
    icon: '🍼',
  },
  {
    path: '/records/sleep',
    label: '睡眠紀錄',
    desc: '入睡・醒來・時長',
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900',
    iconColor: 'text-indigo-500 dark:text-indigo-300',
    icon: '😴',
  },
  {
    path: '/records/diapers',
    label: '換尿布',
    desc: '尿尿・便便',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-500 dark:text-yellow-300',
    icon: '👶',
  },
  {
    path: '/records/growth',
    label: '成長指標',
    desc: '身高・體重・頭圍',
    bg: 'bg-green-50 dark:bg-green-950',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-500 dark:text-green-300',
    icon: '📏',
  },
  {
    path: '/records/tags',
    label: '狀態標籤',
    desc: '里程碑・每日狀態',
    bg: 'bg-purple-50 dark:bg-purple-950',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-500 dark:text-purple-300',
    icon: '🏷️',
  },
]

export default function RecordsPage() {
  const navigate = useNavigate()

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">紀錄</h2>
      <div className="grid grid-cols-2 gap-3">
        {RECORD_TYPES.map(type => (
          <button
            key={type.path}
            onClick={() => navigate(type.path)}
            className={`${type.bg} rounded-2xl p-4 text-left flex flex-col gap-3 active:scale-95 transition-transform border border-transparent hover:border-gray-200 dark:hover:border-gray-600`}
          >
            <div className={`${type.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>
              {type.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{type.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{type.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
