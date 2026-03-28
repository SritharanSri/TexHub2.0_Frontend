import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, Calendar, ShoppingBag,
  AlertTriangle, Banknote, Clock, ShieldCheck,
  DollarSign, ExternalLink, MapPin, User
} from 'lucide-react'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()

  const [activeTab, setActiveTab] = useState('orders')
  const [orderFilter, setOrderFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const [customerUser, setCustomerUser] = useState(null)
  const [allOrders, setAllOrders] = useState([])
  const [customerComplaints, setCustomerComplaints] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, ordersRes, paymentsRes, complaintsRes] = await Promise.allSettled([
          adminService.getUserById(id),
          adminService.listOrders(),
          adminService.listPayments(),
          adminService.listComplaints(),
        ])

        if (userRes.status === 'fulfilled') {
          const data = userRes.value?.data || userRes.value
          const u = data?.user || data
          setCustomerUser(u ? {
            ...u,
            id: u.id || u._id,
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'customer',
            status: u.isSuspended ? 'suspended' : 'active',
            joined: u.createdAt || '',
            phone: u.phone || null,
            address: u.address || null,
          } : null)

          const customerId = u?.id || u?._id || id

          if (ordersRes.status === 'fulfilled') {
            const ordData = ordersRes.value?.data || ordersRes.value || []
            const ordList = Array.isArray(ordData) ? ordData : (ordData.orders || ordData.results || [])
            setAllOrders(ordList
              .filter(o => o.customerId === customerId || o.customer?.id === customerId)
              .map(o => ({
                ...o,
                id: o.id || o._id,
                item: o.clothType || o.category || '—',
                tailor: o.tailor?.name || o.tailorName || null,
                amount: o.payment?.amount || o.quotationAmount || null,
                status: o.status || 'pending_quotation',
              })))
          }

          if (paymentsRes.status === 'fulfilled') {
            const payData = paymentsRes.value?.data || paymentsRes.value || []
            const payList = Array.isArray(payData) ? payData : (payData.payments || payData.results || [])
            setPayments(payList
              .filter(p => p.payerId === customerId || p.payer?.id === customerId)
              .map(p => ({
                ...p,
                id: p.id || p._id,
                orderId: p.order?.orderNumber || p.orderId || '—',
                amount: p.amount || 0,
                status: p.status || 'pending',
              })))
          }

          if (complaintsRes.status === 'fulfilled') {
            const cmpData = complaintsRes.value?.data || complaintsRes.value || []
            const cmpList = Array.isArray(cmpData) ? cmpData : (cmpData.complaints || cmpData.results || [])
            setCustomerComplaints(cmpList
              .filter(c => c.complainantId === customerId || c.userId === customerId)
              .map(c => ({
                ...c,
                id: c.id || c._id,
                subject: c.subject || c.title || 'Complaint',
                message: c.message || c.description || '',
                against: c.respondent?.name || c.respondentName || '—',
                orderId: c.orderId || '—',
                status: c.status || 'open',
              })))
          }
        }
      } catch (err) {
        console.error('Failed to fetch customer details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!customerUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">Customer not found</p>
        <Button onClick={() => navigate('/admin/users')}>Back to Users</Button>
      </div>
    )
  }

  const totalSpent = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const filteredOrders = allOrders.filter(o => {
    if (orderFilter === 'pending') return o.status !== 'delivered' && o.status !== 'completed'
    if (orderFilter === 'completed') return o.status === 'delivered' || o.status === 'completed'
    return true
  })

  const filteredPayments = payments.filter(p => {
    if (paymentFilter === 'approved') return p.status === 'approved'
    if (paymentFilter === 'pending') return p.status === 'pending_verification' || p.status === 'pending'
    return true
  })

  const statusLabel = {
    pending_quotation: 'Submitted', quotation_received: 'Bids Received',
    payment_pending: 'Awaiting Payment', confirmed: 'Confirmed',
    in_work: 'In Progress', dispatched: 'Dispatched', delivered: 'Delivered',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/users')} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-100">
            {(customerUser.name || 'C').charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">{customerUser.name}</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={customerUser.status} />
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Customer</span>
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Calendar className="w-3 h-3" /> Joined {customerUser.joined ? new Date(customerUser.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={customerUser.status === 'active' ? 'danger' : 'secondary'} size="sm">
            {customerUser.status === 'active' ? 'Suspend Account' : 'Restore Account'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-dark rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
            <div className="relative z-10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Customer Snapshot</h3>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-2xl font-black">{allOrders.length}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-black flex items-center gap-1">
                    <Banknote className="w-4 h-4" />{totalSpent.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Spent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Contact Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-2xl">
                <Mail className="w-4 h-4 text-gray-400" /> {customerUser.email}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-2xl">
                <Phone className="w-4 h-4 text-gray-400" /> {customerUser.phone || 'Not provided'}
              </div>
              {customerUser.address && (
                <div className="flex items-start gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-2xl">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> {customerUser.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 p-2 gap-2 bg-gray-50/50">
              {[
                { id: 'orders', icon: ShoppingBag, label: 'Order History' },
                { id: 'payments', icon: Banknote, label: 'Payments' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === t.id
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'orders' ? (
                <div className="space-y-6">
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    {[
                      { id: 'all', label: 'All Orders' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'completed', label: 'Completed' },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setOrderFilter(st.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          orderFilter === st.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredOrders.map(o => (
                      <div key={o.id} className="group relative bg-white border border-gray-100 p-4 rounded-2xl transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-black text-gray-900">{o.item} · <span className="text-blue-600 font-mono text-xs">{o.orderNumber || o.id}</span></p>
                              <p className="text-xs text-gray-400 font-medium">Tailor: {o.tailor || 'Not assigned'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-black text-gray-900">{o.amount ? `Rs.${Number(o.amount).toLocaleString()}` : '—'}</p>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                o.status === 'in_work' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {statusLabel[o.status] || o.status}
                              </span>
                            </div>
                            <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredOrders.length === 0 && (
                      <div className="flex flex-col items-center py-12 text-gray-400 italic">
                        <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                        <p>No orders found.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    {[
                      { id: 'all', label: 'All Payments' },
                      { id: 'approved', label: 'Approved' },
                      { id: 'pending', label: 'Pending' },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setPaymentFilter(st.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          paymentFilter === st.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl transition-all hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                            p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.status === 'approved' ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-black text-gray-900">Order {p.orderId}</p>
                            <p className="text-xs text-gray-400 font-medium">Ref: {p.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-gray-900">Rs.{Number(p.amount).toLocaleString()}</p>
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="flex flex-col items-center py-12 text-gray-400 italic">
                        <DollarSign className="w-10 h-10 mb-2 opacity-20" />
                        <p>No payment records found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Complaints */}
          {customerComplaints.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
              <h3 className="text-red-900 font-black flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Complaints Filed ({customerComplaints.length})
              </h3>
              <div className="space-y-3">
                {customerComplaints.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900 text-sm">{c.subject}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 italic">"{c.message}"</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Against: {c.against}</p>
                      <button onClick={() => navigate('/admin/complaints')} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
