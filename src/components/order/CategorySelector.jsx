import { useState } from 'react'

const CATEGORIES = [
  {
    id: 'man',
    label: 'Man',
    emoji: '👔',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    desc: 'Shirts, Suits, Kurtas',
  },
  {
    id: 'woman',
    label: 'Woman',
    emoji: '👗',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    desc: 'Dresses, Blouses, Sarees',
  },
  {
    id: 'boy',
    label: 'Little Boy',
    emoji: '👦',
    image: 'https://images.unsplash.com/photo-1502781252888-9143ba7f074e?q=80&w=600&auto=format&fit=crop',
    desc: 'T-shirts, Kurtas, Formals',
  },
  {
    id: 'girl',
    label: 'Little Girl',
    emoji: '👧',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop',
    desc: 'Frocks, Lehengas, Suits',
  },
  {
    id: 'baby',
    label: 'Baby',
    emoji: '👶',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=600&auto=format&fit=crop',
    desc: 'Onesies, Sets, Rompers',
  },
]

export default function CategorySelector({ value, onChange }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-3 py-1 text-xs font-bold mb-4">
          <span>👤</span> WHO IS THIS FOR?
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Select Category</h2>
        <p className="text-gray-400 mt-3 text-sm max-w-md mx-auto">Choose who this garment is being tailored for</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => {
          const isSelected = value === cat.id
          const isHovered = hovered === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              className={`
                relative overflow-hidden rounded-2xl aspect-[3/4] flex flex-col items-center justify-end p-4
                transition-all duration-300 ease-out group cursor-pointer
                ${isSelected
                  ? 'ring-3 ring-purple-500 ring-offset-2 scale-[1.02] shadow-xl shadow-purple-100'
                  : 'hover:scale-[1.01] hover:shadow-lg shadow-sm border border-gray-100'}
              `}
            >
              {/* Background Image */}
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out ${isHovered || isSelected ? 'scale-110' : 'scale-100'}`}
                style={{ backgroundImage: `url(${cat.image})` }}
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-black/5 transition-opacity duration-300" />

              {/* Label */}
              <div className="relative z-10 text-center w-full">
                <h3 className="text-white font-bold text-lg leading-tight">{cat.label}</h3>
                <p className="text-gray-300 text-[11px] mt-1 font-medium">{cat.desc}</p>
              </div>

              {/* Selected tick */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
