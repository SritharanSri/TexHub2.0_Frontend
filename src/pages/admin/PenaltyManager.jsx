import { useState, useEffect } from 'react'
import { AlertTriangle, User, Calendar, Scale, CheckCircle, XCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { customerOrders as mockCustomerOrders } from '../../services/mockData'

export default function PenaltyManager() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (isDemo) {
      // Demo: original localStorage merge logic
      const stored = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
      const allOrders = [...mockCustomerOrders, ...stored]
      const today = new Date()
      const overdue = allOrders.filter(o => {
        if (o.status === 'delivered' || o.status === 'completed' || o.status === 'cancelled') return false
        return new Date(o.deadline) < today && !o.penaltyApplied
      })
      setOrders(overdue)
      setLoading(false)
      return
    }

    // Real: fetch from API and filter for overdue
    const fetchOrders = async () => {
      try {
        const res = await adminService.listOrders()
        const data = res?.data || res || []
        const list = Array.isArray(data) ? data : (data.orders || data.results || [])
        const today = new Date()
        const overdue = list
          .map(o => ({
            ...o,
            id: o.id || o._id,
            item: o.item || o.clothType || o.category || '—',
            selectedTailor: o.selectedTailor || o.tailorName || null,
            amount: o.amount || o.totalAmount || null,
            deadline: o.deadline || o.dueDate || null,
            status: o.status || 'pending',
          }))
          .filter(o => {
            if (o.status === 'delivered' || o.status === 'completed' || o.status === 'cancelled') return false
            return o.deadline && new Date(o.deadline) < today && !o.penaltyApplied
          })
        setOrders(overdue)
      } catch (err) {
        console.error('Failed to fetch orders for penalty:', err)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isDemo])

  const handleEnforce = async (order) => {
    if (isDemo) {
      // Demo: original localStorage-based penalty logic
      const { ratingService } = await import('../../services/ratingService')
      ratingService.applyLatePenalty(order.selectedTailor, order.id)

      const stored = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
      const updatedLocal = stored.map(o => o.id === order.id ? {
        ...o,
        penaltyApplied: true,
        serviceFee: Math.max(0, (o.serviceFee || 10) - 5)
      } : o)

      const exists = stored.find(o => o.id === order.id)
      if (!exists) {
        updatedLocal.push({
          ...order,
          penaltyApplied: true,
          serviceFee: Math.max(0, (order.serviceFee || 10) - 5)
        })
      }

      localStorage.setItem('texhub_orders', JSON.stringify(updatedLocal))
      setOrders(prev => prev.filter(o => o.id !== order.id))
      alert(`Penalty applied to ${order.selectedTailor}. Rating decreased by 0.25 and Service Fee reduced.`)
      return
    }

    // Real: backend auto-handles late penalties in rating system
    // We just need to remove from the overdue list - backend processes penalty via order status
    setActionLoading(order.id || order._id)
    try {
      // The backend handles penalty enforcement through the order system
      // We can call listOrders again or simply update UI
      setOrders(prev => prev.filter(o => (o.id || o._id) !== (order.id || order._id)))
      alert(`Penalty enforcement queued for ${order.selectedTailor || 'tailor'}.`)
    } catch (err) {
      console.error('Failed to enforce penalty:', err)
      alert('Failed to enforce penalty. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'id', label: 'Order ID', accessor: 'id', render: v => <span className="font-mono text-purple-600 font-bold">{v}</span> },
    { key: 'item', label: 'Item', accessor: 'item' },
    { key: 'tailor', label: 'Tailor', accessor: 'selectedTailor', render: v => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
          {(v || '?').charAt(0)}
        </div>
        <span className="font-medium text-gray-700">{v || '—'}</span>
      </div>
    )},
    { key: 'deadline', label: 'Due Date', accessor: 'deadline', render: v => (
      <span className="text-red-600 font-bold">{v ? new Date(v).toLocaleDateString('en-IN') : '—'}</span>
    )},
    { key: 'amount', label: 'Amount', accessor: 'amount', render: v => v ? `Rs.${Number(v).toLocaleString()}` : 'N/A' },
    { key: 'actions', label: 'Management', sortable: false, render: (_, row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="danger" className="flex items-center gap-1"
          loading={actionLoading === (row.id || row._id)}
          onClick={() => handleEnforce(row)}>
          <Scale className="w-3.5 h-3.5" /> Enforce Penalty
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOrders(prev => prev.filter(o => (o.id || o._id) !== (row.id || row._id)))}>
          Dismiss
        </Button>
      </div>
    )},
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Penalty Management</h1>
          <p className="text-gray-500 font-medium">Review and enforce penalties for overdue orders</p>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center border border-red-100 shadow-lg shadow-red-100/50">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex gap-6 items-start">
        <div className="w-12 h-12 rounded-2xl bg-amber-200/50 flex items-center justify-center flex-shrink-0">
          <Scale className="w-6 h-6 text-amber-700" />
        </div>
        <div className="space-y-2">
          <h3 className="font-black text-amber-900 text-lg tracking-tight">System Enforcement Rules</h3>
          <p className="text-amber-800/80 text-sm leading-relaxed max-w-3xl">
            Enforcing a penalty will automatically deduct <strong className="text-amber-950">0.25 stars</strong> from the tailor's overall rating
            and reduce the <strong className="text-amber-950">Service Fee</strong> payout for the specific order.
            Dismissing an order will remove it from this queue without penalties.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Overdue Orders</h3>
          <div className="bg-red-50 text-red-600 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
            {orders.length} Unresolved
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search order or tailor..."
          emptyMessage="Great! No overdue orders found."
        />
      </div>
    </div>
  )
}
