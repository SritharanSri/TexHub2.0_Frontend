import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, Search, ChevronDown, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../ui/NotificationBell'

const pageTitles = {
  '/customer/dashboard':  'My Dashboard',
  '/customer/place-order':'Place New Order',
  '/customer/my-orders':  'My Orders',
  '/customer/bids':       'Tailor Bids',
  '/customer/profile':    'My Profile',
  '/customer/payment':    'Payment',
  '/settings':            'Settings',
}

export default function CustomerHeader({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropRef = useRef(null)

  const title = pageTitles[pathname] || 'TexHub'
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" onClick={onMenuClick}>
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
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-48 lg:w-64">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input 
              placeholder="Search tailors, orders..." 
              className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick action */}
          <button
            onClick={() => navigate('/customer/place-order')}
            className="hidden sm:flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> New Order
          </button>

          {/* Notifications */}
          <NotificationBell accentColor="purple" />

          {/* User menu */}
          <div className="relative">
            <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => { setDropdownOpen(!dropdownOpen) }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400">Customer Account</p>
                </div>
                <button onClick={() => { navigate('/customer/profile'); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">My Profile</button>
                <button onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Settings</button>
                <div className="border-t border-gray-100 mt-1">
                  <button onClick={() => { logout(); navigate('/login') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
