import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, Search, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../ui/NotificationBell'

const pageTitles = {
  '/admin/dashboard':  'Admin Dashboard',
  '/admin/approvals':  'Tailor Approvals',
  '/admin/users':      'User Management',
  '/admin/orders':     'Order Management',
  '/admin/complaints': 'Complaints & Reports',
  '/admin/payments':   'Settlement Verification',
  '/admin/escrow':     'Escrow & Finance',
  '/admin/penalties':  'Penalty Manager',
  '/admin/settings':   'Settings',
}

export default function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [dropOpen, setDropOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropRef = useRef(null)

  const title = pageTitles[pathname] || (pathname.startsWith('/admin/tailors/') ? 'Tailor Detail' : 'Admin Panel')

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              placeholder="Search users, orders..." 
              className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notifications */}
          <NotificationBell accentColor="red" />

          {/* User dropdown */}
          <div className="relative" ref={dropRef}>
            <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => { setDropOpen(d => !d) }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700">{user?.name?.split(' ')[0]}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
            {dropOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-red-500 font-medium">Super Admin</p>
                </div>
                <button onClick={() => { navigate('/admin/settings'); setDropOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Settings
                </button>
                <div className="border-t border-gray-100">
                  <button onClick={() => { logout(); navigate('/login') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
