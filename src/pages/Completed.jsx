import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Download, Loader2, AlertCircle, Eye } from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import { RatingStars } from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import { completedOrders as mockCompletedOrders } from '../services/mockData'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'

// Map backend order to the shape the UI expects
function mapOrder(o) {
  return {
    ...o,
    id: o.orderNumber || o.id,
    _realId: o.id,
    item: o.clothType || o.item || '',
    fabric: o.material || o.fabric || '',
    customer: o.customer?.name || o.customer || '',
    completed: o.completedAt || o.updatedAt || o.completedDate || o.completed || '',
    amount: o.quotationAmount || o.amount || o.totalAmount || 0,
    rating: o.rating?.stars || o.rating || 0,
    status: o.status || 'delivered',
  }
}

export default function Completed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDemo = user?._demo

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isDemo) {
      setOrders(mockCompletedOrders)
    } else {
      fetchOrders()
    }
  }, [isDemo])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await orderService.getMyOrders({ status: 'delivered' })
      const payload = res.data || {}
      const data = payload.data || payload.orders || payload
      setOrders(Array.isArray(data) ? data.map(mapOrder) : [])
    } catch (err) {
      console.error('Failed to fetch completed orders:', err)
      setError('Could not load completed orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.amount || 0), 0)
  const avgRating = orders.length > 0
    ? (orders.reduce((s, o) => s + (o.rating || 0), 0) / orders.length).toFixed(1)
    : '0.0'

  const columns = [
    { key: 'id', label: 'Order ID', accessor: 'id',
      render: (v) => <span className="font-mono text-green-600 font-semibold text-xs">{v}</span> },
    { key: 'customer', label: 'Customer', accessor: 'customer',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">{(v || '?').charAt(0)}</div>
          <span className="font-medium text-gray-800">{v}</span>
        </div>
      )
    },
    { key: 'item', label: 'Item', accessor: 'item' },
    { key: 'fabric', label: 'Fabric', accessor: 'fabric',
      render: (v) => <span className="text-gray-500">{v}</span> },
    { key: 'completed', label: 'Completed On', accessor: 'completed',
      render: (v) => <span className="text-gray-600">{v ? new Date(v).toLocaleDateString('en-IN') : 'N/A'}</span> },
    { key: 'amount', label: 'Amount', accessor: 'amount',
      render: (v) => <span className="font-semibold text-gray-800">Rs.{(v || 0).toLocaleString()}</span> },
    { key: 'rating', label: 'Rating', accessor: 'rating',
      render: (v) => <RatingStars rating={v || 0} /> },
    { key: 'status', label: 'Status', sortable: false,
      render: () => <StatusBadge status="completed" /> },
    { key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={(e) => {
          e.stopPropagation()
          navigate(`/orders/${row._realId || row.id}`)
        }}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Completed Orders</h2>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders successfully delivered</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
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
        <div className="flex items-center justify-center gap-2 py-12 text-green-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading completed orders...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Orders Completed', value: orders.length, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
              { label: 'Total Revenue', value: `Rs.${totalRevenue.toLocaleString()}`, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
              { label: 'Avg. Rating', value: `${avgRating} ⭐`, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {orders.length === 0 && !error && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-semibold">No completed orders yet</p>
              <p className="text-sm mt-1">Delivered orders will appear here.</p>
            </div>
          )}

          {orders.length > 0 && (
            <DataTable
              columns={columns}
              data={orders}
              searchPlaceholder="Search completed orders..."
              onRowClick={(row) => navigate(`/orders/${row._realId || row.id}`)}
            />
          )}
        </>
      )}
    </div>
  )
}
