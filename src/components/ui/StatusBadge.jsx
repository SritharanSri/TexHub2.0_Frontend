const statusConfig = {
  pending:   { label: 'Pending',   cls: 'badge-pending',   dot: 'bg-yellow-500' },
  process:   { label: 'In Process', cls: 'badge-process',  dot: 'bg-blue-500' },
  completed: { label: 'Completed', cls: 'badge-completed', dot: 'bg-green-500' },
  bidding:   { label: 'Bidding',   cls: 'badge-bidding',   dot: 'bg-purple-500' },
  active:    { label: 'Active',    cls: 'badge-completed', dot: 'bg-green-500' },
  inactive:  { label: 'Inactive',  cls: 'badge-pending',   dot: 'bg-gray-400' },
  tailor:    { label: 'Tailor',    cls: 'bg-purple-100 text-purple-700 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', dot: 'bg-purple-500' },
  customer:  { label: 'Customer',  cls: 'bg-blue-100 text-blue-700 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', dot: 'bg-blue-500' },
}

export default function StatusBadge({ status, showDot = true }) {
  const config = statusConfig[status] || { label: status, cls: 'badge-pending', dot: 'bg-gray-400' }
  return (
    <span className={config.cls}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
      )}
      {config.label}
    </span>
  )
}

export function RatingStars({ rating, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : i < rating ? 'text-yellow-300' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500 font-medium">{rating}</span>
    </div>
  )
}
