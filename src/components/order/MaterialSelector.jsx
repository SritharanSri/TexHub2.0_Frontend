import { useMemo } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { getFabricsForClothType } from '../../data/fabricData'

export default function MaterialSelector({ value, onChange, clothType }) {
  const fabrics = useMemo(() => getFabricsForClothType(clothType), [clothType])
  const selectedFabric = fabrics.find(f => f.id === value)

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200/60 text-purple-700 rounded-full px-4 py-1.5 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> STEP 4
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Choose Your Fabric</h2>
        {clothType && (
          <p className="text-gray-400 mt-1.5 text-sm">
            Pick the best fabric for your <span className="text-purple-600 font-semibold">{clothType}</span>
          </p>
        )}
      </div>

      {fabrics.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-4xl mb-3 block">🧵</span>
          <p className="text-gray-500 font-medium">No fabrics available for this garment type.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fabrics.map(fab => {
            const isSelected = value === fab.id

            return (
              <button
                key={fab.id}
                onClick={() => onChange(fab.id)}
                className={`
                  w-full flex items-center gap-4 p-3 rounded-2xl border-2 text-left transition-all duration-200
                  ${isSelected
                    ? 'border-purple-500 bg-purple-50/60 shadow-md shadow-purple-100/40'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}
                `}
              >
                {/* Fabric swatch thumbnail */}
                <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all ${
                  isSelected ? 'ring-purple-400' : 'ring-gray-100'
                }`}>
                  <img
                    src={fab.image}
                    alt={fab.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f3f4f6" width="80" height="80"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">🧵</text></svg>` }}
                  />
                </div>

                {/* Fabric info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-[15px] ${isSelected ? 'text-purple-800' : 'text-gray-900'}`}>
                    {fab.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{fab.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(fab.features || []).map(f => (
                      <span
                        key={f}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Selection indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-200 bg-white'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Selected confirmation ── */}
      {selectedFabric && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={3} />
          <p className="text-sm text-green-800">
            <strong>{selectedFabric.name}</strong> — {(selectedFabric.features || []).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
