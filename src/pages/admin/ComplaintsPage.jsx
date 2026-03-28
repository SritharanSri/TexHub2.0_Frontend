import { useState, useEffect } from 'react'
import { MessageSquareWarning, CheckCircle, AlertTriangle, Eye, Gavel, Clock, ShieldAlert, ArrowUpCircle, User, FileText, Calendar, Hash, Scale, MessageCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { complaints as mockComplaints, customerOrders as mockCustomerOrders } from '../../services/mockData'
import { complaintService } from '../../services/complaintService'
import ChatWindow from '../../components/ui/ChatWindow'

const typeConfig = {
  complaint: { label: 'Complaint', color: 'bg-red-50 text-red-600 border border-red-200', icon: ShieldAlert, iconColor: 'text-red-500' },
  report:    { label: 'Report',    color: 'bg-amber-50 text-amber-600 border border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
}
const statusConfig = {
  open:      { label: 'Open',      color: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
  resolved:  { label: 'Resolved',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  escalated: { label: 'Escalated', color: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500' },
}

export default function ComplaintsPage() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [penaltyModal, setPenaltyModal] = useState(null)
  const [investigationOrder, setInvestigationOrder] = useState(null)
  const [loading, setLoading] = useState(!isDemo)
  const [actionLoading, setActionLoading] = useState(null)

  const loadData = async () => {
    if (isDemo) {
      setItems(complaintService.getComplaints())
      setLoading(false)
      return
    }

    try {
      const res = await adminService.listComplaints()
      const data = res?.data || res || []
      const list = Array.isArray(data) ? data : (data.complaints || data.results || [])
      setItems(list.map(c => ({
        ...c,
        id: c.id || c._id,
        type: c.type || 'complaint',
        from: c.complainant?.name || c.from || c.filedBy || c.complainantName || '—',
        fromRole: c.complainant?.role || c.fromRole || c.complainantRole || '—',
        against: c.accused?.name || c.against || c.respondentName || '—',
        subject: c.subject || c.title || 'Complaint',
        message: c.message || c.description || '',
        orderId: c.order?.orderNumber || c.orderId || c.orderRef || '—',
        _realOrderId: c.order?.id || c.orderId,
        date: c.date || c.createdAt || new Date().toISOString(),
        status: c.status || 'open',
        evidence: c.evidences?.map(e => e.url || e.filePath) || c.evidence || [],
      })))
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isDemo])

  const resolve = async (id) => {
    if (isDemo) {
      complaintService.resolve(id)
      loadData()
      setSelected(null)
      return
    }

    setActionLoading(id)
    try {
      await adminService.resolveComplaint(id, { status: 'resolved', resolution: 'Resolved by admin' })
      setItems(prev => prev.map(c => (c.id === id || c._id === id) ? { ...c, status: 'resolved' } : c))
      setSelected(null)
    } catch (err) {
      console.error('Failed to resolve complaint:', err)
      alert('Failed to resolve complaint. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const escalate = async (id) => {
    if (isDemo) {
      complaintService.escalate(id)
      loadData()
      setSelected(null)
      return
    }

    setActionLoading(id)
    try {
      await adminService.resolveComplaint(id, { status: 'escalated', resolution: 'Escalated for further review' })
      setItems(prev => prev.map(c => (c.id === id || c._id === id) ? { ...c, status: 'escalated' } : c))
      setSelected(null)
    } catch (err) {
      console.error('Failed to escalate complaint:', err)
      alert('Failed to escalate complaint. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const applyPenalty = async () => {
    if (isDemo) {
      // Demo: original localStorage-based penalty logic
      const { ratingService } = await import('../../services/ratingService')
      ratingService.applyLatePenalty(penaltyModal.against, penaltyModal.orderId)

      const storedOrders = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
      const combinedOrders = [...storedOrders]
      const currentOrder = combinedOrders.find(o => o.id === penaltyModal.orderId)
      if (currentOrder) {
        currentOrder.penaltyApplied = true
        currentOrder.serviceFee = Math.max(0, (currentOrder.serviceFee || 10) - 5)
      } else {
        const mockOrder = mockCustomerOrders.find(o => o.id === penaltyModal.orderId)
        if (mockOrder) {
          combinedOrders.push({
            ...mockOrder,
            penaltyApplied: true,
            serviceFee: Math.max(0, (mockOrder.serviceFee || 10) - 5)
          })
        }
      }
      localStorage.setItem('texhub_orders', JSON.stringify(combinedOrders))
      complaintService.updateStatus(penaltyModal.id, 'resolved', { penalized: true })
      loadData()
      setPenaltyModal(null)
      setSelected(null)
      return
    }

    // Real: backend handles penalties in rating system
    setActionLoading(penaltyModal?.id || penaltyModal?._id)
    try {
      const id = penaltyModal.id || penaltyModal._id
      await adminService.resolveComplaint(id, {
        status: 'resolved',
        resolution: 'Penalty applied to tailor',
      })
      setItems(prev => prev.map(c => (c.id === id || c._id === id) ? { ...c, status: 'resolved', penalized: true } : c))
      setPenaltyModal(null)
      setSelected(null)
    } catch (err) {
      console.error('Failed to apply penalty:', err)
      alert('Failed to apply penalty. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filter === 'All' ? items : items.filter(i => i.status === filter.toLowerCase())
  const openCount = items.filter(i => i.status === 'open').length
  const resolvedCount = items.filter(i => i.status === 'resolved').length
  const escalatedCount = items.filter(i => i.status === 'escalated').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Complaints & Reports</h2>
        <p className="text-gray-400 text-sm mt-1 font-medium">Manage disputes, investigate issues, and enforce platform quality standards.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Open Issues', count: openCount, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: Clock },
          { label: 'Resolved', count: resolvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle },
          { label: 'Escalated', count: escalatedCount, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', icon: ArrowUpCircle },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border ${s.border} flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${s.color} shadow-sm`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {[
          { key: 'All', count: items.length },
          { key: 'Open', count: openCount },
          { key: 'Resolved', count: resolvedCount },
          { key: 'Escalated', count: escalatedCount },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              filter === f.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f.key}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Complaint Cards */}
      <div className="space-y-4">
        {filtered.map(item => {
          const tc = typeConfig[item.type] || typeConfig.complaint
          const sc = statusConfig[item.status] || statusConfig.open
          const TypeIcon = tc.icon
          return (
            <div key={item.id || item._id}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                item.status === 'open' ? 'border-red-100 border-l-4 border-l-red-400' : 'border-gray-100'
              }`}>
              <div className="p-6">
                <div className="flex flex-wrap gap-4 items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'complaint' ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      <TypeIcon className={`w-5 h-5 ${tc.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{item.subject}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${tc.color}`}>{tc.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span className="font-medium text-gray-700">{item.from}</span>
                        </span>
                        {item.against && item.against !== 'System' && item.against !== '—' && (
                          <>
                            <span className="text-gray-300">→</span>
                            <span className="font-medium text-gray-700">{item.against}</span>
                          </>
                        )}
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono text-xs text-violet-600">{typeof item.orderId === 'string' ? item.orderId.slice(0, 8) + '...' : item.orderId}</span>
                        </span>
                      </div>
                      <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-sm text-gray-600 italic leading-relaxed">"{item.message}"</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setSelected(item)}
                      className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-gray-100"
                      title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setInvestigationOrder(item)}
                      className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border border-amber-100"
                      title="Investigate">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    {item.status === 'open' && (
                      <Button size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-xs font-bold px-4"
                        loading={actionLoading === (item.id || item._id)}
                        onClick={() => resolve(item.id || item._id)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <MessageSquareWarning className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-semibold">No complaints in this category</p>
            <p className="text-gray-300 text-sm mt-1">Issues will appear here when filed by users.</p>
          </div>
        )}
      </div>

       {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)}
        title={selected?.subject} size="md"
        footer={selected?.status === 'open' ? (
          <>
            <Button variant="secondary" onClick={() => setSelected(null)} className="text-sm">Cancel</Button>
            <Button variant="danger" className="text-sm"
              onClick={() => { setPenaltyModal(selected); setSelected(null) }}>
              <Scale className="w-3.5 h-3.5" /> Penalize
            </Button>
            <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50 text-sm"
              loading={actionLoading === (selected?.id || selected?._id)}
              onClick={() => escalate(selected.id || selected._id)}>
              <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-sm"
              loading={actionLoading === (selected?.id || selected?._id)}
              onClick={() => resolve(selected.id || selected._id)}>
              <CheckCircle className="w-3.5 h-3.5" /> Resolve
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setSelected(null)} className="text-sm">Close</Button>
        )}>
        {selected && (
          <div className="space-y-5">
            {selected.penalized && (
              <div className="bg-red-50 text-red-700 text-sm font-semibold p-4 rounded-2xl border border-red-200 flex items-center gap-3">
                <Scale className="w-5 h-5 flex-shrink-0" />
                <span>Penalty applied — Tailor rating reduced by 0.25 stars, service fee reduced by 5%.</span>
              </div>
            )}

            {/* Type + Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {(() => { const tc = typeConfig[selected.type] || typeConfig.complaint; const TypeIcon = tc.icon; return (
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${tc.color}`}>
                  <TypeIcon className={`w-3.5 h-3.5 ${tc.iconColor}`} />{tc.label}
                </span>
              )})()}
              {(() => { const sc = statusConfig[selected.status] || statusConfig.open; return (
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>{sc.label}
                </span>
              )})()}
            </div>

            {/* Field rows */}
            <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { icon: User, label: 'Filed By', value: selected.from },
                { icon: ShieldAlert, label: 'Role', value: selected.fromRole },
                { icon: User, label: 'Against', value: selected.against },
                { icon: Hash, label: 'Order', value: selected.orderId, mono: true },
                { icon: Calendar, label: 'Filed On', value: new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-gray-400 flex items-center gap-2.5">
                    <row.icon className="w-3.5 h-3.5" />
                    {row.label}
                  </span>
                  <span className={`text-sm font-semibold text-gray-800 ${row.mono ? 'font-mono text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed italic">"{selected.message}"</p>
              </div>
            </div>

            {selected.evidence && selected.evidence.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Evidence</p>
                <div className="flex flex-wrap gap-3">
                  {selected.evidence.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-violet-400 hover:scale-105 transition-all shadow-sm">
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setInvestigationOrder(selected); setSelected(null) }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 text-sm font-semibold hover:bg-amber-100 transition-colors">
              <MessageCircle className="w-4 h-4" /> View Chat History &amp; Investigate
            </button>
          </div>
        )}
      </Modal>

      {/* Penalty Modal */}
      <Modal isOpen={!!penaltyModal} onClose={() => setPenaltyModal(null)}
        title="Apply Penalty" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPenaltyModal(null)} className="text-sm">Cancel</Button>
            <Button variant="danger" className="text-sm"
              loading={actionLoading === (penaltyModal?.id || penaltyModal?._id)}
              onClick={applyPenalty}>
              <Scale className="w-3.5 h-3.5" /> Confirm Penalty
            </Button>
          </>
        }>
        {penaltyModal && (
          <div className="space-y-5 text-sm">
            {/* Impact overview */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-700" />
              <div className="relative p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-bold text-white text-base">Penalty Action</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-white/70 text-xs mb-1">Rating Impact</p>
                    <p className="text-white font-black text-xl">-0.25 ⭐</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-white/70 text-xs mb-1">Fee Reduction</p>
                    <p className="text-white font-black text-xl">-5%</p>
                  </div>
                </div>
                <p className="text-white/70 text-xs mt-3 text-center">
                  Applied to order <span className="font-mono font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">{penaltyModal.orderId}</span>
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Notice to Tailor</label>
              <textarea rows={3} placeholder="Explain the reason for this penalty..."
                defaultValue="Your rating has been adjusted due to a valid customer complaint regarding standard guidelines violation."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-gray-50 hover:bg-white transition-colors" />
            </div>
          </div>
        )}
      </Modal>

      {/* Investigation Modal (Chat Log) */}
      {investigationOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <ChatWindow
            orderId={investigationOrder._realOrderId || investigationOrder.orderId}
            recipientName={investigationOrder.against}
            recipientRole="System Investigation"
            onClose={() => setInvestigationOrder(null)}
          />
        </div>
      )}
    </div>
  )
}
