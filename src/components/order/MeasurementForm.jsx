import { useState } from 'react'
import { getMeasurementFields } from '../../data/sizeCharts'

export default function MeasurementForm({ values, onChange, size, category, clothType }) {
  const [showHint, setShowHint] = useState(null)
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value })

  // Get fields dynamically based on cloth type
  const fields = getMeasurementFields(clothType)
  const filledCount = fields.filter(f => values[f.key]).length

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-4 py-1.5 text-xs font-bold mb-4">
          <span>📐</span> MEASUREMENTS
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Your Measurements</h2>
        <p className="text-gray-400 mt-3 text-base max-w-md mx-auto">
          {size
            ? <>Auto-filled for size <strong className="text-gray-700">{size}</strong> — adjust any value if needed</>
            : 'Enter your measurements in inches for a perfect fit'}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <span className="text-lg">👕</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{clothType} Measurements</p>
            <p className="text-xs text-gray-400">{fields.length} fields required for this garment type</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 rounded-full transition-all duration-500" 
              style={{ width: `${fields.length > 0 ? (filledCount / fields.length) * 100 : 0}%` }} 
            />
          </div>
          <span className="text-xs font-bold text-gray-500">{filledCount}/{fields.length}</span>
        </div>
      </div>

      {/* Auto-fill banner */}
      {size && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-green-900 text-sm">Auto-filled from size chart</p>
            <p className="text-green-700 text-xs">Size {size} values loaded. You can edit any field below.</p>
          </div>
        </div>
      )}

      {/* Measurement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {fields.map((field, idx) => (
          <div key={field.key} className="group relative">
            <label className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>{field.icon}</span>
                <span>{field.label}</span>
              </span>
              <button 
                type="button"
                onClick={() => setShowHint(showHint === field.key ? null : field.key)}
                className="text-gray-300 hover:text-purple-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            
            {/* Hint tooltip */}
            {showHint === field.key && (
              <div className="absolute z-10 right-0 top-0 -translate-y-full mb-1 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg max-w-[200px]">
                {field.hint}
                <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
              </div>
            )}

            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.5"
                value={values[field.key] || ''}
                onChange={set(field.key)}
                placeholder="0.0"
                className={`
                  w-full py-3.5 px-4 pr-12 text-lg font-bold text-gray-900 bg-white border-2 rounded-xl outline-none 
                  transition-all placeholder-gray-200 
                  ${values[field.key] ? 'border-green-200 bg-green-50/30' : 'border-gray-100 group-hover:border-gray-300'}
                  focus:border-purple-500 focus:ring-4 focus:ring-purple-100
                `}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold uppercase">
                {field.unit}
              </div>
              {values[field.key] && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Measurement tips */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl flex-shrink-0 border border-gray-100">
          📐
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-2">How to Measure Correctly</h4>
          <p className="text-gray-500 text-sm mb-3">For the most accurate fit, follow these guidelines:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Use a soft measuring tape',
              'Stand naturally, don\'t flex',
              'Keep the tape snug but not tight',
              'Have someone help for back measurements',
              'Measure over thin clothing',
              'Re-check measurements before submitting',
            ].map((tip, i) => (
              <p key={i} className="text-xs text-gray-500 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

