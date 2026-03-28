import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Clock, CheckCircle, Gavel, Eye, Star, MessageCircle, AlertTriangle, UserX, Layers, Ruler, Truck } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ChatWindow from '../../components/ui/ChatWindow'
import StarRating from '../../components/ui/StarRating'
import { customerOrders as mockOrders } from '../../services/mockData'
import { orderService } from '../../services/orderService'
import { ratingService } from '../../services/ratingService'
import { complaintService } from '../../services/complaintService'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import ImageUploader from '../../components/order/ImageUploader'
import { getFileUrl } from '../../services/api'

// Local customerOrders removed to use centralized mockData.js

/* Map backend statuses to UI statuses */
const mapStatusToUI = (s) => {
  const map = {
    pending_quotation: 'bidding',
    quotation_received: 'bidding',
    payment_pending: 'pending',
    confirmed: 'process',
    in_work: 'process',
    dispatched: 'dispatched',
    delivered: 'completed',
    cancelled: 'completed',
  }
  return map[s] || s
}

const statusConfig = {
  pending:   { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700', icon: Clock,        iconBg: 'bg-yellow-100' },
  bidding:   { label: 'Awaiting Bid', color: 'bg-purple-100 text-purple-700', icon: Gavel,       iconBg: 'bg-purple-100' },
  process:   { label: 'In Progress', color: 'bg-blue-100 text-blue-700',    icon: Clock,        iconBg: 'bg-blue-100' },
  dispatched: { label: 'Dispatched',  color: 'bg-indigo-100 text-indigo-700', icon: Truck,       iconBg: 'bg-indigo-100' },
  completed: { label: 'Delivered',   color: 'bg-green-100 text-green-700',  icon: CheckCircle,  iconBg: 'bg-green-100' },
}

const ISSUE_CATEGORIES = [
  { id: 'Order issues', label: 'Size/Fit Issues', icon: Ruler, desc: 'Incorrect measurements or poor fitment.' },
  { id: 'Product quality', label: 'Product Quality', icon: Layers, desc: 'Issue with fabric, stitching, or finish.' },
  { id: 'Tailor behavior', label: 'Tailor Behavior', icon: UserX, desc: 'Communication or professionalism issues.' },
  { id: 'Delivery delay', label: 'Delivery Delay', icon: Clock, desc: 'Delivery exceeded the deadline.' },
]

export default function MyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [selected, setSelected] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [rateModal, setRateModal] = useState(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [complaintModal, setComplaintModal] = useState(null)
  const [complaintForm, setComplaintForm] = useState({ subject: 'Order issues', message: '', evidence: [] })
  const { user } = useAuth()

  const isDemo = !!user?._demo

  useEffect(() => {
    if (isDemo) {
      // Demo users: use mock data with normalization
      const normalizedMock = mockOrders.map(o => ({
        ...o,
        placed: o.placedOn || o.placed,
        tailor: o.selectedTailor || o.tailor,
        status: mapStatusToUI(o.status),
      }))
      setOrders(normalizedMock)
      return
    }

    // Real users: fetch from API
    let cancelled = false
    setLoading(true)
    orderService.getMyOrders({ page: 1, limit: 50 })
      .then(res => {
        if (cancelled) return
        const list = res.data || res || []
        const arr = Array.isArray(list) ? list : list.orders || []
        const mapped = arr.map(o => ({
          id: o.orderNumber || o.id,
          _backendId: o.id, // Keep the real UUID for API calls
          item: o.clothType || o.item || 'Custom Garment',
          fabric: o.material || o.fabric || '',
          status: mapStatusToUI(o.status),
          _rawStatus: o.status,
          placed: o.createdAt || o.placed || o.placedOn,
          deadline: o.deadline || o.deliveryDate,
          tailor: o.tailor?.name || o.tailor || null,
          _tailorId: o.tailorId || o.tailor?.id || null,
          amount: o.quotationAmount || o.amount || null,
          progress: o.progress || 0,
          rating: o.rating || null,
          category: o.category,
          quotationCount: o.quotationCount || 0,
        }))
        setOrders(mapped)
      })
      .catch(() => { /* silently fall back to empty */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isDemo])

  const tabs = ['All', 'Active', 'Completed', 'Bidding']
  const filtered = activeTab === 'All' ? orders
    : activeTab === 'Active' ? orders.filter(o => o.status === 'process' || o.status === 'pending' || o.status === 'dispatched')
    : activeTab === 'Completed' ? orders.filter(o => o.status === 'completed')
    : orders.filter(o => o.status === 'bidding')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">My Orders</h2>
          <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <Button onClick={() => navigate('/customer/place-order')}>+ New Order</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: orders.length, color: 'text-gray-800', bg: 'bg-gray-100' },
          { label: 'In Production', value: orders.filter(o=>o.status==='process').length, color: 'text-blue-700', bg: 'bg-blue-100' },
          { label: 'Dispatched', value: orders.filter(o=>o.status==='dispatched').length, color: 'text-indigo-700', bg: 'bg-indigo-100' },
          { label: 'Delivered', value: orders.filter(o=>o.status==='completed').length, color: 'text-green-700', bg: 'bg-green-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map(order => {
          const cfg = statusConfig[order.status] || statusConfig.pending
          const Icon = cfg.icon
          return (
            <div key={order.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/customer/orders/${order._backendId || order.id}`)}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{order.item}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{order.fabric} · <span className="font-mono text-xs text-purple-600">{order.id}</span></p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <span>📅 Placed {order.placed ? new Date(order.placed).toLocaleDateString('en-IN') : 'N/A'}</span>
                    <span>⏰ Due {order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN') : 'Not set'}</span>
                    {order.tailor && <span>✂️ {order.tailor}</span>}
                    {order.amount && <span className="font-semibold text-gray-800">Rs.{order.amount.toLocaleString()}</span>}
                    {order.status === 'bidding' && <span className="text-purple-600 font-medium">→ Review bids</span>}
                  </div>

                  {order.status === 'process' && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${order.progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-blue-600 w-8">{order.progress}%</span>
                    </div>
                  )}

                  {order.status === 'dispatched' && (
                    <div className="mt-3 flex items-center justify-between gap-3 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-indigo-700">Ready for collection & review</span>
                      </div>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-[10px] h-7 px-3" onClick={e => { e.stopPropagation(); setRateModal(order) }}>
                        Rate & Confirm
                      </Button>
                    </div>
                  )}

                  {order.status === 'completed' && order.rating && (
                    <div className="flex items-center justify-between mt-2">
                       <div className="flex items-center gap-1">
                        <StarRating rating={order.rating} size="sm" />
                        <span className="text-xs text-gray-400 ml-1">Your rating</span>
                      </div>
                      <button onClick={e => {
                        e.stopPropagation()
                        setRatingVal(order.rating)
                        setReviewText(order.review || '')
                        setRateModal(order)
                      }} className="text-[10px] font-bold text-purple-600 hover:text-purple-700 underline underline-offset-2">
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); navigate(`/customer/orders/${order._backendId || order.id}`) }}>
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)}
        title={`Order Details`} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            {selected?.status === 'bidding' && (
              <Button onClick={() => { setSelected(null); navigate('/customer/bids') }}>View Bids</Button>
            )}
            {selected?.tailor && selected?.status !== 'bidding' && (
              <Button onClick={() => setShowChat(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600">
                <MessageCircle className="w-4 h-4" /> Message Tailor
              </Button>
            )}
            {selected?.status === 'completed' && !selected.rating && (
              <Button variant="outline" onClick={() => {
                setRatingVal(5)
                setReviewText('')
                setRateModal(selected)
              }}>Rate Tailor</Button>
            )}
            {selected?.status === 'completed' && selected.rating && (
              <Button variant="outline" onClick={() => {
                setRatingVal(selected.rating)
                setReviewText(selected.review || '')
                setRateModal(selected)
              }}>Edit Rating</Button>
            )}
            {selected?.status === 'dispatched' && (
              <Button onClick={() => {
                setRatingVal(5)
                setReviewText('')
                setRateModal(selected)
              }} className="bg-purple-600">Rate & Confirm Receipt</Button>
            )}
            {selected?.tailor && (
               <Button variant="secondary" className="border-red-200 text-red-600 hover:bg-red-50" 
                 onClick={() => { setComplaintModal(selected); setSelected(null); }}>
                 Report Issue
               </Button>
            )}
          </>
        }>
        {selected && (
          <div className="space-y-4">
            {/* Status pill */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${statusConfig[selected.status]?.color}`}>
              {statusConfig[selected.status]?.label}
            </div>
            {/* Field rows */}
            <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {[
                ['Item', selected.item],
                ['Fabric', selected.fabric],
                ['Placed On', selected.placed ? new Date(selected.placed).toLocaleDateString('en-IN') : 'N/A'],
                ['Deadline', selected.deadline ? new Date(selected.deadline).toLocaleDateString('en-IN') : 'Not set'],
                ...(selected.tailor ? [['Tailor', selected.tailor]] : []),
                ...(selected.amount ? [['Amount', `Rs.${selected.amount.toLocaleString()}`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-gray-400">{k}</span>
                  <span className="text-sm font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            {/* Design & Reference Images */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Design & Reference</p>
              {!(selected.designImage || selected.design || selected.designImageUrl || selected.images?.length > 0) ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                  <span>🎨</span> No design or reference images provided.
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {(selected.designImage || selected.design || selected.designImageUrl) && (
                    <div className="relative group">
                      <img src={getFileUrl(selected.designImage || selected.design || selected.designImageUrl)} alt="Design"
                        className="w-24 h-24 object-cover rounded-2xl border-2 border-purple-200 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                        onClick={() => window.open(getFileUrl(selected.designImage || selected.design || selected.designImageUrl), '_blank')} />
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Design</span>
                    </div>
                  )}
                  {selected.images?.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={getFileUrl(img.filePath || img.url || img)} alt={`Reference ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-2xl border border-gray-200 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                        onClick={() => window.open(getFileUrl(img.filePath || img.url || img), '_blank')} />
                      <span className="absolute top-2 left-2 bg-gray-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">Ref {i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected.status === 'process' && (
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500 font-medium">Progress</span>
                  <span className="font-bold text-blue-600">{selected.progress}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all" style={{ width: `${selected.progress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Chat Modal Layer */}
      {showChat && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <ChatWindow 
            orderId={selected._backendId || selected.id}
            recipientName={selected.tailor}
            recipientRole="tailor"
            receiverId={selected._tailorId}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Rate Modal */}
      <Modal isOpen={!!rateModal} onClose={() => setRateModal(null)}
        title="Rate your Tailor" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRateModal(null)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (!isDemo) {
                  const orderId = rateModal._backendId || rateModal.id
                  await ratingService.create(orderId, { stars: ratingVal, review: reviewText })
                  
                  // If order was dispatched, mark as delivered upon rating
                  if (rateModal._rawStatus === 'dispatched') {
                    await orderService.updateStatus(orderId, 'delivered')
                  }
                }
                setOrders(prev => prev.map(o => o.id === rateModal.id ? { ...o, rating: ratingVal, review: reviewText, status: 'completed' } : o))
                setRateModal(null)
                setSelected(null)
                setRatingVal(5)
                setReviewText('')
              } catch (err) {
                alert(err?.response?.data?.message || 'Failed to submit rating. Please try again.')
              }
            }}>Submit Review</Button>
          </>
        }>
        {rateModal && (
          <div className="space-y-5">
            {/* Tailor avatar hero */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-purple-100">
                  {rateModal.tailor?.charAt(0) || 'T'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow text-xs">⭐</div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">{rateModal.tailor}</h3>
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
        )}
      </Modal>
      {/* Complaint Modal */}
      <Modal isOpen={!!complaintModal} onClose={() => setComplaintModal(null)}
        title="Report an Issue" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setComplaintModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              try {
                if (!isDemo) {
                  // Build FormData for backend
                  const fd = new FormData()
                  const orderId = complaintModal._backendId || complaintModal.id
                  fd.append('orderId', orderId)
                  fd.append('subject', complaintForm.subject)
                  fd.append('message', complaintForm.message)
                  if (complaintModal._tailorId) {
                    fd.append('againstUserId', complaintModal._tailorId)
                  }
                  if (complaintForm.evidence?.length) {
                    complaintForm.evidence.forEach(f => {
                      if (f.file instanceof File) {
                        fd.append('evidence', f.file)
                      } else if (f instanceof File) {
                        fd.append('evidence', f)
                      }
                    })
                  }
                  await complaintService.create(fd)
                }
                setComplaintModal(null)
                alert('Your complaint has been submitted and will be reviewed by our team.')
                setComplaintForm({ subject: 'Order issues', message: '', evidence: [] })
              } catch (err) {
                alert(err?.response?.data?.message || 'Failed to submit complaint. Please try again.')
              }
            }}>Submit Complaint</Button>
          </>
        }>
        {complaintModal && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Official Dispute</p>
                <p className="text-xs text-red-700 leading-relaxed mt-0.5">
                  Reporting <strong>{complaintModal.tailor}</strong> for Order <span className="font-mono">{complaintModal.id}</span>. Our team will review this investigation.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-black text-gray-900 block mb-3 uppercase tracking-wider">What's the issue?</label>
              <div className="grid grid-cols-2 gap-3">
                {ISSUE_CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  const isSelected = complaintForm.subject === cat.id
                  return (
                    <button key={cat.id} 
                      onClick={() => setComplaintForm(f => ({ ...f, subject: cat.id }))}
                      className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 text-center group
                        ${isSelected ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50/50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors 
                        ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-purple-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>{cat.label}</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{cat.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-gray-900 block uppercase tracking-wider">Details & Photos</label>
              <textarea rows={4} value={complaintForm.message} 
                onChange={e => setComplaintForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Please describe the issue in detail. Be as specific as possible to help us investigate faster..."
                className="input-field resize-none bg-gray-50 border-gray-100 hover:bg-white transition-colors" />
              
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <ImageUploader 
                  files={complaintForm.evidence} 
                  onChange={files => setComplaintForm(f => ({ ...f, evidence: files }))} 
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
