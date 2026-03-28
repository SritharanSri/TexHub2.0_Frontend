import { useState } from 'react'
import { Users, TrendingUp, ShoppingBag, Banknote, Search, MoreVertical } from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import { adminUsers } from '../services/mockData'

const tabs = ['All Users', 'Tailors', 'Customers']

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('All Users')
  const [actionUser, setActionUser] = useState(null)

  const filtered = activeTab === 'Tailors'
    ? adminUsers.filter(u => u.role === 'tailor')
    : activeTab === 'Customers'
      ? adminUsers.filter(u => u.role === 'customer')
      : adminUsers

  const columns = [
    { key: 'id', label: 'User ID', accessor: 'id',
      render: v => <span className="font-mono text-purple-600 text-xs font-semibold">{v}</span> },
    { key: 'name', label: 'Name', accessor: 'name',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
            {v.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{v}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Role', accessor: 'role',
      render: v => <StatusBadge status={v} /> },
    { key: 'orders', label: 'Orders', accessor: 'orders',
      render: v => <span className="font-semibold">{v}</span> },
    { key: 'joined', label: 'Joined', accessor: 'joined',
      render: v => <span className="text-gray-500 text-sm">{new Date(v).toLocaleDateString('en-IN')}</span> },
    { key: 'status', label: 'Status', accessor: 'status',
      render: v => <StatusBadge status={v} /> },
    { key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">Edit</Button>
          <Button size="sm" variant="danger">Ban</Button>
        </div>
      )
    },
  ]

  const adminStats = [
    { icon: Users, label: 'Total Users', value: adminUsers.length, color: 'text-purple-600', bg: 'bg-purple-100' },
    { icon: TrendingUp, label: 'Active Tailors', value: adminUsers.filter(u=>u.role==='tailor'&&u.status==='active').length, color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: ShoppingBag, label: 'Total Orders', value: adminUsers.reduce((s,u)=>s+u.orders,0), color: 'text-green-600', bg: 'bg-green-100' },
    { icon: Banknote, label: 'Platform Revenue', value: 'Rs.1.2L', color: 'text-amber-600', bg: 'bg-amber-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Admin Panel</h2>
          <p className="text-gray-500 text-sm">Manage users, orders, and platform settings</p>
        </div>
        <Button>
          <Users className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User management */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">User Management</h3>
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === t ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search users by name or email..."
          emptyMessage="No users found"
        />
      </div>
    </div>
  )
}
