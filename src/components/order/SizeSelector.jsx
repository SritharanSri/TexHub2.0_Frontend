import { SIZE_LABELS } from '../../data/sizeCharts'

const SIZE_DESCRIPTIONS = {
  XS:  'Extra Small',
  S:   'Small',
  M:   'Medium',
  L:   'Large',
  XL:  'Extra Large',
  XXL: 'Double XL',
}

export default function SizeSelector({ value, onChange, category }) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 text-xs font-bold mb-4">
          <span>📏</span> STANDARD SIZING
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Select Size</h2>
        <p className="text-gray-400 mt-3 text-sm max-w-md mx-auto">Measurements will auto-fill based on the selected size chart</p>
      </div>

      {/* Size buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6 max-w-2xl mx-auto">
        {SIZE_LABELS.map(size => {
          const isSelected = value === size
          return (
            <button
              key={size}
              onClick={() => onChange(size)}
              className={`
                group relative flex flex-col items-center justify-center py-5 rounded-xl border-2 font-bold
                transition-all duration-200 ease-out
                ${isSelected
                  ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-200 scale-105'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:scale-[1.02]'}
              `}
            >
              <span className="text-2xl leading-none font-black">{size}</span>
              <span className={`text-[10px] mt-1.5 font-medium ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                {SIZE_DESCRIPTIONS[size]}
              </span>
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Size visualization strip */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center gap-1.5">
          {SIZE_LABELS.map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`
                h-1.5 rounded-full transition-all duration-300 w-full
                ${s === value ? 'bg-purple-600' : 'bg-gray-100'}
              `} />
              <span className={`text-[10px] font-bold ${s === value ? 'text-purple-600' : 'text-gray-300'}`}>{s}</span>
            </div>
          ))}
        </div>
        {value && (
          <p className="text-center text-sm text-gray-500 mt-3">
            <span className="font-bold text-gray-900">{value}</span> — {SIZE_DESCRIPTIONS[value]} selected
          </p>
        )}
        {!value && (
          <p className="text-center text-xs text-gray-300 mt-3">Tap a size above to continue</p>
        )}
      </div>
    </div>
  )
}
