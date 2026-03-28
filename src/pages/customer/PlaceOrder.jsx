import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CategorySelector from '../../components/order/CategorySelector'
import SizeSelector from '../../components/order/SizeSelector'
import MeasurementForm from '../../components/order/MeasurementForm'
import MaterialSelector from '../../components/order/MaterialSelector'
import DeliveryDatePicker from '../../components/order/DeliveryDatePicker'
import AIDesignGenerator from '../../components/order/AIDesignGenerator'
import ImageUploader from '../../components/order/ImageUploader'
import ClothTypeSelector from '../../components/order/ClothTypeSelector'
import OrderSummary from '../../components/order/OrderSummary'
import { SIZE_CHARTS, EMPTY_MEASUREMENTS, getEmptyMeasurements } from '../../data/sizeCharts'
import { getFabricById } from '../../data/fabricData'
import { useAuth } from '../../hooks/useAuth'
import { orderService } from '../../services/orderService'

/* ─── Step definitions ────────────────────────────────────── */
const STEPS = [
  { id: 0,  label: 'Category',      icon: '👤' },
  { id: 1,  label: 'Garment',       icon: '👕' },
  { id: 2,  label: 'Size',          icon: '📏' },
  { id: 3,  label: 'Measurements',  icon: '📐' },
  { id: 4,  label: 'Material',      icon: '🧵' },
  { id: 5,  label: 'Design',        icon: '🎨' },
  { id: 6,  label: 'Cart',          icon: '🛒' },
  { id: 7,  label: 'Delivery',      icon: '📅' },
  { id: 8,  label: 'Review',        icon: '✅' },
]

const TOTAL = STEPS.length

/* ─── Fade-slide wrapper ──────────────────────────────────── */
function StepWrapper({ children }) {
  return <div className="animate-fadeSlideIn">{children}</div>
}

export default function PlaceOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const contentRef = useRef(null)

  /* ── Multi-Item Cart State ── */
  const [cartItems, setCartItems] = useState([])

  /* ── Active Garment State ── */
  const [category, setCategory] = useState('')
  const [clothType, setClothType] = useState('')
  const [size, setSize] = useState('')
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS)
  const [material, setMaterial] = useState('')
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [prompt, setPrompt] = useState('')
  const [designMode, setDesignMode] = useState('upload')

  /* ── Global Order State ── */
  const [deliveryOption, setDeliveryOption] = useState('standard')
  const [customDate, setCustomDate] = useState('')
  const [notes, setNotes] = useState('')

  /* ── Auto-scroll on step change ── */
  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  /* ── Reset Active State for New Garment ── */
  const resetActiveState = useCallback(() => {
    setCategory('')
    setClothType('')
    setSize('')
    setMeasurements(EMPTY_MEASUREMENTS)
    setMaterial('')
    setSelectedDesign(null)
    setUploadedFiles([])
    setPrompt('')
    setDesignMode('upload')
  }, [])

  /* ── Handlers ── */
  const handleSizeChange = useCallback((newSize) => {
    setSize(newSize)
    if (category && SIZE_CHARTS[category]?.[newSize]) {
      setMeasurements(prev => ({ ...getEmptyMeasurements(clothType), ...SIZE_CHARTS[category][newSize] }))
    } else {
      setMeasurements(getEmptyMeasurements(clothType))
    }
  }, [category, clothType])

  const handleCategoryChange = useCallback((newCat) => {
    setCategory(newCat)
    setClothType('')
    setSize('')
    setMeasurements(EMPTY_MEASUREMENTS)
    setMaterial('')
  }, [])

  const handleClothTypeChange = useCallback((newType) => {
    setClothType(newType)
    setMaterial('') // reset fabric when garment type changes
    // Reset measurements when cloth type changes (different fields)
    if (size && category && SIZE_CHARTS[category]?.[size]) {
      setMeasurements({ ...getEmptyMeasurements(newType), ...SIZE_CHARTS[category][size] })
    } else {
      setMeasurements(getEmptyMeasurements(newType))
    }
  }, [size, category])

  /* ── Cart Operations ── */
  const handleAddToCart = () => {
    const newItem = {
      id: Date.now().toString(),
      category, clothType, size, measurements, material,
      selectedDesign, uploadedFiles, prompt, designMode
    }
    setCartItems(prev => [...prev, newItem])
    resetActiveState()
    setStep(6) // Go directly to Cart Cart View
  }

  const removeCartItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  /* ── Navigation ── */
  const canNext = useCallback(() => {
    if (step === 0) return !!category
    if (step === 1) return !!clothType
    if (step === 2) return !!size
    if (step === 4) return !!material
    if (step === 5) return true // design optional
    if (step === 6) return cartItems.length > 0 // Need at least 1 item
    if (step === 7) return deliveryOption === 'custom' ? !!customDate : !!deliveryOption
    return true
  }, [step, category, clothType, size, material, deliveryOption, customDate, cartItems.length])

  const goNext = () => { if (canNext()) setStep(s => Math.min(s + 1, TOTAL - 1)) }
  const goPrev = () => {
    // If going back from Cart (empty logic), but they should just Add New
    if (step === 6) return // Nav dots preferred
    setStep(s => Math.max(s - 1, 0))
  }

  /* ── Compute deadline from delivery option ── */
  const computeDeadline = () => {
    if (deliveryOption === 'custom' && customDate) return customDate
    const daysMap = { express: 5, standard: 10, economy: 18 }
    const days = daysMap[deliveryOption] || 10
    return new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    const isDemo = !!user?._demo

    try {
      if (isDemo) {
        // Demo users local storage
        const topCat = cartItems.length === 1 ? cartItems[0].category : 'multi'
        const topCloth = cartItems.length === 1 ? cartItems[0].clothType : `${cartItems.length} Garments`

        const newOrder = {
          id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          items: cartItems, // Complex structure retained
          item: topCloth,   // Legacy compat
          category: topCat, 
          clothType: topCloth,
          fabric: 'Mixed',
          status: 'pending',
          placed: new Date().toISOString().split('T')[0],
          deadline: computeDeadline(),
          amount: null,
          progress: 0,
          tailor: null,
          rating: null,
          deliveryOption,
          customDate: deliveryOption === 'custom' ? customDate : null,
          notes,
        }
        const existing = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
        localStorage.setItem('texhub_orders', JSON.stringify([newOrder, ...existing]))
        await new Promise(r => setTimeout(r, 1800))
      } else {
        // Real Backend submission using FormData API
        const itemsPayload = cartItems.map(c => ({
          category: c.category,
          clothType: c.clothType,
          size: c.size,
          measurements: c.measurements,
          material: c.material,
          designImageUrl: c.selectedDesign?.url || null
        }))

        const fd = new FormData()
        fd.append('deliveryOption', deliveryOption)
        if (deliveryOption === 'custom' && customDate) {
          fd.append('customDate', customDate)
        }
        if (notes) fd.append('notes', notes)
        fd.append('items', JSON.stringify(itemsPayload))

        // Bind image files dynamically per item
        cartItems.forEach((c, index) => {
          if (c.selectedDesign?.file instanceof File) {
            fd.append(`designImage_${index}`, c.selectedDesign.file)
          } else if (c.uploadedFiles?.length) {
            const primaryRef = c.uploadedFiles[0]
            if (primaryRef.file instanceof File) {
              fd.append(`designImage_${index}`, primaryRef.file)
            } else if (primaryRef instanceof File) {
              fd.append(`designImage_${index}`, primaryRef)
            }
            
            // Push rest to generic refs
            c.uploadedFiles.slice(1).forEach(ref => {
              const rf = ref.file instanceof File ? ref.file : (ref instanceof File ? ref : null)
              if (rf) fd.append('referenceImages', rf)
            })
          }
        })

        await orderService.create(fd)
      }

      setSubmitting(false)
      setSubmitted(true)
    } catch (err) {
      setSubmitting(false)
      setSubmitError(err?.response?.data?.message || err?.message || 'Failed to place order.')
    }
  }

  /* ═══════════════  SUCCESS STATE  ═══════════════ */
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-8 animate-fadeSlideIn">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-purple-200">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        </div>
        <div className="space-y-3 max-w-lg">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Order Placed!</h2>
          <p className="text-gray-400 text-base font-medium">Your garment order has been broadcast to verified tailors. You'll start receiving competitive bids shortly.</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={() => navigate('/customer/my-orders')}
            className="px-8 py-3.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
            View My Orders
          </button>
          <button onClick={() => navigate('/customer/dashboard')}
            className="px-8 py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 text-sm">
            Go to Dashboard →
          </button>
        </div>
      </div>
    )
  }

  const progressPct = Math.round((step / (TOTAL - 1)) * 100)

  /* ═══════════════  MAIN LAYOUT  ═══════════════ */
  return (
    <div className="max-w-5xl mx-auto px-4 pb-24">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/customer/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors mb-3">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">New Order</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Step {step + 1} of {TOTAL} — <span className="font-semibold text-gray-600">{STEPS[step].label}</span></p>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-2xl font-black text-purple-600">{progressPct}%</div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Complete</p>
        </div>
      </div>

      <div className="relative mb-10">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="hidden lg:flex justify-between mt-3">
          {STEPS.map((s, i) => {
            const isPast = i < step
            const isCurrent = i === step
            return (
              <button
                key={s.id}
                onClick={() => {
                  // Allow jumping back to earlier configuration steps if we haven't submitted
                  // Don't freely jump to cart unless items exist
                  if (i === 6 && cartItems.length === 0) return
                  if (i <= step) setStep(i)
                }}
                disabled={i > step || (i === 6 && cartItems.length === 0)}
                className={`flex flex-col items-center gap-1.5 transition-all group ${(i > step ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer')} ${(i === 6 && cartItems.length === 0 && 'opacity-20')}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${isCurrent ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110' : isPast ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                  {isPast ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <span>{s.icon}</span>}
                </div>
                <span className={`text-[10px] font-bold transition-colors ${isCurrent ? 'text-purple-600' : isPast ? 'text-gray-600' : 'text-gray-300'}`}>{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div ref={contentRef} className="min-h-[460px]">
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl animate-shake">
            {submitError}
          </div>
        )}

        {step === 0 && (
          <StepWrapper><CategorySelector value={category} onChange={handleCategoryChange} /></StepWrapper>
        )}
        {step === 1 && (
          <StepWrapper><ClothTypeSelector category={category} value={clothType} onChange={handleClothTypeChange} /></StepWrapper>
        )}
        {step === 2 && (
          <StepWrapper><SizeSelector value={size} onChange={handleSizeChange} category={category} /></StepWrapper>
        )}
        {step === 3 && (
          <StepWrapper><MeasurementForm values={measurements} onChange={setMeasurements} size={size} category={category} clothType={clothType} /></StepWrapper>
        )}
        {step === 4 && (
          <StepWrapper><MaterialSelector value={material} onChange={setMaterial} clothType={clothType} /></StepWrapper>
        )}
        {step === 5 && (
          <StepWrapper>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-3 py-1 text-xs font-bold mb-4"><span>🎨</span> DESIGN</div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Add Your Design</h2>
                <p className="text-gray-400 mt-2 text-sm">Upload reference images or generate a design</p>
              </div>
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setDesignMode('upload')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${designMode === 'upload' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><span>🖼️</span> Upload References</button>
                  <button onClick={() => setDesignMode('generate')} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${designMode === 'generate' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><span>✨</span> Generate with AI</button>
                </div>
              </div>
              {designMode === 'upload' && <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><ImageUploader files={uploadedFiles} onChange={setUploadedFiles} /></div>}
              {designMode === 'generate' && <AIDesignGenerator category={category} onSelect={(img) => { setSelectedDesign(img); setPrompt(img.prompt || '') }} selectedId={selectedDesign?.id} />}
            </div>
          </StepWrapper>
        )}

        {/* CART REVIEW STEP */}
        {step === 6 && (
          <StepWrapper>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Custom Garments</h2>
                <p className="text-gray-400 mt-2 text-sm">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your active order</p>
              </div>

              <div className="space-y-4 mb-8">
                {cartItems.map((item, i) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">{item.category === 'man' ? '👔' : item.category === 'woman' ? '👗' : item.category === 'baby' ? '👶' : '👦'}</div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{item.clothType}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 font-semibold bg-gray-50 px-2 py-0.5 rounded-md">Size {item.size}</span>
                          {(item.selectedDesign || item.uploadedFiles?.length > 0) && (
                            <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md uppercase">Design Attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeCartItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-colors" title="Remove garment">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                {cartItems.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-medium">Order cart is empty. Please add a garment.</div>
                )}
              </div>

              <div className="flex justify-center">
                <button onClick={() => { resetActiveState(); setStep(0); }} className="px-6 py-3 border-2 border-purple-200 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors flex items-center gap-2">
                  <span className="text-xl leading-none">+</span> Add Another Garment
                </button>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 7 && (
          <StepWrapper><DeliveryDatePicker deliveryOption={deliveryOption} onOptionChange={setDeliveryOption} customDate={customDate} onDateChange={setCustomDate}/></StepWrapper>
        )}

        {step === 8 && (
          <StepWrapper>
            <OrderSummary data={{ items: cartItems, deliveryOption, customDate, notes }} onEdit={(s) => setStep(s)} onSubmit={handleSubmit} onNotesChange={setNotes} loading={submitting} />
          </StepWrapper>
        )}
      </div>

      {step < 8 && (
        <div className={`flex mt-12 justify-between items-center ${step === 0 ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={step === 5 ? handleAddToCart : goNext}
            disabled={!canNext()}
            className="flex items-center gap-2.5 px-10 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-purple-200 text-sm"
          >
            {step === 5 ? 'Add Garment to Order' : step === 6 ? 'Proceed to Delivery' : 'Continue'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {step > 0 && step !== 6 && ( /* Don't display back button on cart, they can edit items using dots or + new */
            <button onClick={goPrev} className="px-6 py-4 text-gray-400 font-semibold text-sm hover:text-gray-900 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>
      )}
    </div>
  )
}
