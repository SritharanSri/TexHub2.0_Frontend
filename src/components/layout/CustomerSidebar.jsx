import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, ShoppingBag,
  Gavel, User, LogOut, X, Scissors, Star
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/customer/dashboard', icon: LayoutDashboard, label: 'Home' },
    ],
  },
  {
    label: 'Orders',
    items: [
      { to: '/customer/place-order', icon: PlusCircle,   label: 'Place New Order' },
      { to: '/customer/my-orders',   icon: ShoppingBag,  label: 'My Orders' },
      { to: '/customer/bids',        icon: Gavel,        label: 'Tailor Bids' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/customer/profile',  icon: User,     label: 'My Profile' },
    ],
  },
]

export default function CustomerSidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-dark flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            TEX<span className="text-purple-400">HUB</span>
          </span>
        </div>
        <button className="lg:hidden text-gray-400 hover:text-white p-1" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Customer badge */}
      <div className="px-4 py-4 mx-3 mt-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name || 'Customer'}</p>
            <span className="inline-flex items-center gap-1 text-blue-400 text-xs font-medium">
              <Star className="w-3 h-3" /> Customer
            </span>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest px-4 mb-2">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-link-active' : 'sidebar-link'
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
