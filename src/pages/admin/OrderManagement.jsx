import { useState, useEffect } from 'react'
import { Package, Eye, ShoppingBag, User, Scissors, Palette, Hash, DollarSign } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { customerOrders as mockCustomerOrders } from '../../services/mockData'

const statusLabel = {
  pending_quotation:  'Submitted', quotation_received: 'Bids Received',
  payment_pending:    'Awaiting Payment', confirmed: 'Confirmed',
  in_work: 'In Progress', dispatched: 'Dispatched', delivered: 'Delivered',
}
const statusColors = {
  pending_quotation:  'bg-yellow-100 text-yellow-700',
  quotation_received: 'bg-purple-100 text-purple-700',
  payment_pending:    'bg-orange-100 text-orange-700',
  confirmed:          'bg-blue-100 text-blue-700',
  in_work:            'bg-indigo-100 text-indigo-700',
  dispatched:         'bg-cyan-100 text-cyan-700',
  delivered:          'bg-green-100 text-green-700',
}

export default function OrderManagement() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [allOrders, setAllOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(!isDemo)

  useEffect(() => {
    if (isDemo) {
      // Demo: use mock data with admin-visible extensions
      const orders = mockCustomerOrders.map((o, i) => ({
        ...o,
        customer: ['Priya Sharma', 'Rahul Singh', 'Arjun Mehta', 'Meena Devi', 'Karthik P'][i % 5],
        amount: o.amount || null,
      }))
      setAllOrders(orders)
      return
    }

    const fetchOrders = async () => {
      try {
        const res = await adminService.listOrders()
        const list = Array.isArray(res) ? res : (res?.data || res?.orders || res?.results || [])
        setAllOrders(list.map(o => ({
          ...o,
          id: o.id || o._id,
          item: o.clothType || o.category || '—',
          customer: o.customer?.name || o.customerName || '—',
          selectedTailor: o.tailor?.name || o.tailorName || null,
          amount: o.payment?.amount || o.quotationAmount || null,
          status: o.status || 'pending_quotation',
          fabric: o.material || '—',
          color: o.color || '—',
          category: o.category || o.clothType || '—',
        })))
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setAllOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isDemo])

  const statuses = ['All', 'In Progress', 'Dispatched', 'Delivered']
  const filtered = filter === 'All' ? allOrders :
    filter === 'In Progress' ? allOrders.filter(o => o.status === 'in_work') :
    filter === 'Dispatched'  ? allOrders.filter(o => o.status === 'dispatched') :
    allOrders.filter(o => o.status === 'delivered')

  const columns = [
    { key: 'id',       label: 'Order ID', accessor: 'id',
      render: v => <span className="font-mono text-purple-600 text-xs font-semibold">{v}</span> },
    { key: 'item',     label: 'Item',     accessor: 'item', render: v => <span className="font-semibold">{v}</span> },
    { key: 'customer', label: 'Customer', accessor: 'customer' },
    { key: 'tailor',   label: 'Tailor',   accessor: 'selectedTailor', render: v => v || <span className="text-gray-300">—</span> },
    { key: 'amount',   label: 'Amount',   accessor: 'amount', render: v => v ? `Rs.${Number(v).toLocaleString()}` : '—' },
    { key: 'status',   label: 'Status',   accessor: 'status',
      render: v => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[v] || 'bg-gray-100 text-gray-600'}`}>
          {statusLabel[v] || v}
        </span>
      )
    },
    { key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
          <Eye className="w-3 h-3" /> View
        </Button>
      )
    },
  ]

  const summary = [
    { label: 'Total Orders', value: allOrders.length, color: 'text-gray-800', bg: 'bg-gray-100' },
    { label: 'In Progress',  value: allOrders.filter(o=>o.status==='in_work').length, color: 'text-blue-700', bg: 'bg-blue-100' },
    { label: 'Dispatched',   value: allOrders.filter(o=>o.status==='dispatched').length, color: 'text-cyan-700', bg: 'bg-cyan-100' },
    { label: 'Delivered',    value: allOrders.filter(o=>o.status==='delivered').length, color: 'text-green-700', bg: 'bg-green-100' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Order Management</h2>
        <p className="text-gray-500 text-sm mt-1">All orders across the platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === s ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search orders..." emptyMessage="No orders found" />
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)}
        title={`Order — ${selected?.id}`} size="md"
        footer={<Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>}>
        {selected && (
          <div className="space-y-4">
            {/* Status hero */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl p-4 border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{selected.item}</p>
                <p className="text-sm text-gray-400">{selected.category}</p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColors[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[selected.status] || selected.status}
                </span>
              </div>
            </div>
            {/* Field rows */}
            <div className="divide-y divide-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {[
                [User, 'Customer', selected.customer],
                [Scissors, 'Tailor', selected.selectedTailor || '—'],
                [Palette, 'Fabric', `${selected.fabric}${selected.color ? ' · ' + selected.color : ''}`],
                [DollarSign, 'Amount', selected.amount ? `Rs.${Number(selected.amount).toLocaleString()}` : '—'],
              ].map(([Icon, label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
