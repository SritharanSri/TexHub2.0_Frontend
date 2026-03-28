import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Mail, Calendar, Briefcase,
  ShoppingBag, CheckCircle, AlertTriangle, Banknote,
  Star, Clock, ShieldCheck, DollarSign, ExternalLink, FileText
} from 'lucide-react'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { getFileUrl } from '../../services/api'
import { adminUsers as mockAdminUsers, customerOrders as mockCustomerOrders, complaints as mockComplaints } from '../../services/mockData'
import { escrowService } from '../../services/escrowService'

export default function TailorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const isDemo = authUser?._demo === true

  const [activeTab, setActiveTab] = useState('orders')
  const [orderFilter, setOrderFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [loading, setLoading] = useState(!isDemo)

  // State for API data
  const [tailorUser, setTailorUser] = useState(null)
  const [allOrders, setAllOrders] = useState([])
  const [tailorComplaints, setTailorComplaints] = useState([])
  const [escrowTransactions, setEscrowTransactions] = useState([])

  useEffect(() => {
    if (isDemo) {
      // Demo: use mock data
      const mockUser = mockAdminUsers.find(u => u.id === id)
      setTailorUser(mockUser || null)

      if (mockUser) {
        const storedOrders = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
        setAllOrders([...mockCustomerOrders, ...storedOrders].filter(o => o.selectedTailor === mockUser.name))
        setTailorComplaints(mockComplaints.filter(c => c.against === mockUser.name))
        setEscrowTransactions(escrowService.getEscrowTransactions().filter(t => t.tailorName === mockUser.name))
      }
      return
    }

    // Real: fetch from API
    const fetchData = async () => {
      try {
        const [userRes, ordersRes, escrowRes, complaintsRes] = await Promise.allSettled([
          adminService.getUserById(id),
          adminService.listOrders(),
          adminService.listEscrows(),
          adminService.listComplaints(),
        ])

        // Process user
        if (userRes.status === 'fulfilled') {
          const data = userRes.value?.data || userRes.value
          const u = data?.user || data
          const tp = u?.tailorProfile || {}
          setTailorUser(u ? {
            ...u,
            id: u.id || u._id,
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || tp.shopPhone || '',
            role: u.role || 'tailor',
            status: u.status || 'active',
            orders: u.orders ?? u.orderCount ?? 0,
            joined: u.joined || u.createdAt || '',
            nicFront: tp.nicFront || null,
            nicBack: tp.nicBack || null,
            nicNumber: tp.nicNumber || '',
            shopName: tp.shopName || '',
            shopAddress: tp.shopAddress || '',
            shopPhone: tp.shopPhone || '',
            specialization: tp.specialization || '',
            experience: tp.experience || '',
            bio: tp.bio || '',
            verificationStatus: tp.verificationStatus || 'pending',
            verificationNote: tp.verificationNote || '',
            avgRating: tp.avgRating ?? 0,
            totalRatings: tp.totalRatings ?? 0,
          } : null)

          // Process orders filtered by tailor
          if (ordersRes.status === 'fulfilled') {
            const ordData = ordersRes.value?.data || ordersRes.value || []
            const ordList = Array.isArray(ordData) ? ordData : (ordData.orders || ordData.results || [])
            const tailorName = u?.name || ''
            const tailorId = u?.id || u?._id || id
            setAllOrders(ordList
              .filter(o => o.selectedTailor === tailorName || o.tailorName === tailorName || o.tailorId === tailorId)
              .map(o => ({
                ...o,
                id: o.id || o._id,
                item: o.item || o.clothType || o.category || '—',
                fabric: o.fabric || '—',
                color: o.color || '—',
                amount: o.amount || o.totalAmount || null,
                status: o.status || 'pending',
              })))
          }

          // Process escrow filtered by tailor
          if (escrowRes.status === 'fulfilled') {
            const escData = escrowRes.value?.data || escrowRes.value || []
            const escList = Array.isArray(escData) ? escData : (escData.escrows || escData.results || [])
            const tailorName = u?.name || ''
            const tailorId = u?.id || u?._id || id
            setEscrowTransactions(escList
              .filter(e => e.tailorName === tailorName || e.tailor === tailorName || e.tailorId === tailorId)
              .map(e => ({
                ...e,
                id: e.id || e._id,
                orderId: e.orderId || e.orderRef || '—',
                tailorPayout: e.tailorPayout || (e.amount || 0) - (e.commission || 0),
                totalPaid: e.totalPaid || e.amount || 0,
                commission: e.commission || e.platformFee || 0,
                status: e.status || 'held',
              })))
          }

          // Process complaints filtered by tailor
          if (complaintsRes.status === 'fulfilled') {
            const cmpData = complaintsRes.value?.data || complaintsRes.value || []
            const cmpList = Array.isArray(cmpData) ? cmpData : (cmpData.complaints || cmpData.results || [])
            const tailorName = u?.name || ''
            setTailorComplaints(cmpList
              .filter(c => c.against === tailorName || c.respondentName === tailorName || c.respondentId === (u?.id || u?._id || id))
              .map(c => ({
                ...c,
                id: c.id || c._id,
                subject: c.subject || c.title || 'Complaint',
                message: c.message || c.description || '',
                from: c.from || c.filedBy || c.complainantName || '—',
                orderId: c.orderId || c.orderRef || '—',
                status: c.status || 'open',
              })))
          }
        }
      } catch (err) {
        console.error('Failed to fetch tailor details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, isDemo])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tailorUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 mb-4">Tailor not found</p>
        <Button onClick={() => navigate('/admin/users')}>Back to Users</Button>
      </div>
    )
  }

  // Derive extra details for the rich view
  const shopDetails = {
    shopName: tailorUser.shopName || `${tailorUser.name}'s Shop`,
    address: tailorUser.shopAddress || '—',
    specialization: tailorUser.specialization || '—',
    experience: tailorUser.experience ? `${tailorUser.experience} Years` : '—',
    completedOrders: tailorUser.orders ?? 0,
    rating: Number(tailorUser.avgRating) || 0,
  }

  // Filter orders
  const filteredOrders = allOrders.filter(o => {
    if (orderFilter === 'pending') return o.status !== 'delivered' && o.status !== 'completed'
    if (orderFilter === 'completed') return o.status === 'delivered' || o.status === 'completed'
    if (orderFilter === 'reported') return tailorComplaints.some(c => c.orderId === o.id)
    return true
  })

  // Filter payments
  const filteredPayments = escrowTransactions.filter(t => {
    if (paymentFilter === 'held') return t.status === 'held'
    if (paymentFilter === 'released') return t.status === 'released'
    return true
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/users')} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-100">
            {(tailorUser.name || 'T').charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">{tailorUser.name}</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={tailorUser.status} />
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Calendar className="w-3 h-3" /> Joined {tailorUser.joined ? new Date(tailorUser.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" size="sm">Suspend Account</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Profile Card */}
        <div className="space-y-6">
          <div className="bg-dark rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-600/20 blur-3xl rounded-full" />
            <div className="relative z-10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400">Business Snapshot</h3>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-2xl font-black">{shopDetails.completedOrders}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-black flex items-center gap-1">{shopDetails.rating}<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /></p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Details */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" /> Shop Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Name</p>
                <p className="font-bold text-gray-800">{shopDetails.shopName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Address</p>
                <p className="text-sm font-medium text-gray-600 flex items-start gap-1"><MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> {shopDetails.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Specialization</p>
                <p className="text-sm font-medium text-gray-600">{shopDetails.specialization}</p>
              </div>
            </div>

            <hr className="border-gray-50" />

            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" /> Contact Details
            </h3>
            <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-2xl">
                  <Mail className="w-4 h-4 text-gray-400" /> {tailorUser.email}
               </div>
               <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-2xl">
                  <Phone className="w-4 h-4 text-gray-400" /> {tailorUser.phone || tailorUser.shopPhone || '—'}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 p-2 gap-2 bg-gray-50/50">
              {[
                { id: 'orders', icon: ShoppingBag, label: 'Order History' },
                { id: 'payments', icon: Banknote, label: 'Financial Transactions' },
                { id: 'verification', icon: FileText, label: 'Verification Docs' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === t.id
                    ? 'bg-white text-purple-600 shadow-sm border border-gray-100'
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
                  {/* Internal Sub-tabs */}
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    {[
                      { id: 'all', label: 'All Orders' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'reported', label: 'Reported' },
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
                      <div key={o.id || o._id} className="group relative bg-white border border-gray-100 p-4 rounded-2xl transition-all hover:border-purple-200 hover:shadow-lg hover:shadow-purple-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                               <p className="font-black text-gray-900">{o.item} · <span className="text-purple-600 font-mono text-xs">{o.id}</span></p>
                               <p className="text-xs text-gray-400 font-medium">{o.fabric} · {o.color}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-right">
                               <p className="font-black text-gray-900">Rs.{o.amount?.toLocaleString() || '—'}</p>
                               <StatusBadge status={o.status} />
                             </div>
                             <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-purple-600 transition-colors">
                               <ExternalLink className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                        {tailorComplaints.some(c => c.orderId === o.id) && (
                           <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase text-red-500 bg-red-50 py-1 px-3 rounded-lg w-fit">
                              <AlertTriangle className="w-3 h-3" /> Reported by Customer
                           </div>
                        )}
                      </div>
                    ))}
                    {filteredOrders.length === 0 && (
                      <div className="flex flex-col items-center py-12 text-gray-400 italic">
                        <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                        <p>No orders found for this selection.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="space-y-6">
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    {[
                      { id: 'all', label: 'All Payments' },
                      { id: 'held', label: 'Pending (Escrow)' },
                      { id: 'released', label: 'Released (Paid)' },
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
                    {filteredPayments.map(t => (
                      <div key={t.id || t._id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl transition-all hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                            t.status === 'released' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {t.status === 'released' ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-black text-gray-900">Order {t.orderId}</p>
                            <p className="text-xs text-gray-400 font-medium">Ref: {t.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">Rs.{Number(t.tailorPayout || 0).toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter line-through">Rs.{t.totalPaid}</span>
                             <span className="text-[10px] font-black text-purple-600 uppercase tracking-tighter">Fee: Rs.{t.commission}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="flex flex-col items-center py-12 text-gray-400 italic">
                        <DollarSign className="w-10 h-10 mb-2 opacity-20" />
                        <p>No financial records found.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    tailorUser.verificationStatus === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                    tailorUser.verificationStatus === 'rejected' ? 'bg-red-50 border-red-100' :
                    'bg-blue-50 border-blue-100'
                  }`}>
                    <ShieldCheck className={`w-5 h-5 ${
                      tailorUser.verificationStatus === 'approved' ? 'text-emerald-600' :
                      tailorUser.verificationStatus === 'rejected' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                    <p className={`text-xs font-bold uppercase tracking-widest leading-tight ${
                      tailorUser.verificationStatus === 'approved' ? 'text-emerald-900' :
                      tailorUser.verificationStatus === 'rejected' ? 'text-red-900' :
                      'text-blue-900'
                    }`}>
                      Verification Status: {tailorUser.verificationStatus?.charAt(0).toUpperCase() + tailorUser.verificationStatus?.slice(1) || 'Pending'}
                      {tailorUser.nicFront && tailorUser.nicBack ? ' · NIC Uploaded' : ' · NIC Not Uploaded'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">NIC Front</p>
                       <div className="group relative aspect-[1.6/1] rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                          {tailorUser.nicFront ? (
                            <img src={getFileUrl(tailorUser.nicFront)} alt="NIC Front" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 italic p-6 text-center">
                               <FileText className="w-10 h-10 mb-2 opacity-20" />
                               <p className="text-xs">NIC Front Not Uploaded</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button size="sm" variant="secondary" className="scale-90 shadow-2xl">View Original</Button>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">NIC Back</p>
                       <div className="group relative aspect-[1.6/1] rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                          {tailorUser.nicBack ? (
                            <img src={getFileUrl(tailorUser.nicBack)} alt="NIC Back" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 italic p-6 text-center">
                               <FileText className="w-10 h-10 mb-2 opacity-20" />
                               <p className="text-xs">NIC Back Not Uploaded</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button size="sm" variant="secondary" className="scale-90 shadow-2xl">View Original</Button>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                     <h4 className="font-black text-gray-900 mb-3 uppercase tracking-widest text-xs flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Compliance Notes
                     </h4>
                     <p className="text-sm text-gray-600 font-medium italic">
                        {tailorUser.verificationNote
                          ? `"${tailorUser.verificationNote}"`
                          : tailorUser.verificationStatus === 'approved'
                            ? `"Document verification was completed on ${tailorUser.joined ? new Date(tailorUser.joined).toLocaleDateString() : '—'}. NIC verified successfully."`
                            : '"No compliance notes available yet."'
                        }
                     </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reported Orders / Complaints Summary Card (Secondary) */}
          {tailorComplaints.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
              <h3 className="text-red-900 font-black flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Recent Complaints ({tailorComplaints.length})
              </h3>
              <div className="space-y-3">
                {tailorComplaints.map(c => (
                  <div key={c.id || c._id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900 text-sm">{c.subject}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 italic">"{c.message}"</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">— {c.from}</p>
                      <button onClick={() => navigate('/admin/complaints')} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Investigate</button>
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
