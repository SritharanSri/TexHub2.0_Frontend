import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, Star, Check, MessageCircle, X, Trophy, CreditCard, Truck, Package, Loader2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ChatWindow from '../../components/ui/ChatWindow'
import { quotations as mockQuotations, customerOrders } from '../../services/mockData'
import StarRating from '../../components/ui/StarRating'
import { useAuth } from '../../hooks/useAuth'
import { orderService } from '../../services/orderService'
import { quotationService } from '../../services/quotationService'

const deliveryIcon = { 'Home Delivery': Truck, 'Pickup': Package }

export default function CustomerBidding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [acceptedBid, setAcceptedBid] = useState({})
  const [confirmBid, setConfirmBid] = useState(null)
  const [chatTarget, setChatTarget] = useState(null)
  const [ordersWithQuotations, setOrdersWithQuotations] = useState([])
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const isDemo = !!user?._demo

  useEffect(() => {
    if (isDemo) {
      // Demo users: keep hardcoded mock data
      const demoOrders = [
        {
          orderId: 'ORD-C01',
          item: 'Kurta',
          fabric: 'Cotton',
          budget: 1500,
          deadline: '2026-03-25',
          bids: mockQuotations,
        },
        {
          orderId: 'ORD-C07',
          item: 'Bridal Lehenga',
          fabric: 'Zari Silk',
          budget: 25000,
          deadline: '2026-04-15',
          bids: [
            { id: 'B4', orderId: 'ORD-C07', tailorName: 'Nirmala Devi',  tailorRating: 4.6, amount: 22000, deliveryDate: '2026-04-12', deliveryMethod: 'Home Delivery', message: 'Specialized in bridal lehenga with intricate zari work.' },
            { id: 'B5', orderId: 'ORD-C07', tailorName: 'Ravi Tailor',   tailorRating: 4.8, amount: 20000, deliveryDate: '2026-04-14', deliveryMethod: 'Pickup', message: 'Bridal discount applied. Free blouse included.' },
          ],
        },
      ]

      // Filter out completed orders
      const completedOrderIds = new Set(
        customerOrders.filter(o => o.status === 'delivered' || o.status === 'completed').map(o => o.id)
      )
      setOrdersWithQuotations(demoOrders.filter(o => !completedOrderIds.has(o.orderId)))
      return
    }

    // Real users: fetch orders with quotation_received status then load quotations
    let cancelled = false
    setLoading(true)
    orderService.getMyOrders({ status: 'quotation_received' })
      .then(async (res) => {
        if (cancelled) return
        const list = res.data || res || []
        const arr = Array.isArray(list) ? list : list.orders || []

        // For each order, fetch its quotations
        const ordersWithBids = await Promise.all(
          arr.map(async (order) => {
            try {
              const qRes = await quotationService.getForOrder(order.id)
              const quots = qRes.data || qRes || []
              const quotArr = Array.isArray(quots) ? quots : quots.quotations || []
              return {
                orderId: order.orderNumber || order.id,
                _backendOrderId: order.id,
                item: order.clothType || order.item || 'Custom Garment',
                fabric: order.material || order.fabric || '',
                budget: parseFloat(order.quotationAmount || order.budget) || 0,
                deadline: order.deadline || order.deliveryDate,
                bids: quotArr.map(q => ({
                  id: q.id,
                  _backendId: q.id,
                  tailorId: q.tailorId || q.tailor?.id || null,
                  orderId: order.orderNumber || order.id,
                  tailorName: q.tailor?.name || q.tailorName || 'Unknown',
                  tailorRating: parseFloat(q.tailor?.tailorProfile?.avgRating || q.tailorRating) || 0,
                  amount: parseFloat(q.amount || q.price) || 0,
                  deliveryDate: q.deliveryDate || q.estimatedDelivery,
                  deliveryMethod: q.deliveryMethod || 'Home Delivery',
                  message: q.message || q.note || '',
                })),
              }
            } catch {
              return null
            }
          })
        )

        if (!cancelled) {
          setOrdersWithQuotations(ordersWithBids.filter(Boolean).filter(o => o.bids.length > 0))
        }
      })
      .catch(() => { /* silently fall back to empty */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isDemo])

  const handleAccept = async () => {
    if (!confirmBid) return

    if (isDemo) {
      setAcceptedBid(a => ({ ...a, [confirmBid.orderId]: confirmBid.bidId }))
      setConfirmBid(null)
      return
    }

    // Real users: call API to accept quotation
    setAccepting(true)
    try {
      await quotationService.accept(confirmBid.bidId)
      setAcceptedBid(a => ({ ...a, [confirmBid.orderId]: confirmBid.bidId }))
      setConfirmBid(null)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to accept quotation. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Tailor Quotations</h2>
          <p className="text-gray-500 text-sm mt-1">Review offers and select the best tailor for your order</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Gavel className="w-6 h-6 text-amber-600" />
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <div className="text-2xl">💡</div>
        <div>
          <p className="font-semibold text-blue-800 text-sm">How Quotations Work</p>
          <p className="text-blue-600 text-xs mt-0.5">
            Tailors review your order and submit price + delivery date + delivery method.
            Compare all offers, pick the best one, then confirm your order with payment.
          </p>
        </div>
      </div>

      {ordersWithQuotations.map(order => {
        const accepted = acceptedBid[order.orderId]
        const lowestBid = [...order.bids].sort((a, b) => a.amount - b.amount)[0]
        const earliestBid = [...order.bids].sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))[0]

        return (
          <div key={order.orderId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex flex-wrap gap-4 justify-between items-center">
              <div>
                <span className="font-mono text-xs text-white/70">{order.orderId}</span>
                <h3 className="text-white font-black text-xl">{order.item}</h3>
                <p className="text-white/70 text-sm">{order.fabric} · Due {new Date(order.deadline).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Your Budget</p>
                <p className="text-white font-black text-2xl">Rs.{order.budget.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6">
              {accepted ? (
                // Accepted state
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Quotation Accepted!</h4>
                  <p className="text-gray-500 text-sm">
                    You've selected <strong>{order.bids.find(b=>b.id===accepted)?.tailorName}</strong> for
                    Rs.{order.bids.find(b=>b.id===accepted)?.amount.toLocaleString()}.
                  </p>
                  <Button onClick={() => navigate('/customer/payment', { state: { orderId: order._backendOrderId || order.orderId } })} className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Proceed to Payment
                  </Button>
                </div>
              ) : (
                <>
                  {/* Best offers banner */}
                  <div className="flex gap-3 mb-5 flex-wrap">
                    <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 text-green-700 font-medium px-3 py-1.5 rounded-xl">
                      💰 Best price: Rs.{lowestBid.amount.toLocaleString()} by {lowestBid.tailorName}
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 font-medium px-3 py-1.5 rounded-xl">
                      ⚡ Earliest: {new Date(earliestBid.deliveryDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {/* Quotation cards */}
                  <div className="space-y-3">
                    {order.bids.map((bid, idx) => {
                      const DelivIcon = deliveryIcon[bid.deliveryMethod] || Package
                      return (
                        <div key={bid.id}
                          className={`relative rounded-2xl border-2 p-5 transition-all ${idx === 0 ? 'border-purple-200 bg-purple-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                          {idx === 0 && (
                            <div className="absolute -top-3 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" /> Lowest Price
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {bid.tailorName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{bid.tailorName}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <StarRating rating={bid.tailorRating} size="sm" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    {bid.tailorRating}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-purple-600">Rs.{bid.amount.toLocaleString()}</p>
                              <p className={`text-xs font-medium ${bid.amount < order.budget ? 'text-green-600' : 'text-gray-400'}`}>
                                {bid.amount < order.budget ? `Save Rs.${(order.budget - bid.amount).toLocaleString()}` : 'At budget'}
                              </p>
                            </div>
                          </div>

                          {/* Delivery details */}
                          <div className="flex gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <span className="text-base">📅</span> By {new Date(bid.deliveryDate).toLocaleDateString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <DelivIcon className="w-4 h-4" /> {bid.deliveryMethod}
                            </div>
                          </div>

                          <p className="mt-3 text-sm text-gray-600 bg-white rounded-xl p-3 border border-gray-100 italic">
                            "{bid.message}"
                          </p>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="secondary" className="flex-1 flex items-center justify-center gap-1.5"
                              onClick={() => setChatTarget({ orderId: order._backendOrderId || order.orderId, tailorName: bid.tailorName, tailorId: bid.tailorId })}>
                              <MessageCircle className="w-3.5 h-3.5" /> Message Tailor
                            </Button>
                            <Button size="sm" className="flex-1"
                              onClick={() => setConfirmBid({ orderId: order.orderId, bidId: bid.id, tailor: bid.tailorName, amount: bid.amount, deliveryDate: bid.deliveryDate })}>
                              <Check className="w-3.5 h-3.5" /> Select This Tailor
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* Chat overlay */}
      {chatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatTarget(null)} />
          <div className="relative z-10">
            <ChatWindow
              orderId={chatTarget.orderId}
              recipientName={chatTarget.tailorName}
              recipientRole="tailor"
              receiverId={chatTarget.tailorId}
              onClose={() => setChatTarget(null)}
            />
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <Modal isOpen={!!confirmBid} onClose={() => setConfirmBid(null)}
        title="Confirm Tailor Selection" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmBid(null)}>Cancel</Button>
            <Button onClick={handleAccept} loading={accepting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Check className="w-4 h-4" /> Yes, Select Tailor
            </Button>
          </>
        }>
        {confirmBid && (
          <div className="space-y-4">
            {/* Tailor profile hero */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
              <div className="relative flex items-center gap-4 p-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white font-black text-3xl flex-shrink-0 shadow-lg">
                  {confirmBid.tailor.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Selected Tailor</p>
                  <h3 className="font-black text-white text-xl leading-tight">{confirmBid.tailor}</h3>
                </div>
              </div>
            </div>
            {/* Deal summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Cost</p>
                <p className="font-black text-emerald-700 text-2xl">Rs.{confirmBid.amount.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-center">
                <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider mb-1">Expected By</p>
                <p className="font-black text-blue-700 text-sm">{new Date(confirmBid.deliveryDate).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            {/* Warning */}
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-base flex-shrink-0">&#9888;&#65039;</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                Other quotations will be dismissed. You&apos;ll be redirected to payment to finalize.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
