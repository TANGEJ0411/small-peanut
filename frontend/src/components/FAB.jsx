export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="新增"
      className="fixed bottom-24 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-2xl font-light rounded-full shadow-lg flex items-center justify-center transition-colors"
    >
      +
    </button>
  )
}
