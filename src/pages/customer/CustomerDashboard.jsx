import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Banknote, ArrowRight, Package, TrendingUp, Star,
  PlusCircle, ShoppingBag, Gavel, CheckCircle
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import StarRating from '../../components/ui/StarRating'
import Button from '../../components/ui/Button'
import { ratingService } from '../../services/ratingService'
import { useAuth } from '../../hooks/useAuth'
import { orderService } from '../../services/orderService'

const statusColour = { process: 'text-blue-600 bg-blue-50', completed: 'text-green-600 bg-green-50', bidding: 'text-amber-600 bg-amber-50', pending: 'text-orange-600 bg-orange-50' }
const statusLabel  = { process: 'In Progress', completed: 'Delivered', bidding: 'Awaiting Bid', pending: 'Awaiting Payment' }

/* ── Map backend statuses to UI statuses ── */
const mapStatus = (s) => {
  const map = {
    pending_quotation: 'bidding',
    quotation_received: 'bidding',
    payment_pending: 'pending',
    confirmed: 'process',
    in_work: 'process',
    dispatched: 'process',
    delivered: 'completed',
    cancelled: 'completed',
  }
  return map[s] || s
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRateOrder, setAutoRateOrder] = useState(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    orderService.getMyOrders({ limit: 50 })
      .then(res => {
        if (cancelled) return
        const list = res?.data || res || []
        const arr = Array.isArray(list) ? list : (list.orders || [])
        const sorted = arr.map(o => ({
          id: o.orderNumber || o.id,
          _backendId: o.id,
          item: o.clothType || o.category || 'Custom Garment',
          fabric: o.material || '',
          status: mapStatus(o.status),
          _rawStatus: o.status,
          placed: o.createdAt,
          tailor: o.tailor?.name || null,
          tailorId: o.tailorId,
          amount: o.quotationAmount || null,
          progress: o.progress || 0,
          rating: o.rating || null,
        }))
        setOrders(sorted)
        
        // Auto-popup logic: Find first dispatched & unrated order
        const unrated = sorted.find(o => o._rawStatus === 'dispatched' && !o.rating)
        if (unrated) {
          setAutoRateOrder(unrated)
          setRatingVal(5)
          setReviewText('')
        }
      })
      .catch((e) => {
        console.error('Fetch orders error:', e)
        setOrders([])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const totalOrders = orders.length
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'process').length
  const deliveredOrders = orders.filter(o => o.status === 'completed').length
  const biddingOrders = orders.filter(o => o.status === 'bidding').length

  const dynamicQuickActions = [
    { to: '/customer/place-order', icon: PlusCircle,  label: 'PLACE ORDER',   sub: 'Get clothes stitched', color: 'from-violet-500 to-purple-600',  count: null },
    { to: '/customer/my-orders',   icon: ShoppingBag, label: 'MY ORDERS',     sub: 'Track your requests',  color: 'from-blue-500 to-indigo-600',    count: totalOrders },
    { to: '/customer/bids',        icon: Gavel,       label: 'TAILOR BIDS',   sub: 'Review & accept bids', color: 'from-amber-500 to-orange-500',   count: biddingOrders },
    { to: '/customer/my-orders',   icon: CheckCircle, label: 'COMPLETED',     sub: 'Past deliveries',      color: 'from-emerald-500 to-green-600',  count: deliveredOrders },
  ]

  const recentOrders = orders.slice(0, 5)

  const handleRateAndComplete = async () => {
    setSubmittingRating(true)
    try {
      const orderId = autoRateOrder._backendId || autoRateOrder.id
      // 1. Submit rating
      // Backend automatically updates order status to 'delivered'
      await ratingService.create(orderId, { stars: ratingVal, review: reviewText })
      
      // 2. Update local state
      setOrders(prev => prev.map(o => o.id === autoRateOrder.id ? { ...o, _rawStatus: 'delivered', status: 'completed', rating: { stars: ratingVal, review: reviewText } } : o))
      setSuccessMsg(`Feedback submitted for ${autoRateOrder.item}! Order marked as delivered. 🎉`)
      setAutoRateOrder(null)
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit rating.')
    } finally {
      setSubmittingRating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative bg-dark rounded-3xl p-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-purple-900/25 blur-2xl" />
          {/* Rings */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-52 h-52 rounded-full border border-white/5" />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-white/5" />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-blue-600/30 bg-blue-600/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-600/30 text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
            👗 Customer Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Hi, {firstName}! 👋</h1>
          <p className="text-gray-400 text-base max-w-lg">
            WELCOME TO TEXHUB — Get your dream outfits stitched by the best tailors.
            You have <span className="text-blue-400 font-semibold">{biddingOrders} bids</span> waiting for review.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/customer/place-order')}
              className="btn-primary flex items-center gap-2">
              Place New Order <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/customer/bids')}
              className="flex items-center gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20 font-semibold px-5 py-2.5 rounded-xl transition-all">
              Review Bids
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingBag,   label: 'Total Orders',    value: totalOrders,      bg: 'bg-purple-100', ic: 'text-purple-600' },
          { icon: Clock,         label: 'Active Orders',   value: activeOrders,     bg: 'bg-blue-100',   ic: 'text-blue-600' },
          { icon: CheckCircle,   label: 'Delivered',       value: deliveredOrders,  bg: 'bg-green-100',  ic: 'text-green-600' },
          { icon: Gavel,         label: 'Awaiting Bids',   value: biddingOrders,    bg: 'bg-yellow-100', ic: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.ic}`} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 leading-none">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicQuickActions.map(({ to, icon: Icon, label, sub, color, count }) => (
            <button key={to + label} onClick={() => navigate(to)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {count !== null && <span className="text-3xl font-black text-white">{count}</span>}
                </div>
                <h3 className="text-white font-black text-sm tracking-wide mb-1">{label}</h3>
                <p className="text-white/70 text-xs">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column: recent orders + order summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <button onClick={() => navigate('/customer/my-orders')}
              className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Package className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No orders yet. Place your first order!</p>
              <button onClick={() => navigate('/customer/place-order')}
                className="mt-3 text-sm text-purple-600 font-semibold hover:underline">
                Place Order →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/customer/my-orders`)}>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800 text-sm">{o.item}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColour[o.status]}`}>
                      {statusLabel[o.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{o.id}</p>
                  {o.status === 'process' && (
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${o.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Order Summary</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Awaiting Bids', count: biddingOrders, color: 'bg-amber-100 text-amber-700', icon: Gavel },
              { label: 'In Progress', count: activeOrders, color: 'bg-blue-100 text-blue-700', icon: Clock },
              { label: 'Delivered', count: deliveredOrders, color: 'bg-green-100 text-green-700', icon: CheckCircle },
              { label: 'Total Orders', count: totalOrders, color: 'bg-purple-100 text-purple-700', icon: ShoppingBag },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                </div>
                <span className="text-xl font-black text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/customer/place-order')}
            className="mt-4 w-full btn-primary text-sm">
            Place New Order
          </button>
      </div>
      </div>

      {/* Auto Rating Popup */}
      <Modal isOpen={!!autoRateOrder} onClose={() => setAutoRateOrder(null)} 
        title="Quick Feedback & Delivery Confirmation" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAutoRateOrder(null)}>Decide Later</Button>
            <Button onClick={handleRateAndComplete} loading={submittingRating} className="bg-purple-600 hover:bg-purple-700">
              Submit Review & Complete
            </Button>
          </>
        }>
        {autoRateOrder && (
          <div className="space-y-5">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-purple-900 leading-tight">Order Dispatched!</p>
                <p className="text-xs text-purple-600 mt-1">Your tailor has delivered your order. Please confirm and rate.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 py-2">
               <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-purple-50">
                {autoRateOrder.tailor?.charAt(0) || 'T'}
              </div>
              <h3 className="font-bold text-gray-900">{autoRateOrder.tailor || 'Tailor'}</h3>
              <p className="text-xs text-gray-400">Rate your experience</p>
              <div className="mt-2">
                <StarRating rating={ratingVal} onRate={setRatingVal} size="xl" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Write a Review (Optional)</label>
              <textarea rows={3} value={reviewText} onChange={e => setReviewText(e.target.value)}
                placeholder="Share more about the fit and quality..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-gray-50 hover:bg-white transition-colors" />
            </div>
            
            <p className="text-[10px] text-gray-400 text-center italic">Confirming will release payment from escrow to tailor.</p>
          </div>
        )}
      </Modal>

      {/* Flash Success Message */}
      {successMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">{successMsg}</span>
        </div>
      )}
    </div>
  )
}
