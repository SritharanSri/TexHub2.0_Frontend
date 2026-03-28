import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, AlertCircle, Loader2, PlayCircle, Eye, CheckCircle2 } from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'

// Map backend order to the shape the UI expects
function mapOrder(o) {
  return {
    ...o,
    id: o.orderNumber || o.id,
    _realId: o.id,
    item: o.clothType || o.item || 'Custom Garment',
    fabric: o.material || o.fabric || '',
    customer: o.customer?.name || o.customer || 'Guest',
    due: o.deadline || o.quotationDeliveryDate || o.dueDate || o.due || '',
    progress: o.progress || 0,
    amount: parseFloat(o.quotationAmount || o.amount || o.totalAmount) || 0,
    status: o.status || 'in_work',
  }
}

export default function OnProcess() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDemo = user?._demo

  const [newOrders, setNewOrders] = useState([]) // confirmed status
  const [activeOrders, setActiveOrders] = useState([]) // in_work, dispatched statuses
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [startingWork, setStartingWork] = useState(null)

  useEffect(() => {
    if (isDemo) {
      // Mock data in demo
      const mock = [
        { id: 'TEX-0001', orderNumber: 'TEX-0001', item: 'Silk Saree', customer: 'Anjali', status: 'confirmed', progress: 0, amount: 5000 },
        { id: 'TEX-0002', orderNumber: 'TEX-0002', item: 'Cotton Kurta', customer: 'Priya', status: 'in_work', progress: 45, amount: 1500 }
      ].map(mapOrder)
      setNewOrders(mock.filter(o => o.status === 'confirmed'))
      setActiveOrders(mock.filter(o => o.status !== 'confirmed'))
    } else {
      fetchOrders()
    }
  }, [isDemo])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch multiple statuses in a single call (backend now supports comma-separated string)
      const res = await orderService.getMyOrders({ status: 'confirmed,in_work,dispatched' })
      const payload = res.data || {}
      const rows = payload.data || payload.orders || (Array.isArray(payload) ? payload : [])
      const all = rows.map(mapOrder)
      
      setNewOrders(all.filter(o => o.status === 'confirmed'))
      setActiveOrders(all.filter(o => o.status !== 'confirmed'))
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError('Could not load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWork = async (order) => {
    if (isDemo) {
      setNewOrders(prev => prev.filter(o => o.id !== order.id))
      setActiveOrders(prev => [...prev, { ...order, status: 'in_work', progress: 5 }])
      return
    }
    setStartingWork(order.id)
    setError('')
    try {
      const orderId = order._realId || order.id
      await orderService.updateStatus(orderId, 'in_work')
      
      // Move from new to active
      setNewOrders(prev => prev.filter(o => o.id !== order.id))
      setActiveOrders(prev => [{ ...order, status: 'in_work', progress: 5 }, ...prev])
    } catch (err) {
      console.error('Failed to start work:', err)
      setError('Failed to start work on order. Please try again.')
    } finally {
      setStartingWork(null)
    }
  }

  const columns = [
    { key: 'id', label: 'Order ID', accessor: 'id',
      render: (v) => <span className="font-mono text-blue-600 font-semibold text-xs">{v}</span> },
    { key: 'customer', label: 'Customer', accessor: 'customer',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{(v || '?').charAt(0)}</div>
          <span className="font-medium text-gray-800">{v}</span>
        </div>
      )
    },
    { key: 'item', label: 'Item', accessor: 'item' },
    { key: 'due', label: 'Due Date', accessor: 'due',
      render: (v) => {
        if (!v) return <span className="text-gray-400">N/A</span>
        const daysLeft = Math.ceil((new Date(v) - new Date()) / 86400000)
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm whitespace-nowrap">{new Date(v).toLocaleDateString('en-IN')}</span>
            {daysLeft <= 2 && daysLeft >= 0 && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          </div>
        )
      }
    },
    { key: 'progress', label: 'Progress', accessor: 'progress',
      render: (v) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${v === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 w-8">{v}%</span>
        </div>
      )
    },
    { key: 'status', label: 'Status', accessor: 'status',
      render: (v) => <StatusBadge status={v === 'in_work' ? 'process' : v} />
    },
    { key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={(e) => {
            e.stopPropagation()
            navigate(`/orders/${row._realId || row.id}`)
          }} className="flex items-center gap-1.5 h-8">
            <Eye className="w-3.5 h-3.5" /> View
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-8" onClick={(e) => {
            e.stopPropagation()
            navigate(`/orders/${row._realId || row.id}`)
          }}>
            Update
          </Button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">On Process</h2>
          <p className="text-gray-500 text-sm mt-1">Manage ongoing work and pack finished orders</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* NEW ORDERS / READY TO START */}
      {newOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Ready to Start
              <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">{newOrders.length}</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newOrders.map(o => (
              <div key={o.id} className="bg-white rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/20 to-transparent p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{o.id}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">New Order</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Paid & Verified</span>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors truncate">{o.item}</h4>
                <p className="text-xs text-gray-500 mb-4">{o.customer}</p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => handleStartWork(o)}
                    loading={startingWork === o.id}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 flex items-center justify-center gap-2 py-2">
                    <PlayCircle className="w-4 h-4" /> Start Working
                  </Button>
                  <button onClick={() => navigate(`/orders/${o._realId || o.id}`)} 
                    className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors text-center py-1">
                    View Specs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE WORK TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 tracking-tight">
            Active Work
            {!loading && activeOrders.length > 0 && (
               <span className="text-xs font-normal text-gray-400">({activeOrders.length})</span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-blue-600 bg-white rounded-3xl border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-80" />
            <span className="text-sm font-medium text-gray-500">Loading your production floor...</span>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-800">No active work items</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Click "Start Working" on any ready order to see it here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-1">
            <DataTable
              columns={columns}
              data={activeOrders}
              searchPlaceholder="Search garments or customers..."
              onRowClick={(row) => navigate(`/orders/${row._realId || row.id}`)}
              pageSize={10}
            />
          </div>
        )}
      </div>
    </div>
  )
}
