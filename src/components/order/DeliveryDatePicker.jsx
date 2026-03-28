import { useState } from 'react'

const DELIVERY_OPTIONS = [
  { id: 'express', days: 5,  label: 'Express',  desc: '4–5 business days', icon: '⚡', extra: '+30%', color: 'from-amber-500 to-orange-500' },
  { id: 'standard', days: 10, label: 'Standard', desc: '7–10 business days', icon: '📦', extra: 'Included', color: 'from-blue-500 to-indigo-500' },
  { id: 'economy', days: 18, label: 'Economy',  desc: '14–18 business days', icon: '🕐', extra: '-10%', color: 'from-green-500 to-emerald-500' },
  { id: 'custom',  days: 0,  label: 'Custom',   desc: 'Pick your own date', icon: '📅', extra: 'Varies', color: 'from-purple-500 to-violet-500' },
]

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
}

function addDaysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

export default function DeliveryDatePicker({ deliveryOption, onOptionChange, customDate, onCustomDateChange }) {
  const selected = DELIVERY_OPTIONS.find(o => o.id === deliveryOption) || DELIVERY_OPTIONS[1]

  const estimatedDate = deliveryOption === 'custom' && customDate
    ? new Date(customDate)
    : addDaysFromNow(selected.days)

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-4 py-1.5 text-xs font-bold mb-4">
          <span>📅</span> DELIVERY SCHEDULE
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Delivery Timeline</h2>
        <p className="text-gray-400 mt-3 text-base max-w-md mx-auto">When do you need your garment ready?</p>
      </div>

      {/* Delivery options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {DELIVERY_OPTIONS.map(opt => {
          const isActive = deliveryOption === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onOptionChange(opt.id)}
              className={`
                relative text-left p-5 rounded-2xl border-2 transition-all duration-300
                ${isActive
                  ? 'border-gray-900 bg-gray-900 text-white shadow-xl scale-[1.02]'
                  : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'}
              `}
            >
              <div className="text-2xl mb-3">{opt.icon}</div>
              <h3 className={`font-bold text-base mb-1 ${isActive ? 'text-white' : 'text-gray-900'}`}>{opt.label}</h3>
              <p className={`text-xs mb-3 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{opt.desc}</p>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {opt.extra}
              </div>
              {isActive && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom date picker */}
      {deliveryOption === 'custom' && (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 mb-6">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Select Your Preferred Delivery Date
          </label>
          <input
            type="date"
            min={getMinDate()}
            value={customDate || ''}
            onChange={(e) => onCustomDateChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-base"
          />
          <p className="text-xs text-gray-400 mt-2">Minimum 3 days from today. Express surcharge may apply for short deadlines.</p>
        </div>
      )}

      {/* Estimated delivery card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estimated Delivery</p>
            <p className="text-2xl font-black">{formatDate(estimatedDate)}</p>
            <p className="text-sm text-gray-400 mt-1">
              {deliveryOption === 'custom' ? 'Custom deadline selected' : `${selected.label} delivery — ${selected.desc}`}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
            {selected.icon}
          </div>
        </div>
      </div>
    </div>
  )
}
