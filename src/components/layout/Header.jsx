import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, Search, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../ui/NotificationBell'

const pageTitles = {
  '/dashboard':        'Dashboard',
  '/orders/new':       'New Orders',
  '/orders/bidding':   'Bidding',
  '/orders/process':   'On Process',
  '/orders/completed': 'Completed Orders',
  '/profile':          'My Profile',
  '/settings':         'Settings',
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropRef = useRef(null)

  const title = pageTitles[pathname] || (pathname.startsWith('/orders/') ? 'Order Details' : 'TexHub')
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

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
        {/* Left: menu + title */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right: search + actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-48 lg:w-64">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              placeholder="Search..."
              className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notifications */}
          <NotificationBell accentColor="purple" />

          {/* User menu */}
          <div className="relative" ref={dropRef}>
            <button
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => { setDropdownOpen(!dropdownOpen) }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <button onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  My Profile
                </button>
                <button onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Settings
                </button>
                <div className="border-t border-gray-100 mt-1">
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
