import { useState, useEffect } from 'react'
import { DollarSign, Lock, Unlock, ArrowRight, CheckCircle, Clock } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { escrowService } from '../../services/escrowService'
import { customerOrders } from '../../services/mockData'

export default function EscrowManagement() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(!isDemo)
  const [actionLoading, setActionLoading] = useState(null)

  const loadData = async () => {
    if (isDemo) {
      // Demo: original mock/localStorage merge logic
      const storedEscrow = escrowService.getEscrowTransactions()
      const storedOrders = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
      const deliveredOrders = [...customerOrders, ...storedOrders].filter(o => o.status === 'delivered')
      const combined = [...storedEscrow]
      deliveredOrders.forEach(o => {
        if (!combined.find(e => e.orderId === o.id)) {
          combined.push({
            id: `MOCK-ESC-${o.id}`,
            orderId: o.id,
            amount: o.amount || 2000,
            commission: Math.round((o.amount || 2000) * 0.10),
            tailorPayout: (o.amount || 2000) - Math.round((o.amount || 2000) * 0.10),
            tailorName: o.selectedTailor || 'Demo Tailor',
            status: 'held',
            createdAt: o.placedOn || '2026-03-01'
          })
        }
      })
      setItems(combined)
      setLoading(false)
      return
    }

    // Real: fetch from API
    try {
      const res = await adminService.listEscrows()
      const data = res?.data || res || []
      const list = Array.isArray(data) ? data : (data.escrows || data.results || [])
      setItems(list.map(e => ({
        ...e,
        id: e.id || e._id,
        orderId: e.orderId || e.orderRef || '—',
        amount: parseFloat(e.totalAmount || e.amount || e.totalPaid || 0),
        commission: parseFloat(e.platformFee || e.commission || 0),
        tailorPayout: parseFloat(e.tailorAmount || e.tailorPayout || 0) || (parseFloat(e.totalAmount || e.amount || 0) - parseFloat(e.platformFee || e.commission || 0)),
        tailorName: e.order?.tailor?.name || e.tailorName || e.tailor || '—',
        status: e.status || 'held',
        orderStatus: e.order?.status || e.orderStatus || '—',
      })))
    } catch (err) {
      console.error('Failed to fetch escrows:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isDemo])

  const handleRelease = async (id) => {
    if (isDemo) {
      if (id.startsWith('MOCK-ESC-')) {
        setItems(prev => prev.map(t => t.id === id ? { ...t, status: 'released', releasedAt: new Date().toISOString() } : t))
      } else {
        escrowService.releasePayment(id)
        loadData()
      }
      alert('Payment released to tailor successfully!')
      return
    }

    setActionLoading(id)
    try {
      await adminService.releaseEscrow(id)
      setItems(prev => prev.map(t => (t.id === id || t._id === id) ? { ...t, status: 'released', releasedAt: new Date().toISOString() } : t))
      alert('Payment released to tailor successfully!')
    } catch (err) {
      console.error('Failed to release escrow:', err)
      const msg = err?.message || err?.raw?.message || 'Failed to release escrow. Please try again.'
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'orderId', label: 'Order ID', accessor: 'orderId', render: v => <span className="font-mono font-bold text-purple-600">{v}</span> },
    { key: 'tailor', label: 'Tailor', accessor: 'tailorName' },
    { key: 'amount', label: 'Total Paid', accessor: 'amount', render: v => `Rs.${Number(v || 0).toLocaleString()}` },
    { key: 'commission', label: 'Platform Fee', accessor: 'commission', render: v => <span className="text-red-500">-Rs.{Number(v || 0).toLocaleString()}</span> },
    { key: 'payout', label: 'Tailor Payout', accessor: 'tailorPayout', render: v => <span className="font-bold text-green-600">Rs.{Number(v || 0).toLocaleString()}</span> },
    { key: 'status', label: 'Status', accessor: 'status',
      render: v => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${v === 'released' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {v === 'released' ? 'Released' : 'Held In Escrow'}
        </span>
      )
    },
    { key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        row.status === 'held' && (
          row.orderStatus === 'delivered' ? (
            <Button size="sm" onClick={() => handleRelease(row.id || row._id)}
              loading={actionLoading === (row.id || row._id)}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1.5">
              <Unlock className="w-3 h-3" /> Release
            </Button>
          ) : (
            <span className="text-xs text-gray-400 italic">Awaiting delivery</span>
          )
        )
      )
    }
  ]

  const filtered = filter === 'All' ? items : items.filter(i => i.status === filter.toLowerCase())

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Escrow Financials</h2>
          <p className="text-gray-500 text-sm mt-1">Manage payments held in trust and release payouts to tailors.</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['All', 'Held', 'Released'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Held', value: items.filter(i=>i.status==='held').reduce((acc,curr)=>acc+(curr.amount||0), 0), color: 'text-amber-600', bg: 'bg-amber-50', icon: Lock },
           { label: 'Total Released', value: items.filter(i=>i.status==='released').reduce((acc,curr)=>acc+(curr.amount||0), 0), color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
           { label: 'Platform Revenue', value: items.reduce((acc,curr)=>acc+(curr.commission||0), 0), color: 'text-purple-600', bg: 'bg-purple-50', icon: DollarSign },
         ].map(s => (
           <div key={s.label} className={`${s.bg} rounded-3xl p-6 border border-gray-100 flex items-center gap-5`}>
              <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center ${s.color} shadow-sm`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>Rs.{s.value.toLocaleString()}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search by order or tailor..." />
      </div>
    </div>
  )
}
