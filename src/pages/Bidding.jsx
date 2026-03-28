import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Gavel, TrendingUp, Banknote, Clock, Loader2, AlertCircle, MessageCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ChatWindow from '../components/ui/ChatWindow'
import { biddingOrders } from '../services/mockData'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import { quotationService } from '../services/quotationService'
import { getFileUrl } from '../services/api'

// Map backend order to the shape the UI expects
function mapOrder(o) {
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
    // Preserve an already-resolved real UUID — don't overwrite it with the display id
    _realId: o._realId || o.id,
    item: o.clothType || o.item || '',
    fabric: o.material || o.fabric || '',
    customer: o.customer?.name || o.customer || '',
    deadline,
    bids: o.quotationCount || o.bids || 0,
    placedOn: o.createdAt || o.placedOn || '',
    designImage: o.designImage || null,
    images: o.images || [],
    notes: o.notes || '',
  }
}

export default function Bidding() {
  const { user } = useAuth()
  const isDemo = user?._demo
  const location = useLocation()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [myBids, setMyBids] = useState({})
  const [bidAmount, setBidAmount] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('Home Delivery')
  const [bidMessage, setBidMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [chatTarget, setChatTarget] = useState(null)

  useEffect(() => {
    if (isDemo) {
      setOrders(biddingOrders)
    } else {
      fetchOrders()
    }
  }, [isDemo])

  // Auto-select order when navigated from NewOrders
  useEffect(() => {
    if (location.state?.order) {
      setSelected(mapOrder(location.state.order))
    }
  }, [location.state])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await orderService.getOpenOrders()
      const payload = res.data || {}
      const data = payload.data || payload.orders || payload
      setOrders(Array.isArray(data) ? data.map(mapOrder) : [])
    } catch (err) {
      console.error('Failed to fetch bidding orders:', err)
      setError('Could not load bidding orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBid = async () => {
    if (!bidAmount || !deliveryDate) return

    if (isDemo) {
      setMyBids(b => ({
        ...b,
        [selected.id]: {
          amount: Number(bidAmount),
          deliveryDate,
          deliveryMethod,
          message: bidMessage
        }
      }))
      setSelected(null)
      setBidAmount('')
      setDeliveryDate('')
      setDeliveryMethod('Home Delivery')
      setBidMessage('')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const orderId = selected._realId || selected.id
      // Guard: never send a display ID (order numbers like TEX-xxxxx) or undefined
      if (!orderId || orderId.startsWith('TEX-') || !orderId.includes('-')) {
        throw new Error('Could not resolve the order UUID. Please go back and try again.')
      }
      await quotationService.create(orderId, {
        amount: Number(bidAmount),
        deliveryDate,
        deliveryMethod,
        message: bidMessage,
      })
      setMyBids(b => ({
        ...b,
        [selected.id]: {
          amount: Number(bidAmount),
          deliveryDate,
          deliveryMethod,
          message: bidMessage
        }
      }))
      setSelected(null)
      setBidAmount('')
      setDeliveryDate('')
      setDeliveryMethod('Home Delivery')
      setBidMessage('')
    } catch (err) {
      console.error('Failed to submit bid:', err)
      setError('Failed to submit bid. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Bidding Board</h2>
          <p className="text-gray-500 text-sm mt-1">{orders.length} open bids available — place your best offer</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Gavel className="w-6 h-6 text-amber-600" />
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
        <div className="flex items-center justify-center gap-2 py-12 text-amber-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading bidding orders...</span>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Gavel, label: 'Open Bids', value: orders.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-500' },
            { icon: TrendingUp, label: 'My Active Bids', value: Object.keys(myBids).length, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', iconColor: 'text-purple-500' },
            { icon: Clock, label: 'Avg. Deadline', value: orders.length > 0 ? (() => { const avg = orders.reduce((s, o) => s + (o.deadline ? Math.ceil((new Date(o.deadline) - new Date()) / 86400000) : 0), 0) / orders.length; return `${Math.round(avg)}d`; })() : 'N/A', color: 'text-green-600', bg: 'bg-green-50 border-green-100', iconColor: 'text-green-500' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} border rounded-2xl p-4 flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-semibold">No open bids right now</p>
          <p className="text-sm mt-1">Check back later for new bidding opportunities.</p>
        </div>
      )}

      {/* Bidding cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {orders.map(order => {
          const hasMyBid = !!myBids[order.id]
          const daysLeft = order.deadline ? Math.ceil((new Date(order.deadline) - new Date()) / 86400000) : 0

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-white/80">{order.id}</span>
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                    {order.bids} bidders
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mt-2">{order.item}</h3>
                <p className="text-white/70 text-sm">{order.fabric}</p>
              </div>

                <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="font-semibold text-gray-800">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Deadline</p>
                    <p className="font-black text-purple-600 text-lg">{order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN') : 'N/A'}</p>
                  </div>
                </div>

                {/* Design image thumbnail */}
                {(order.designImage || order.images?.length > 0) && (
                  <div className="flex gap-2 flex-wrap">
                    {order.designImage && (
                      <img src={getFileUrl(order.designImage)} alt="Design"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    )}
                    {order.images?.slice(0, 2).map((img, i) => (
                      <img key={i} src={getFileUrl(img.filePath || img.url)} alt={`Ref ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    ))}
                    {order.images?.length > 2 && (
                      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500 font-semibold">
                        +{order.images.length - 2}
                      </div>
                    )}
                  </div>
                )}

                {order.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Deadline: {new Date(order.deadline).toLocaleDateString('en-IN')}</span>
                    <span className={`ml-auto font-semibold ${daysLeft <= 5 ? 'text-red-500' : 'text-gray-600'}`}>
                      {daysLeft}d left
                    </span>
                  </div>
                )}

                {hasMyBid ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs text-green-600 font-bold flex items-center justify-between">
                      <span>✓ Your Bid: Rs.{myBids[order.id].amount}</span>
                      <span className="text-[10px] bg-green-100 px-2 py-0.5 rounded-full">{myBids[order.id].deliveryMethod}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">Expected by: {new Date(myBids[order.id].deliveryDate).toLocaleDateString('en-IN')}</p>
                    {myBids[order.id].message && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate italic">"{myBids[order.id].message}"</p>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setChatTarget({ orderId: order._realId || order.id, customerName: order.customer }) }}
                      className="w-full mt-2 py-1.5 bg-white border border-green-200 rounded-lg text-[10px] font-bold text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Chat with Customer
                    </button>
                  </div>
                ) : (
                  <Button fullWidth onClick={() => setSelected(order)}>
                    <Gavel className="w-4 h-4" /> Place Bid
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bid modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Place Bid`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleBid} disabled={!bidAmount || !deliveryDate || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Quotation'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Order hero card */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
              <div className="relative p-4">
                <p className="text-white/70 text-xs font-mono mb-1">{selected.id}</p>
                <h3 className="text-white font-black text-xl mb-3">{selected.item}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Fabric', value: selected.fabric },
                    { label: 'Customer', value: selected.customer },
                    { label: 'Deadline', value: selected.deadline ? new Date(selected.deadline).toLocaleDateString('en-IN') : 'N/A', highlight: true },
                  ].map(f => (
                    <div key={f.label} className="bg-white/15 rounded-xl p-2.5">
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">{f.label}</p>
                      <p className={`font-bold text-sm mt-0.5 ${f.highlight ? 'text-white' : 'text-white/90'}`}>{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Design & reference images in modal */}
            {(selected.designImage || selected.design || selected.designImageUrl || selected.images?.length > 0) && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Design & Reference Images</p>
                <div className="flex gap-3 flex-wrap">
                  {(selected.designImage || selected.design || selected.designImageUrl) && (
                    <div className="relative group">
                      <img src={getFileUrl(selected.designImage || selected.design || selected.designImageUrl)} alt="Design"
                        className="w-28 h-28 object-cover rounded-2xl border-2 border-purple-200 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                        onClick={() => window.open(getFileUrl(selected.designImage || selected.design || selected.designImageUrl), '_blank')} />
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Design</span>
                    </div>
                  )}
                  {selected.images?.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={getFileUrl(img.filePath || img.url || img)} alt={`Reference ${i + 1}`}
                        className="w-28 h-28 object-cover rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                        onClick={() => window.open(getFileUrl(img.filePath || img.url || img), '_blank')} />
                      <span className="absolute top-2 left-2 bg-gray-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Ref {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your offer section */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Offer</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Bid Amount (Rs.) *"
                  type="number"
                  placeholder="Enter your price"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  required
                />
                <Input
                  label="Est. Delivery Date *"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  max={selected?.deadline || ''}
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['Home Delivery', 'Pickup', 'Courier'].map(opt => (
                <button key={opt} type="button"
                  onClick={() => setDeliveryMethod(opt)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    deliveryMethod === opt
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Message to Customer</label>
              <textarea rows={3} placeholder="Explain your expertise, timeline, or special offer..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-gray-50 hover:bg-white transition-colors"
                value={bidMessage}
                onChange={e => setBidMessage(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Chat overlay */}
      {chatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatTarget(null)} />
          <div className="relative z-10">
            <ChatWindow
              orderId={chatTarget.orderId}
              recipientName={chatTarget.customerName}
              recipientRole="customer"
              onClose={() => setChatTarget(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
