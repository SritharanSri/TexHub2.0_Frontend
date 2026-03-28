import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ShieldOff, ShieldCheck, Search, DollarSign } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { adminUsers as mockAdminUsers } from '../../services/mockData'
import { Eye } from 'lucide-react'

export default function UserManagement() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [users, setUsers] = useState(isDemo ? mockAdminUsers : [])
  const [activeTab, setActiveTab] = useState('All')
  const [confirmModal, setConfirmModal] = useState(null)
  const [loading, setLoading] = useState(!isDemo)
  const [actionLoading, setActionLoading] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isDemo) return

    const fetchUsers = async () => {
      try {
        const res = await adminService.listUsers()
        const data = res?.data || res || []
        const list = Array.isArray(data) ? data : (data.users || data.results || [])
        setUsers(list.map(u => ({
          ...u,
          id: u.id || u._id,
          orders: u.orders ?? u.orderCount ?? 0,
          joined: u.joined || u.createdAt || '',
          status: u.status || 'active',
        })))
      } catch (err) {
        console.error('Failed to fetch users:', err)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isDemo])

  const tabs = ['All', 'Tailors', 'Customers', 'Suspended']
  const filtered =
    activeTab === 'Tailors'    ? users.filter(u => u.role === 'tailor') :
    activeTab === 'Customers'  ? users.filter(u => u.role === 'customer') :
    activeTab === 'Suspended'  ? users.filter(u => u.status === 'suspended') :
    users

  const toggleStatus = async (id) => {
    if (isDemo) {
      setUsers(u => u.map(x => x.id === id
        ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' }
        : x
      ))
      setConfirmModal(null)
      return
    }

    setActionLoading(id)
    try {
      await adminService.toggleSuspend(id)
      setUsers(u => u.map(x => (x.id === id || x._id === id)
        ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' }
        : x
      ))
      setConfirmModal(null)
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      alert('Failed to update user status. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'id',     label: 'ID',     accessor: 'id', render: v => <span className="font-mono text-purple-600 text-xs">{v}</span> },
    { key: 'name',   label: 'User',   accessor: 'name',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {(v || '?').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{v}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role',    label: 'Role',    accessor: 'role',   render: v => <StatusBadge status={v} /> },
    { key: 'orders',  label: 'Orders',  accessor: 'orders', render: v => <span className="font-semibold">{v}</span> },
    { key: 'joined',  label: 'Joined',  accessor: 'joined', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'status',  label: 'Status',  accessor: 'status', render: v => <StatusBadge status={v} /> },
    { key: 'actions', label: '',        sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          {row.role === 'tailor' && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/tailors/${row.id || row._id}`)}>
              <Eye className="w-3 h-3" /> View
            </Button>
          )}
          {row.role === 'customer' && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/customers/${row.id || row._id}`)}>
              <Eye className="w-3 h-3" /> View
            </Button>
          )}
          <Button size="sm" variant={row.status === 'active' ? 'danger' : 'secondary'}
            onClick={() => setConfirmModal(row)}>
            {row.status === 'active' ? <><ShieldOff className="w-3 h-3" /> Suspend</> : <><ShieldCheck className="w-3 h-3" /> Restore</>}
          </Button>
        </div>
      ),
    },
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">User Management</h2>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: users.length, color: 'text-gray-800', bg: 'bg-gray-100' },
          { label: 'Tailors', value: users.filter(u=>u.role==='tailor').length, color: 'text-purple-700', bg: 'bg-purple-100' },
          { label: 'Customers', value: users.filter(u=>u.role==='customer').length, color: 'text-blue-700', bg: 'bg-blue-100' },
          { label: 'Suspended', value: users.filter(u=>u.status==='suspended').length, color: 'text-red-700', bg: 'bg-red-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search by name or email..." emptyMessage="No users found" />
      </div>

      {/* Confirm suspend/restore */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}
        title={confirmModal?.status === 'active' ? 'Suspend Account' : 'Restore Account'} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant={confirmModal?.status === 'active' ? 'danger' : 'primary'}
              loading={actionLoading === (confirmModal?.id || confirmModal?._id)}
              onClick={() => toggleStatus(confirmModal.id || confirmModal._id)}>
              {confirmModal?.status === 'active' ? 'Yes, Suspend' : 'Yes, Restore'}
            </Button>
          </>
        }>
        {confirmModal && (
          <div className="space-y-4">
            {/* User identity card */}
            <div className="flex items-center gap-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-md">
                {(confirmModal.name || '?').charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base truncate">{confirmModal.name}</p>
                <p className="text-sm text-gray-400 truncate">{confirmModal.email}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 mt-1 capitalize">{confirmModal.role}</span>
              </div>
            </div>
            {/* Consequence banner */}
            <div className={`flex gap-3 items-start rounded-xl px-4 py-3 border text-sm leading-relaxed ${
              confirmModal.status === 'active'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <span className="text-base flex-shrink-0">{confirmModal.status === 'active' ? '🚫' : '✅'}</span>
              <p>
                {confirmModal.status === 'active'
                  ? <><strong>{confirmModal.name}</strong> will immediately lose access to the platform and cannot log in.
                  </>: <><strong>{confirmModal.name}</strong> will regain full platform access and can resume activities.</>
                }
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
