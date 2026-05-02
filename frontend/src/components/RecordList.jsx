import { formatDate } from '../utils/dateUtils'

export default function RecordList({ records, renderCard }) {
  const groups = records.reduce((acc, record) => {
    const date = formatDate(record.recordedAt)
    ;(acc[date] ??= []).push(record)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(groups).map(([date, items]) => (
        <div key={date}>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 px-1">{date}</p>
          <div className="flex flex-col gap-2">
            {items.map(item => renderCard(item))}
          </div>
        </div>
      ))}
    </div>
  )
}
