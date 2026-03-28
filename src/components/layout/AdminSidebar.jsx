import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, UserCheck, Users, ShoppingBag,
  MessageSquareWarning, LogOut, X, Shield, DollarSign, Landmark, Settings, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'

export default function AdminSidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges] = useState({ pendingApprovals: 0, openComplaints: 0 })

  useEffect(() => {
    adminService.getDashboard()
      .then(res => {
        const d = res?.data || res || {}
        setBadges({
          pendingApprovals: d.pendingApprovals || 0,
          openComplaints: d.openComplaints || 0,
        })
      })
      .catch(() => {})
  }, [])

  const navItems = [
    { to: '/admin/dashboard',    icon: LayoutDashboard,       label: 'Dashboard' },
    { to: '/admin/approvals',    icon: UserCheck,             label: 'Tailor Approvals', badge: badges.pendingApprovals },
    { to: '/admin/users',        icon: Users,                 label: 'User Management' },
    { to: '/admin/orders',       icon: ShoppingBag,           label: 'All Orders' },
    { to: '/admin/payments',     icon: Landmark,              label: 'Settlement Verification' },
    { to: '/admin/escrow',       icon: DollarSign,            label: 'Escrow & Finance' },
    { to: '/admin/penalties',    icon: AlertTriangle,         label: 'Penalty Manager' },
    { to: '/admin/complaints',   icon: MessageSquareWarning,  label: 'Complaints', badge: badges.openComplaints },
    { to: '/admin/settings',     icon: Settings,              label: 'Settings' },
  ]

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30 w-64 bg-dark flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">
              TEX<span className="text-red-400">HUB</span>
            </span>
            <p className="text-red-400 text-xs font-semibold">ADMIN</p>
          </div>
        </div>
        <button className="lg:hidden text-gray-400 hover:text-white p-1" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin badge */}
      <div className="px-4 py-4 mx-3 mt-4 rounded-2xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name || 'Admin'}</p>
            <span className="text-red-400 text-xs font-medium">🛡 Super Admin</span>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 font-medium">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
