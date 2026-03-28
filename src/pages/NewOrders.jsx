import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Send, Banknote, Calendar, Truck, Loader2, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { Select } from '../components/ui/Input'
import StatusBadge from '../components/ui/StatusBadge'
import { incomingOrders } from '../services/mockData'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import { quotationService } from '../services/quotationService'
import { getFileUrl } from '../services/api'

// Map backend order to the shape the UI expects
function mapOrder(o) {
  // Compute deadline from backend (may already include it) or from deliveryOption/customDate
  let deadline = o.deadline || ''
  if (!deadline) {
    if (o.deliveryOption === 'custom' && o.customDate) {
      deadline = o.customDate
    } else {
      const daysMap = { express: 5, standard: 10 }
      const days = daysMap[o.deliveryOption] || 10
      const base = o.createdAt ? new Date(o.createdAt) : new Date()
      deadline = new Date(base.getTime() + days * 86400000).toISOString().split('T')[0]
    }
  }
  return {
    ...o,
    id: o.orderNumber || o.id,
    _realId: o.id,
    item: o.clothType || o.item || '',
    fabric: o.material || o.fabric || '',
    customer: o.customer?.name || o.customer || '',
    customerPhone: o.customer?.phone || o.customerPhone || '',
    placedOn: o.createdAt || o.placedOn || '',
    category: o.category || '',
    color: o.color || '',
    deadline,
    measurements: o.measurements || {},
    designNote: o.designNote || o.notes || '',
    selectedDesign: o.selectedDesign || null,
    designImage: o.designImage || null,
    images: o.images || [],
  }
}

export default function NewOrders() {
  const { user } = useAuth()
  const isDemo = user?._demo
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [quoteModal, setQuoteModal] = useState(null)
  const [submitted, setSubmitted] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [quote, setQuote] = useState({ amount: '', deliveryDate: '', deliveryMethod: 'Home Delivery', message: '' })

  const setQ = k => e => setQuote(q => ({ ...q, [k]: e.target.value }))

  useEffect(() => {
    if (isDemo) {
      setOrders(incomingOrders)
    } else {
      fetchOpenOrders()
    }
  }, [isDemo])

  const fetchOpenOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await orderService.getOpenOrders()
      const payload = res.data || {}
      const data = payload.data || payload.orders || payload
      setOrders(Array.isArray(data) ? data.map(mapOrder) : [])
    } catch (err) {
      console.error('Failed to fetch open orders:', err)
      setError('Could not load new orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuote = async () => {
    if (isDemo) {
      setSubmitted(s => new Set(s).add(quoteModal.id))
      setQuoteModal(null)
      setQuote({ amount: '', deliveryDate: '', deliveryMethod: 'Home Delivery', message: '' })
      return
    }

    setSubmitting(true)
    try {
      const orderId = quoteModal._realId || quoteModal.id
      await quotationService.create(orderId, {
        amount: Number(quote.amount),
        deliveryDate: quote.deliveryDate,
        deliveryMethod: quote.deliveryMethod,
        message: quote.message,
      })
      setSubmitted(s => new Set(s).add(quoteModal.id))
      setQuoteModal(null)
      setQuote({ amount: '', deliveryDate: '', deliveryMethod: 'Home Delivery', message: '' })
    } catch (err) {
      console.error('Failed to submit quotation:', err)
      setError('Failed to submit quotation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">New Order Requests</h2>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders awaiting quotation</p>
        </div>
        <div className="bg-purple-100 text-purple-700 font-semibold text-sm px-4 py-2 rounded-xl">
          {orders.length} Available
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading orders...</span>
        </div>
      )}

      {/* Tip */}
      {!loading && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">How to win orders</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Review each customer's design, measurements, and budget. Submit a competitive quote with a realistic delivery date.
              The customer will choose the best offer!
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-semibold">No open orders right now</p>
          <p className="text-sm mt-1">Check back later for new customer requests.</p>
        </div>
      )}

      {/* Order cards */}
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
            {/* Colored top bar based on category */}
            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600" />
            <div className="p-6">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-xl">{order.item}</h3>
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">{order.category}</span>
                    {submitted.has(order.id) && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">✓ Quoted</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5 font-mono">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Delivery Deadline</p>
                  <p className="font-black text-xl text-gray-800">{order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>
              </div>

              {/* Customer + fabric info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <span>👤 {order.customer}</span>
                <span>🧵 {order.fabric}{order.color ? ` · ${order.color}` : ''}</span>
                {order.deadline && <span>📅 Due {new Date(order.deadline).toLocaleDateString('en-IN')}</span>}
              </div>

              {/* Design image preview */}
              {(order.designImage || order.design || order.designImageUrl || order.images?.length > 0) && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Design & Reference Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {(order.designImage || order.design || order.designImageUrl) && (
                      <img src={getFileUrl(order.designImage || order.design || order.designImageUrl)} alt="Design"
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition"
                        onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(order.designImage || order.design || order.designImageUrl), '_blank') }} />
                    )}
                    {order.images?.map((img, i) => (
                      <img key={i} src={getFileUrl(img.filePath || img.url || img)} alt={`Ref ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition"
                        onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(img.filePath || img.url || img), '_blank') }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Measurements quick view */}
              {order.measurements && Object.keys(order.measurements).length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[['Shoulder', order.measurements.shoulder], ['Chest', order.measurements.chest],
                    ['Neck', order.measurements.neck], ['Arm', order.measurements.armRound]].filter(([,v]) => v).map(([k,v]) => (
                    <div key={k} className="bg-purple-50 rounded-xl p-2 text-center">
                      <p className="text-lg font-black text-purple-700">{v}"</p>
                      <p className="text-xs text-gray-400">{k}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${order._realId || order.id}`)}>
                  <Eye className="w-4 h-4" /> Full Details
                </Button>
                {!submitted.has(order.id) ? (
                  <Button size="sm" onClick={() => navigate('/orders/bidding', { state: { order: { ...order, id: order._realId, _realId: order._realId } } })} className="flex-1">
                    <Send className="w-4 h-4" /> Submit Quotation
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-semibold text-sm">
                    ✓ Quotation sent — waiting for customer to select
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* Quotation submission modal */}
      <Modal isOpen={!!quoteModal} onClose={() => setQuoteModal(null)}
        title={`Submit Quotation`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setQuoteModal(null)}>Cancel</Button>
            <Button onClick={handleSubmitQuote} disabled={!quote.amount || !quote.deliveryDate || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Quote'}
            </Button>
          </>
        }>
        {quoteModal && (
          <div className="space-y-4">
            {/* Summary banner */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600" />
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">For Order</p>
                  <p className="text-white font-bold">{quoteModal.item}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs">Customer Deadline</p>
                  <p className="text-white font-black">{quoteModal.deadline || '—'}</p>
                </div>
              </div>
            </div>
            <Input label="Your Quote Amount (Rs.) *" type="number" placeholder="e.g. 1200"
              icon={<Banknote className="w-4 h-4" />}
              value={quote.amount} onChange={setQ('amount')} />
            <Input label="Delivery Date *" type="date"
              icon={<Calendar className="w-4 h-4" />}
              max={quoteModal?.deadline || ''}
              value={quote.deliveryDate} onChange={setQ('deliveryDate')} />
            <div className="grid grid-cols-2 gap-2">
              {['Home Delivery', 'Pickup'].map(opt => (
                <button key={opt} type="button"
                  onClick={() => setQ('deliveryMethod')({ target: { value: opt } })}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    quote.deliveryMethod === opt
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Message to Customer</label>
              <textarea rows={3} value={quote.message} onChange={setQ('message')}
                placeholder="Describe your expertise, quality promise..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-gray-50 hover:bg-white transition-colors" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
