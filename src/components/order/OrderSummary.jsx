import { useNavigate } from 'react-router-dom'
import { getMeasurementFields } from '../../data/sizeCharts'
import { getFabricById } from '../../data/fabricData'

const CATEGORY_LABELS = {
  man: 'Man', woman: 'Woman', boy: 'Little Boy', girl: 'Little Girl', baby: 'Baby',
}

const DELIVERY_LABELS = {
  express: 'Express (4–5 days)', standard: 'Standard (7–10 days)', economy: 'Economy (14–18 days)', custom: 'Custom Date',
}

export default function OrderSummary({ data, onEdit, onSubmit, onNotesChange, loading }) {
  const navigate = useNavigate()
  const { items, deliveryOption, customDate, notes } = data

  const SectionCard = ({ title, stepIndex, children, onEditClick }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        {onEditClick && (
          <button onClick={onEditClick} className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )

  return (
    <div className="animate-fadeSlideIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-full px-4 py-1.5 text-xs font-bold mb-4">
          <span>✅</span> FINAL REVIEW
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Review Your Order</h2>
        <p className="text-gray-400 mt-3 text-base max-w-md mx-auto">Double-check everything before we broadcast to the tailor marketplace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-xl tracking-tight">Order Garments ({items?.length || 0})</h3>
            <button onClick={() => onEdit(6)} className="text-sm text-purple-600 font-semibold hover:underline">Edit Cart</button>
          </div>

          {items?.map((item, idx) => {
            const fabricObj = getFabricById(item.material)
            const fabricName = fabricObj?.name || 'Not selected'
            const fields = getMeasurementFields(item.clothType)
            const filledMeasurements = fields.filter(f => item.measurements?.[f.key])
            const hasDesign = item.selectedDesign || (item.uploadedFiles && item.uploadedFiles.length > 0)

            return (
              <SectionCard key={item.id || idx} title={`Garment ${idx + 1}`} onEditClick={null}>
                {/* Category & Garment */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{item.category === 'man' ? '👔' : item.category === 'woman' ? '👗' : item.category === 'boy' ? '👦' : item.category === 'girl' ? '👧' : '👶'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-xl text-gray-900">{item.clothType || 'Not selected'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{CATEGORY_LABELS[item.category] || '—'}</span>
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">Size {item.size || '—'}</span>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{fabricName}</span>
                    </div>
                  </div>
                </div>

                {/* Measurements */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Measurements ({filledMeasurements.length})</p>
                  {filledMeasurements.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {filledMeasurements.map(field => (
                        <div key={field.key} className="bg-gray-50 rounded-xl p-2 flex flex-col justify-center">
                          <span className="text-[10px] text-gray-500 font-medium truncate">{field.label}</span>
                          <span className="font-bold text-gray-900 text-sm">{item.measurements[field.key]}"</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">No measurements entered</p>
                  )}
                </div>

                {/* Design references */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Design</p>
                  <div className="flex flex-wrap gap-2">
                    {!hasDesign && <p className="text-xs text-gray-400">Standard patterns will be used.</p>}
                    {item.selectedDesign && (
                      <img src={item.selectedDesign.url} alt="AI Design" className="w-12 h-16 object-cover rounded-lg border border-gray-200" />
                    )}
                    {item.uploadedFiles?.map(f => (
                      <img key={f.id} src={f.url} alt="Ref" className="w-12 h-16 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                </div>
              </SectionCard>
            )
          })}
        </div>

        {/* Right column - Summary sidebar */}
        <div className="space-y-4">
          {/* Delivery */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Delivery</h3>
              <button onClick={() => onEdit(7)} className="text-xs text-purple-600 font-semibold hover:underline">Edit</button>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-lg">📅</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{DELIVERY_LABELS[deliveryOption] || 'Standard'}</p>
                {deliveryOption === 'custom' && customDate && (
                  <p className="text-xs text-gray-500">{new Date(customDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="text-sm font-bold text-gray-700 block mb-2">Global Order Notes</label>
            <textarea 
              rows={3} 
              placeholder="Any extra notes for the entire order..."
              value={notes || ''}
              onChange={(e) => onNotesChange?.(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors resize-none text-gray-700 placeholder-gray-300" 
            />
          </div>

          {/* Order summary card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-sm text-gray-300 mb-4">ORDER SUMMARY</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Garments</span>
                <span className="font-semibold">{items?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery</span>
                <span className="font-semibold">{deliveryOption === 'express' ? 'Express' : deliveryOption === 'economy' ? 'Economy' : deliveryOption === 'custom' ? 'Custom' : 'Standard'}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">Estimated Price</span>
                  <span className="text-lg font-black text-purple-400">Awaiting Bids</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={loading || items?.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-95 shadow-xl shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Placing Order...
              </div>
            ) : (
              <>
                <span>Place Multi-Item Order</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400">Your order will be broadcast to verified tailors for competitive bidding</p>
        </div>
      </div>
    </div>
  )
}
