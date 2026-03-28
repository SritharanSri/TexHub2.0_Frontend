import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Ruler, Save, MessageCircle, Loader2, AlertCircle, CheckCircle, PlayCircle, Truck, Package, AlertTriangle, Star, Eye, Image, Gavel, CreditCard, StarOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import ChatWindow from '../components/ui/ChatWindow'
import { sampleMeasurements } from '../services/mockData'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import { quotationService } from '../services/quotationService'
import { getFileUrl } from '../services/api'
import Modal from '../components/ui/Modal'
import StarRating from '../components/ui/StarRating'
import { ratingService } from '../services/ratingService'

export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDemo = user?._demo

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [progressVal, setProgressVal] = useState(0)
  const [savingProgress, setSavingProgress] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [ratingVal, setRatingVal] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setOrder({
        orderId: id || 'DEMO-001',
        _realId: id,
        customer: 'Demo Customer',
        item: 'Demo Shirt',
        category: 'man',
        material: 'Cotton',
        size: 'M',
        status: 'in_work',
        progress: 45,
        amount: 1500,
        pocket: 'Yes',
        notes: 'Please make it slightly loose',
        tailorId: null,
        designImage: null,
        images: [],
        items: [{
          clothType: 'Demo Shirt',
          category: 'man',
          material: 'Cotton',
          size: 'M',
          pocket: 'Yes',
          measurements: { shoulder: 18, chest: 42, neck: 15, armRound: 14 },
          designImage: null,
        }]
      })
      setProgressVal(45)
      setLoading(false)
    } else {
      fetchOrder()
    }
  }, [id, isDemo])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await orderService.getById(id)
      const data = res.data || res

      // Build items array — prefer new JSONB format, fall back to legacy scalar fields
      let items = []
      if (Array.isArray(data.items) && data.items.length > 0) {
        items = data.items
      } else {
        // Legacy single-item order
        const meas = { ...(data.measurements || {}) }
        delete meas.pocket
        delete meas.notes
        items = [{
          clothType: data.clothType || data.item || 'Custom Garment',
          category: data.category || '',
          material: data.material || '',
          size: data.size || '',
          pocket: data.pocket || data.measurements?.pocket || 'No',
          measurements: meas,
          designImage: data.designImage || null,
        }]
      }

      const mapped = {
        orderId: data.orderNumber || data.id || id,
        _realId: data.id,
        customer: data.customer?.name || data.customer || '',
        customerPhone: data.customer?.phone || '',
        item: data.clothType || items[0]?.clothType || 'Custom Garment',
        category: data.category || '',
        pocket: data.pocket || data.measurements?.pocket || 'No',
        notes: data.notes || data.specialInstructions || data.measurements?.notes || '',
        status: data.status || '',
        progress: data.progress || 0,
        amount: parseFloat(data.quotationAmount) || 0,
        deliveryDate: data.quotationDeliveryDate || data.customDate || '',
        deliveryOption: data.deliveryOption || '',
        designImage: data.designImage || null,
        images: data.images || [],
        tailorId: data.tailorId || null,
        tailorName: data.tailor?.name || '',
        customerId: data.customerId || data.customer?.id || null,
        rating: data.rating || null,
        items,
      }
      setOrder(mapped)
      setProgressVal(mapped.progress)
      if (mapped.rating) {
        setRatingVal(mapped.rating.stars)
        setReviewText(mapped.rating.review || '')
      }
    } catch (err) {
      console.error('Order details error:', err)
      setError('Could not load order details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (isDemo) { setOrder(prev => ({ ...prev, status: newStatus })); return }
    setStatusUpdating(true)
    setError('')
    setSuccess('')
    try {
      const orderId = order?._realId || id
      await orderService.updateStatus(orderId, newStatus)
      const label = { in_work: 'In Progress', dispatched: 'Dispatched', delivered: 'Delivered' }[newStatus] || newStatus
      setOrder(prev => ({ ...prev, status: newStatus }))
      if (newStatus === 'in_work') setProgressVal(5)
      setSuccess(`Status updated to "${label}"`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update status.')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleProgressSave = async () => {
    if (isDemo) {
      setOrder(prev => ({ ...prev, progress: progressVal, ...(progressVal === 100 ? { status: 'delivered' } : {}) }))
      setSuccess(`Progress updated to ${progressVal}%`)
      setTimeout(() => setSuccess(''), 2000)
      return
    }
    setSavingProgress(true)
    setError('')
    setSuccess('')
    try {
      const orderId = order?._realId || id
      if (progressVal === 100) await orderService.updateStatus(orderId, 'delivered')
      const res = await orderService.updateProgress(orderId, progressVal)
      const updated = res?.data || res || {}
      const newStatus = progressVal === 100 ? 'delivered' : (updated.status || order?.status)
      setOrder(prev => ({ ...prev, progress: progressVal, status: newStatus }))
      setSuccess(progressVal === 100 ? 'Order completed and delivered! 🎉' : `Progress updated to ${progressVal}%`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update progress.')
    } finally {
      setSavingProgress(false)
    }
  }

  const handleRateAndComplete = async () => {
    setSubmittingRating(true)
    setError('')
    try {
      const orderId = order?._realId || id
      // 1. Submit rating
      // Backend automatically updates order status to 'delivered'
      await ratingService.create(orderId, { stars: ratingVal, review: reviewText })
      
      setOrder(prev => ({ ...prev, status: 'delivered', progress: 100, rating: { stars: ratingVal, review: reviewText } }))
      setSuccess('Feedback submitted! Order marked as delivered. 🎉')
      setShowRateModal(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit rating.')
    } finally {
      setSubmittingRating(false)
    }
  }

  const categoryEmoji = (cat) => {
    const map = { man: '👔', woman: '👗', baby: '👶', 'little-boy': '👦', 'little-girl': '👧' }
    return map[cat] || '🧵'
  }

  const statusLabel = (s) => ({
    pending_quotation: 'Awaiting Bid',
    quotation_received: 'Bid Received',
    payment_pending: 'Payment Pending',
    confirmed: 'Ready to Start',
    in_work: 'In Progress',
    dispatched: 'Dispatched',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }[s] || s)

  const statusColor = (s) => ({
    pending_quotation: 'bg-amber-100 text-amber-700',
    quotation_received: 'bg-purple-100 text-purple-700',
    payment_pending: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    in_work: 'bg-blue-100 text-blue-700',
    dispatched: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-gray-500 font-medium">Loading order details...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-800 font-bold text-lg">Order Not Found</p>
        <p className="text-gray-500 text-sm">{error}</p>
        <Button onClick={() => navigate(-1)} variant="secondary">← Go Back</Button>
      </div>
    )
  }

  const displayOrderId = order?.orderId || id
  const displayCustomer = order?.customer || 'Customer'
  const displayItem = order?.items?.length > 1
    ? `${order.items.length} Garments`
    : (order?.item || 'Custom Garment')

  return (
    <div className="space-y-6 pb-12">
      {/* Flash banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 flex flex-wrap gap-3 items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-900 truncate">
              Order — <span className="text-purple-600">{displayOrderId}</span>
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{displayItem} · {displayCustomer}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {order?.status && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor(order.status)}`}>
                {statusLabel(order.status)}
              </span>
            )}
            {(user?.role === 'tailor' || (user?.role === 'customer' && order?.tailorId)) && (
              <Button onClick={() => setShowChat(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600">
                <MessageCircle className="w-4 h-4" />
                {user?.role === 'customer' ? 'Message Tailor' : 'Message Customer'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT SIDEBAR ── */}
        <div className="space-y-4">

          {/* Order Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-base">Order Info</h3>
            <div className="space-y-2.5">
              {[
                ['Order ID',  displayOrderId],
                ['Customer',  displayCustomer],
                ['Garments',  order?.items?.length > 1 ? `${order.items.length} items` : null],
                ['Item',      order?.items?.length === 1 ? displayItem : null],
                ['Category',  order?.category],
                ['Material',  order?.items?.length === 1 ? order.items[0]?.material : null],
                ['Size',      order?.items?.length === 1 ? order.items[0]?.size : null],
                ['Amount',    order?.amount ? `Rs.${order.amount.toLocaleString()}` : null],
                ['Delivery',  order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : (order?.deliveryOption || null)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-400 flex-shrink-0">{k}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top-level design images (legacy) */}
          {(order?.designImage || order?.images?.length > 0) && !(order?.items?.some(i => i.designImage)) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-600" /> Design Reference
              </h3>
              <div className="flex gap-3 flex-wrap">
                {order.designImage && (
                  <div className="relative group cursor-pointer" onClick={() => window.open(getFileUrl(order.designImage), '_blank')}>
                    <img src={getFileUrl(order.designImage)} alt="Design"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-purple-200 transition-all group-hover:scale-105 group-hover:shadow-lg" />
                    <span className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">Design</span>
                  </div>
                )}
                {order.images?.map((img, i) => (
                  <div key={i} className="relative group cursor-pointer" onClick={() => window.open(getFileUrl(img.filePath || img.url || img), '_blank')}>
                    <img src={getFileUrl(img.filePath || img.url || img)} alt={`Ref ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200 transition-all group-hover:scale-105 group-hover:shadow-lg" />
                    <span className="absolute top-1.5 left-1.5 bg-gray-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">Ref {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAILOR ACTIONS */}
          {user?.role === 'tailor' && order?.status && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-base">Tailor Actions</h3>
              <div className="space-y-3">

                {order.status === 'pending_quotation' && (
                  <Button fullWidth onClick={() => navigate('/orders/bidding', { state: { order: { ...order, id: order._realId || order.orderId, _realId: order._realId || id } } })}
                    className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2">
                    <Gavel className="w-4 h-4" /> Submit Quotation
                  </Button>
                )}

                {order.status === 'confirmed' && (
                  <Button fullWidth onClick={() => handleStatusUpdate('in_work')} loading={statusUpdating}
                    className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                    <PlayCircle className="w-4 h-4" /> Start Work
                  </Button>
                )}

                {order.status === 'in_work' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700">Work Progress</label>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          progressVal === 100 ? 'bg-green-100 text-green-700' :
                          progressVal >= 60 ? 'bg-blue-100 text-blue-700' :
                          progressVal >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>{progressVal}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="5" value={progressVal}
                        onChange={e => setProgressVal(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-purple-600" />
                      <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progressVal === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                          style={{ width: `${progressVal}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" fullWidth onClick={handleProgressSave} loading={savingProgress}
                        className="flex items-center justify-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Save Progress
                      </Button>
                      <Button size="sm" fullWidth variant="outline" onClick={() => handleStatusUpdate('dispatched')}
                        loading={statusUpdating} className="flex items-center justify-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Dispatch
                      </Button>
                    </div>
                    {progressVal === 100 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
                        🎉 <strong>Ready to complete!</strong> Save progress to mark as delivered.
                      </div>
                    )}
                  </div>
                )}

                {order.status === 'dispatched' && (
                  <Button fullWidth onClick={() => handleStatusUpdate('delivered')} loading={statusUpdating}
                    className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                    <Package className="w-4 h-4" /> Mark Delivered
                  </Button>
                )}

                {order.status === 'delivered' && (
                  <div className="text-center py-3">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-green-700">Order Delivered</p>
                    <p className="text-xs text-gray-400 mt-1">Payment will be released from escrow.</p>
                  </div>
                )}

                {/* Progress bar (non-editing view) */}
                {order.status !== 'in_work' && order.progress > 0 && order.status !== 'delivered' && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Work Progress</span>
                      <span className="font-bold">{order.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${order.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMER ACTIONS */}
          {user?.role === 'customer' && order && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-base">Manage Order</h3>
              <div className="space-y-3">
                {(order.status === 'pending_quotation' || order.status === 'quotation_received') && (
                  <Button fullWidth onClick={() => navigate('/customer/bids')}
                    className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> View Bids
                  </Button>
                )}
                {order.status === 'payment_pending' && (
                  <Button fullWidth onClick={() => navigate('/customer/payment', { state: { orderId: order._realId || id } })}
                    className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Proceed to Payment
                  </Button>
                )}
                {order.status === 'in_work' && order.progress > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Tailor Progress</span>
                      <span className="font-bold">{order.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                        style={{ width: `${order.progress}%` }} />
                    </div>
                  </div>
                )}
                {order.status === 'dispatched' && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight">Order Dispatched!</p>
                        <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Awaiting Feedback</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Your tailor has dispatched the order. Please confirm receipt and rate their work to complete the process.
                    </p>
                    <Button fullWidth onClick={() => setShowRateModal(true)} className="bg-purple-600 hover:bg-purple-700 shadow-sm transition-all py-2">
                       Rate & Confirm Receipt
                    </Button>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className="space-y-3">
                    <div className="text-center py-3">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-green-700">Order Delivered!</p>
                    </div>
                    {order.rating ? (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Your Rating</span>
                          <button onClick={() => setShowRateModal(true)} className="text-[10px] font-bold text-purple-600 underline">Edit Review</button>
                        </div>
                        <StarRating rating={order.rating.stars} size="sm" />
                        {order.rating.review && <p className="text-xs text-gray-500 mt-2 italic">"{order.rating.review}"</p>}
                      </div>
                    ) : (
                      <Button fullWidth onClick={() => {
                        setRatingVal(5)
                        setReviewText('')
                        setShowRateModal(true)
                      }} className="bg-purple-600">Rate Tailor</Button>
                    )}
                  </div>
                )}
                {order.tailorId && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button fullWidth variant="secondary"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => alert('Use My Orders page to report issues.')}>
                    <AlertTriangle className="w-4 h-4 mr-2" /> Report Issue
                  </Button>
                )}
                {!order.tailorId && order.status === 'pending_quotation' && (
                  <p className="text-sm text-gray-400 italic text-center py-2">Waiting for tailors to bid.</p>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          {(order?.pocket || order?.notes) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 rounded-lg"><Ruler className="w-4 h-4 text-purple-600" /></span>
                Customer Preferences
              </h4>
              <div className="space-y-3">
                {order.pocket && (
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                    <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Pocket Included?</p>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${order.pocket === 'Yes' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      {order.pocket}
                    </span>
                  </div>
                )}
                {order.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Special Instructions</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Garment Cards ── */}
        <div className="lg:col-span-2 space-y-5">
          {!order ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
              <p>Loading garment details...</p>
            </div>
          ) : order.items?.length > 0 ? (
            order.items.map((item, idx) => {
              const measEntries = Object.entries(item.measurements || {}).filter(([k, v]) => v && k !== 'pocket' && k !== 'notes')
              return (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                          {categoryEmoji(item.category)}
                        </div>
                        <div>
                          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Garment {idx + 1}</p>
                          <h3 className="text-white font-black text-xl">{item.clothType || 'Custom Garment'}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.size && (
                          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full block mb-1">
                            Size {item.size}
                          </span>
                        )}
                        {item.material && (
                          <p className="text-white/70 text-xs">{item.material}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Measurements */}
                    <div className="mb-5">
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-purple-600" /> Body Measurements (Inches)
                      </h4>
                      {measEntries.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {measEntries.map(([key, value]) => (
                            <div key={key} className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-3 text-center hover:border-purple-300 transition-colors">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider capitalize truncate">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <div className="flex items-baseline justify-center gap-0.5 mt-1">
                                <span className="font-black text-xl text-purple-700">{value}</span>
                                <span className="text-xs text-gray-400">"</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-400 italic">No specific measurements for this garment.</p>
                        </div>
                      )}
                    </div>

                    {/* Item-specific design image */}
                    {item.designImage && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Image className="w-4 h-4 text-purple-600" /> Item Design Reference
                        </h4>
                        <img src={getFileUrl(item.designImage)} alt="Design"
                          className="w-28 h-28 object-cover rounded-xl border-2 border-purple-200 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                          onClick={() => window.open(getFileUrl(item.designImage), '_blank')} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-500 font-medium">No garment details found for this order.</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => navigate(-1)} className="px-8">← Back</Button>
          </div>
        </div>
      </div>

      {/* Rate Modal */}
      <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)}
        title="Rate your Tailor" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRateModal(false)}>Cancel</Button>
            <Button onClick={handleRateAndComplete} loading={submittingRating} className="bg-purple-600 hover:bg-purple-700">
              Submit Review & Complete
            </Button>
          </>
        }>
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-purple-100">
                {order?.tailorName?.charAt(0) || 'T'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow text-xs">⭐</div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-lg">{order?.tailorName || 'Tailor'}</h3>
              <p className="text-gray-400 text-sm">How was your experience?</p>
            </div>
            <div className="bg-gray-50 rounded-2xl px-6 py-3 border border-gray-100">
              <StarRating rating={ratingVal} onRate={setRatingVal} size="xl" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Write a Review <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea rows={3} value={reviewText} onChange={e => setReviewText(e.target.value)}
              placeholder="Share more about the fit, quality, and timeframe..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-gray-50 hover:bg-white transition-colors" />
          </div>
        </div>
      </Modal>

      {/* Chat overlay */}
      {showChat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <ChatWindow
            orderId={order?._realId || id}
            recipientName={user?.role === 'customer' ? (order?.tailorName || 'Your Tailor') : displayCustomer}
            recipientRole={user?.role === 'customer' ? 'tailor' : 'customer'}
            receiverId={user?.role === 'customer' ? order?.tailorId : order?.customerId}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  )
}
