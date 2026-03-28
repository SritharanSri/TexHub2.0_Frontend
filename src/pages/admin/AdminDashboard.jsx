import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, ShoppingBag, MessageSquareWarning,
  TrendingUp, ArrowRight, Clock, CheckCircle, AlertTriangle,
  Globe, DollarSign, Activity, PieChart
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { adminDashboardStats, pendingTailors as mockPendingTailors, complaints as mockComplaints, customerOrders } from '../../services/mockData'
import { complaintService } from '../../services/complaintService'

const StatCard = ({ icon: Icon, label, value, sub, trend, color, bg, onClick }) => (
  <div onClick={onClick}
    className={`bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/30 p-8 flex flex-col gap-6 ${onClick ? 'cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1' : ''}`}>
    <div className="flex justify-between items-start">
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-500`}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-4xl font-black text-gray-900 tracking-tighter`}>{value}</p>
      {sub && <p className="text-sm font-medium text-gray-500 mt-2">{sub}</p>}
    </div>
  </div>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [stats, setStats] = useState(adminDashboardStats)
  const [pendingTailors, setPendingTailors] = useState([])
  const [overdueCount, setOverdueCount] = useState(0)
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0)
  const [loading, setLoading] = useState(!isDemo)

  useEffect(() => {
    if (isDemo) {
      // Demo user: use mock data (original behavior)
      const today = new Date()
      const storedOrders = JSON.parse(localStorage.getItem('texhub_orders') || '[]')
      const combined = customerOrders.map(mo => {
        const override = storedOrders.find(so => so.id === mo.id)
        return override || mo
      })
      storedOrders.forEach(so => {
        if (!customerOrders.find(mo => mo.id === so.id)) combined.push(so)
      })
      setOverdueCount(combined.filter(o =>
        o.status !== 'delivered' && o.status !== 'completed' &&
        new Date(o.deadline) < today && !o.penaltyApplied
      ).length)
      setOpenComplaintsCount(complaintService.getComplaints().filter(c => c.status === 'open').length)
      setPendingTailors(mockPendingTailors)
      setStats(adminDashboardStats)
      return
    }

    // Real user: fetch from API
    const fetchDashboard = async () => {
      try {
        const res = await adminService.getDashboard()
        const data = res?.data || res || {}

        setStats({
          totalUsers: data.totalUsers ?? 0,
          totalTailors: data.totalTailors ?? 0,
          totalCustomers: data.totalCustomers ?? 0,
          pendingApprovals: data.pendingApprovals ?? 0,
          totalOrders: data.totalOrders ?? 0,
          ordersToday: data.ordersToday ?? 0,
          revenue: data.revenue ?? 'Rs.0',
          openComplaints: data.openComplaints ?? 0,
        })
        setOverdueCount(data.overdueOrders ?? 0)
        setOpenComplaintsCount(data.openComplaints ?? 0)
        setPendingTailors(data.pendingTailors || [])
      } catch (err) {
        console.error('Failed to fetch dashboard:', err)
        // Fallback to mock on error
        setStats(adminDashboardStats)
        setPendingTailors(mockPendingTailors)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [isDemo])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Hero / System Health */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Marketplace Intelligence</h1>
          <p className="text-gray-400 text-lg mt-2 font-medium">Real-time platform analytics and management</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-gray-50 border border-gray-100 px-6 py-4 rounded-3xl flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">System Status</p>
                <p className="text-sm font-black text-gray-900 tracking-tight">Healthy / Online</p>
              </div>
           </div>
           <button className="bg-gray-900 text-white font-black px-6 py-4 rounded-3xl hover:bg-gray-800 transition-all flex items-center gap-3 shadow-xl shadow-gray-200">
              <PieChart className="w-5 h-5" />
              Download Report
           </button>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} label="Total Platform Revenue" value={stats.revenue} trend="+24.8%" sub="Includes service commissions" onClick={() => {}} />
        <StatCard icon={ShoppingBag} label="Total Volume" value={stats.totalOrders} trend="+12.5%" sub={`${stats.ordersToday} new orders today`} onClick={() => navigate('/admin/orders')} />
        <StatCard icon={Activity} label="Active Customers" value={stats.totalCustomers} trend="+8.2%" sub="Verified verified accounts" onClick={() => navigate('/admin/users')} />
        <StatCard icon={Globe} label="Verified Partners" value={stats.totalTailors} trend="+3.1%" sub="Professional tailoring units" onClick={() => navigate('/admin/users')} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Queue */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Onboarding Queue</h3>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Review credentials</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
              {stats.pendingApprovals} Pending
            </span>
          </div>

          <div className="space-y-6">
            {pendingTailors.filter(t => (t.status || 'pending') === 'pending').slice(0, 3).map(t => (
              <div key={t.id || t._id} className="group flex items-center gap-5 p-4 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-400 text-xl border border-gray-100 group-hover:bg-white group-hover:shadow-lg transition-all">
                  {(t.name || 'T').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm tracking-tight">{t.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.specialization || t.specialty || ''}</p>
                </div>
                <button onClick={() => navigate('/admin/approvals')}
                  className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:scale-110 shadow-lg shadow-gray-200 transition-all opacity-0 group-hover:opacity-100">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={() => navigate('/admin/approvals')}
              className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
              View Entire Queue →
            </button>
          </div>
        </div>

        {/* Complaints & Growth */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-gray-900/30">
              <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12">
                 <TrendingUp className="w-64 h-64" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-4 text-center md:text-left">
                    <h3 className="text-3xl font-black tracking-tighter">Platform Growth</h3>
                    <p className="text-gray-400 font-medium max-w-sm">The platform has grown by 18.5% this quarter. Strategic focus on High-Fashion categories recommended.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="text-center">
                       <p className="text-5xl font-black tracking-tighter">842</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Completed Orders</p>
                    </div>
                    <div className="w-px h-12 bg-white/20 hidden md:block" />
                    <div className="text-center text-amber-500">
                       <p className="text-5xl font-black tracking-tighter">3</p>
                       <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">Disputes</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/20 p-8 flex items-center gap-6 group hover:border-red-600/30 transition-all cursor-pointer" onClick={() => navigate('/admin/complaints')}>
                 <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 animate-pulse">
                    <AlertTriangle className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-gray-900">{openComplaintsCount}</p>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1 text-red-600/70">Open Complaints</p>
                 </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/20 p-8 flex items-center gap-6 group hover:border-red-600/30 transition-all cursor-pointer" onClick={() => navigate('/admin/penalties')}>
                 <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 animate-pulse">
                    <AlertTriangle className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-gray-900">{overdueCount}</p>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1 text-amber-600/70">Overdue Orders</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
