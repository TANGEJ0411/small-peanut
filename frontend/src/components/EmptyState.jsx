export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
      <p className="text-sm text-center">{message}</p>
    </div>
  )
}
