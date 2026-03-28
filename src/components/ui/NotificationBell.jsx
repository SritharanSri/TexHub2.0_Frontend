import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { notificationService } from '../../services/notificationService'
import { socketService } from '../../services/socket'

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

export default function NotificationBell({ accentColor = 'purple' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const colorMap = {
    purple: { dot: 'bg-purple-600', bg: 'bg-purple-50/50', badge: 'bg-red-500', markAll: 'text-purple-600' },
    red:    { dot: 'bg-red-600',    bg: 'bg-red-50/50',    badge: 'bg-red-500', markAll: 'text-red-600' },
    blue:   { dot: 'bg-blue-600',   bg: 'bg-blue-50/50',   badge: 'bg-red-500', markAll: 'text-blue-600' },
  }
  const colors = colorMap[accentColor] || colorMap.purple

  const fetchCount = useCallback(() => {
    notificationService.unreadCount()
      .then(res => setUnreadCount(res?.data?.count ?? res?.count ?? 0))
      .catch(() => {})
  }, [])

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    notificationService.getAll({ limit: 10 })
      .then(res => {
        const list = res?.data || res || []
        setNotifications(Array.isArray(list) ? list : [])
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  // Poll unread count every 30s + Listen for real-time
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)

    const handleNewNotification = (noti) => {
      setUnreadCount(prev => prev + 1)
      setNotifications(prev => [noti, ...prev].slice(0, 10))
    }

    socketService.onNewNotification(handleNewNotification)

    return () => {
      clearInterval(interval)
      socketService.offNewNotification(handleNewNotification)
    }
  }, [fetchCount])

  // Load full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead()
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleMarkRead = async (id) => {
    await notificationService.markRead(id)
    setUnreadCount(prev => Math.max(0, prev - 1))
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const handleNotificationClick = (noti) => {
    // 1. Mark as read if it isn't
    if (!noti.isRead) {
      handleMarkRead(noti.id)
    }

    // 2. Close dropdown
    setOpen(false)

    // 3. Determine and navigate to path
    const { type, data } = noti
    const orderId = data?.orderId

    if (!orderId) return // Nowhere specific to go if no ID

    let path = ''
    const role = user?.role

    switch (type) {
      case 'new_message':
      case 'order_status':
      case 'quotation_accepted':
      case 'new_order':
        path = role === 'customer' ? `/customer/orders/${orderId}` : `/orders/${orderId}`
        break
      case 'new_quotation':
        path = '/customer/bids'
        break
      default:
        // Generic fallback or just list
        path = role === 'customer' ? '/customer/my-orders' : '/on-process'
    }

    if (path) navigate(path)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${colors.badge} text-white text-[10px] font-bold px-1`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className={`text-xs ${colors.markAll} font-medium hover:underline flex items-center gap-1`}>
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? colors.bg : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!n.isRead ? colors.dot : 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <p className="text-sm text-gray-600 truncate">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <button 
                onClick={handleMarkAllRead}
                className={`text-xs ${colors.markAll} font-semibold hover:underline bg-transparent border-0`}
              >
                All caught up!
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
