export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div className={`
      bg-white rounded-2xl shadow-sm border border-gray-100
      ${padding ? 'p-6' : ''}
      ${hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function StatCard({ icon: Icon, iconBg, value, label, delta, className = '' }) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg || 'bg-purple-100'}`}>
          {Icon && <Icon className="w-6 h-6 text-purple-600" />}
        </div>
        {delta !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}
