import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Clock, CheckCircle, Gavel,
  Star, TrendingUp, Banknote, ArrowRight, Scissors, AlertTriangle, Loader2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { StatCard } from '../components/ui/Card'
import { dashboardStats } from '../services/mockData'
import { ratingService } from '../services/ratingService'
import StarRating from '../components/ui/StarRating'
import { escrowService } from '../services/escrowService'
import { tailorService } from '../services/tailorService'
import { orderService } from '../services/orderService'

const recentActivity = [
  { text: 'New order from Pooja M', time: '2m ago', type: 'order' },
  { text: 'BID-002 accepted your bid', time: '1h ago', type: 'bid' },
  { text: 'ORD-008 marked as completed', time: '3h ago', type: 'complete' },
  { text: 'Customer Nithya rated 5⭐', time: 'Yesterday', type: 'review' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiStats, setApiStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentReviews, setRecentReviews] = useState([])

  const isDemo = user?._demo

  useEffect(() => {
    if (isDemo) {
      // Demo user: keep existing localStorage-based penalty check
      const storedOrders = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
      const userPenalties = storedOrders.filter(o =>
        (o.selectedTailor === user.name || o.tailor === user.name) && o.penaltyApplied
      )
      setPenalties(userPenalties)
    } else {
      // Real user: fetch from API
      fetchDashboardData()
    }
  }, [user?.name, isDemo])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const [profileRes, ordersRes, reviewsRes] = await Promise.allSettled([
        tailorService.getMyProfile(),
        orderService.getMyOrders({ limit: 5 }),
        ratingService.getByTailor(user?._realId || user?.id, { limit: 5 }),
      ])

      if (profileRes.status === 'fulfilled') {
        const profile = profileRes.value.data || profileRes.value
        setApiStats({
          rating: profile.avgRating || 0,
          totalWorks: profile.completedOrders || profile.totalWorks || 0,
          revenue: profile.totalEarnings || profile.revenue || 0,
          pendingAmount: profile.pendingPayout || profile.pendingAmount || 0,
          reviewRate: profile.avgRating || 0,
          newOrders: profile.openOrdersCount || 0,
          myOrders: profile.activeOrdersCount || 0,
        })
      }

        if (ordersRes.status === 'fulfilled') {
          const orders = ordersRes.value.data?.orders || ordersRes.value.data || []
          setRecentOrders(Array.isArray(orders) ? orders.map(o => ({
            text: `Order ${o.orderNumber || o.id} - ${o.clothType || o.item || 'Order'}`,
            time: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '',
            type: o.status === 'delivered' ? 'complete' : o.status === 'in_work' ? 'order' : 'bid',
            date: new Date(o.createdAt || 0)
          })) : [])
        }

        if (reviewsRes.status === 'fulfilled') {
          const reviews = reviewsRes.value.data || reviewsRes.value.ratings || []
          setRecentReviews(Array.isArray(reviews) ? reviews.map(r => ({
            text: `Customer ${r.reviewer?.name || 'User'} rated you ${r.stars}⭐`,
            time: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
            type: 'review',
            stars: r.stars,
            review: r.review,
            date: new Date(r.createdAt || 0)
          })) : [])
        }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Could not load dashboard data. Showing defaults.')
    } finally {
      setLoading(false)
    }
  }

  // Build stats depending on demo vs real user
  let stats
  if (isDemo) {
    // Fetch escrow data for demo user
    const escrowData = escrowService.getEscrowTransactions().filter(t => t.tailorName === user.name)
    const pendingEscrow = escrowData.filter(t => t.status === 'held').reduce((acc, curr) => acc + curr.tailorPayout, 0)
    const earnedEscrow = escrowData.filter(t => t.status === 'released').reduce((acc, curr) => acc + curr.tailorPayout, 0)

    const tailorStats = ratingService.getTailorStats(user.name)
    const isMockUser = user?.email === 'siva@texhub.com'
    stats = isMockUser ? {
      ...dashboardStats,
      rating: tailorStats.rating,
      totalWorks: tailorStats.count,
      reviewRate: tailorStats.count > 0 ? Math.min(100, Math.round((tailorStats.reviews.length / tailorStats.count) * 100)) : 98
    } : {
      totalWorks: 0,
      revenue: earnedEscrow,
      pendingAmount: pendingEscrow,
      rating: 0,
      reviewRate: 0,
      newOrders: 0,
      myOrders: 0
    }
    if (isMockUser) {
      stats.revenue = Math.max(stats.revenue, earnedEscrow)
      stats.pendingAmount = Math.max(stats.pendingAmount, pendingEscrow)
    }
  } else {
    stats = apiStats || {
      totalWorks: 0,
      revenue: 0,
      pendingAmount: 0,
      rating: 0,
      reviewRate: 0,
      newOrders: 0,
      myOrders: 0
    }
  }

  const isMockUser = isDemo && user?.email === 'siva@texhub.com'

  const dynamicQuickLinks = [
    { to: '/orders/new',       icon: ShoppingBag, label: 'NEW ORDERS',     sub: 'Browse customer requests', color: 'from-violet-500 to-purple-600', count: stats.newOrders },
    { to: '/orders/process',   icon: Clock,       label: 'MY ORDERS',      sub: 'Track your active work',   color: 'from-blue-500 to-indigo-600',  count: stats.myOrders },
    { to: '/orders/bidding',   icon: Gavel,       label: 'BIDDING',        sub: 'Place your best bids',     color: 'from-amber-500 to-orange-600', count: isMockUser ? 5 : 0 },
    { to: '/orders/completed', icon: CheckCircle, label: 'COMPLETED',      sub: 'View finished work',       color: 'from-emerald-500 to-green-600',count: isMockUser ? 6 : stats.totalWorks },
  ]

  const activityList = (!isDemo) 
    ? [...recentOrders, ...recentReviews].sort((a,b) => b.date - a.date).slice(0, 5)
    : recentActivity

  return (
    <div className="space-y-8">
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading dashboard...</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Penalty Warning Banner */}
      {penalties.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top duration-500">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-red-900 tracking-tight">Active Penalties Detected</h3>
            <p className="text-red-700 font-medium mt-1">
              Your rating has been adjusted (-0.25 stars) and service fees reduced for {penalties.length} order{penalties.length > 1 ? 's' : ''}.
              Please review platform guidelines to avoid future penalties.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/orders/completed')} className="px-6 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200">
              View Orders
            </button>
          </div>
        </div>
      )}

      {/* Hero greeting */}
      <div className="relative bg-dark rounded-3xl p-8 overflow-hidden">
        {/* bg decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-purple-900/30 blur-2xl" />
          {/* Circular rings */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/5" />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/5" />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-purple-600/30 bg-purple-600/10 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-600/30 text-purple-300 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
            🪡 Welcome back
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Hi, {firstName}! 👋
          </h1>
          <p className="text-gray-400 text-base max-w-md">
            WELCOME TO TEXHUB — Your tailor dashboard is ready. You have{' '}
            <span className="text-purple-400 font-semibold">{stats.newOrders} new orders</span> waiting.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/orders/new')}
              className="btn-primary flex items-center gap-2">
              View New Orders <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/orders/bidding')}
              className="btn-secondary flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
              Browse Bids
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Star} iconBg="bg-yellow-100"
          value={Number(stats.rating || 0) + '/5'}
          label="Average Rating"
          delta={isMockUser ? 12 : 0} />
        <StatCard icon={CheckCircle} iconBg="bg-green-100"
          value={stats.totalWorks}
          label="Total Works Done"
          delta={isMockUser ? 8 : 0} />
        <StatCard icon={Banknote} iconBg="bg-purple-100"
          value={`Rs.${(stats.revenue/1000).toFixed(1)}K`}
          label="Total Earned"
          sub="Payments released to bank"
          delta={isMockUser ? 15 : 0} />
        <StatCard icon={Banknote} iconBg="bg-amber-100"
          value={`Rs.${(stats.pendingAmount/1000).toFixed(1)}K`}
          label="Pending Payout"
          sub="Held in secure escrow"
          delta={isMockUser ? -3 : 0} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicQuickLinks.map(({ to, icon: Icon, label, sub, color, count }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Decorative circle */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-black text-white">{count}</span>
                </div>
                <h3 className="text-white font-black text-sm tracking-wide mb-1">{label}</h3>
                <p className="text-white/70 text-xs">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activityList.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  {a.type === 'order' && <ShoppingBag className="w-4 h-4 text-purple-600" />}
                  {a.type === 'bid' && <Gavel className="w-4 h-4 text-purple-600" />}
                  {a.type === 'complete' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                  {a.type === 'review' && <Star className="w-4 h-4 text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">{a.text}</p>
                  <p className="text-xs text-gray-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-3xl font-black mb-4">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{user?.name}</h3>
          <p className="text-gray-400 text-sm capitalize mb-4">{user?.role}</p>
          <StarRating rating={stats.rating} size="sm" className="mb-4" />
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500">Total Works</span>
              <span className="font-bold text-gray-900">{stats.totalWorks}</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-gray-500">Rating</span>
              <span className="font-bold text-gray-900">{Number(stats.rating || 0)}/5</span>
            </div>
          </div>
          <button onClick={() => navigate('/profile')}
            className="mt-4 btn-outline w-full">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}
