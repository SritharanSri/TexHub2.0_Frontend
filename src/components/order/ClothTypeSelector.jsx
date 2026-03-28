import { useState } from 'react'
import { CLOTH_TYPES } from '../../data/clothTypes'

export default function ClothTypeSelector({ category, value, onChange }) {
  const [hovered, setHovered] = useState(null)
  const types = CLOTH_TYPES[category] || []

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 text-xs font-bold mb-4">
          <span>👕</span> GARMENT TYPE
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Choose Garment</h2>
        <p className="text-gray-400 mt-3 text-sm max-w-md mx-auto">Select the type of clothing you want tailored</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {types.map((type) => {
          const isSelected = value === type.name
          const isHovered = hovered === type.name
          
          return (
            <button
              key={type.name}
              onClick={() => onChange(type.name)}
              onMouseEnter={() => setHovered(type.name)}
              onMouseLeave={() => setHovered(null)}
              className={`
                group relative flex flex-col gap-2.5 transition-all duration-300 transform
                ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
              `}
            >
              {/* Image Card */}
              <div className={`
                relative aspect-[4/5] overflow-hidden rounded-2xl w-full
                transition-all duration-300
                ${isSelected 
                  ? 'ring-3 ring-purple-500 ring-offset-2 shadow-lg shadow-purple-100' 
                  : 'border border-gray-100 shadow-sm group-hover:shadow-md'}
              `}>
                <div 
                  className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${isHovered || isSelected ? 'scale-110' : 'scale-100'}`}
                  style={{ backgroundImage: `url(${type.image})` }}
                />
                
                {isSelected && (
                  <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center">
                    <div className="bg-purple-600 rounded-full p-1.5 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-left px-1">
                <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-purple-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
                  {type.name}
                </p>
                <p className="text-[10px] font-medium text-gray-400 mt-0.5">Custom Tailored</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
