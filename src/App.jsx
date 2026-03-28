import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'

// Auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import TwoFactor from './pages/TwoFactor'
import ForgotPassword from './pages/ForgotPassword'
import TailorVerification from './pages/TailorVerification'

// Tailor pages
import Dashboard from './pages/Dashboard'
import NewOrders from './pages/NewOrders'
import OnProcess from './pages/OnProcess'
import Completed from './pages/Completed'
import Bidding from './pages/Bidding'
import OrderDetails from './pages/OrderDetails'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import TailorPendingApproval from './pages/tailor/TailorPendingApproval'

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import PlaceOrder from './pages/customer/PlaceOrder'
import MyOrders from './pages/customer/MyOrders'
import CustomerBidding from './pages/customer/CustomerBidding'
import CustomerProfile from './pages/customer/CustomerProfile'
import PaymentPage from './pages/customer/PaymentPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import TailorApprovals from './pages/admin/TailorApprovals'
import UserManagement from './pages/admin/UserManagement'
import OrderManagement from './pages/admin/OrderManagement'
import ComplaintsPage from './pages/admin/ComplaintsPage'
import PenaltyManager from './pages/admin/PenaltyManager'
import EscrowManagement from './pages/admin/EscrowManagement'
import TailorDetail from './pages/admin/TailorDetail'
import CustomerDetail from './pages/admin/CustomerDetail'
import PaymentVerification from './pages/admin/PaymentVerification'
import AdminSettings from './pages/admin/AdminSettings'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getVerificationStatus(user) {
  return user?.tailorProfile?.verificationStatus || user?.verificationStatus
}

function hasNicSubmitted(user) {
  return !!(user?.tailorProfile?.nicFront || user?.nicSubmitted)
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Guards ──────────────────────────────────────────────────────────────────
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return children
  if (user?.role === 'admin')    return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'customer') return <Navigate to="/customer/dashboard" replace />
  if (user?.role === 'tailor') {
    if (getVerificationStatus(user) === 'approved') return <Navigate to="/dashboard" replace />
    return hasNicSubmitted(user) ? <Navigate to="/tailor/pending" replace /> : <Navigate to="/tailor/verify" replace />
  }
  return <Navigate to="/dashboard" replace />
}

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function TailorRoute() {
  const { user } = useAuth()
  if (user?.role === 'customer') return <Navigate to="/customer/dashboard" replace />
  if (user?.role === 'admin')    return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'tailor' && getVerificationStatus(user) !== 'approved')
    return hasNicSubmitted(user) ? <Navigate to="/tailor/pending" replace /> : <Navigate to="/tailor/verify" replace />
  return <MainLayout />
}

function CustomerRoute() {
  const { user } = useAuth()
  if (user?.role === 'tailor')  return <Navigate to="/dashboard" replace />
  if (user?.role === 'admin')   return <Navigate to="/admin/dashboard" replace />
  return <CustomerLayout />
}

function AdminRoute() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/login" replace />
  return <AdminLayout />
}

function RoleRedirect() {
  const { isAuthenticated, loading, user } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin')    return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'customer') return <Navigate to="/customer/dashboard" replace />
  if (user?.role === 'tailor') {
    if (getVerificationStatus(user) === 'approved') return <Navigate to="/dashboard" replace />
    return hasNicSubmitted(user) ? <Navigate to="/tailor/pending" replace /> : <Navigate to="/tailor/verify" replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public auth routes ── */}
          <Route element={<AuthLayout />}>
            <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup"      element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/verify-otp"  element={<TwoFactor />} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/tailor/verify" element={<RequireAuth><TailorVerification /></RequireAuth>} />
          </Route>

          {/* ── Tailor pending ── */}
          <Route path="/tailor/pending" element={<RequireAuth><TailorPendingApproval /></RequireAuth>} />

          {/* ── Tailor routes ── */}
          <Route element={<RequireAuth><TailorRoute /></RequireAuth>}>
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/orders/new"       element={<NewOrders />} />
            <Route path="/orders/process"   element={<OnProcess />} />
            <Route path="/orders/completed" element={<Completed />} />
            <Route path="/orders/bidding"   element={<Bidding />} />
            <Route path="/orders/:id"       element={<OrderDetails />} />
            <Route path="/profile"          element={<Profile />} />
            <Route path="/settings"         element={<Settings />} />
          </Route>

          {/* ── Customer routes ── */}
          <Route element={<RequireAuth><CustomerRoute /></RequireAuth>}>
            <Route path="/customer/dashboard"   element={<CustomerDashboard />} />
            <Route path="/customer/place-order" element={<PlaceOrder />} />
            <Route path="/customer/my-orders"   element={<MyOrders />} />
            <Route path="/customer/orders/:id"  element={<OrderDetails />} />
            <Route path="/customer/bids"        element={<CustomerBidding />} />
            <Route path="/customer/profile"     element={<CustomerProfile />} />
            <Route path="/customer/payment"     element={<PaymentPage />} />
            <Route path="/customer/settings"    element={<Settings />} />
          </Route>

          {/* ── Admin routes ── */}
          <Route element={<RequireAuth><AdminRoute /></RequireAuth>}>
            <Route path="/admin/dashboard"  element={<AdminDashboard />} />
            <Route path="/admin/approvals"  element={<TailorApprovals />} />
            <Route path="/admin/users"      element={<UserManagement />} />
            <Route path="/admin/orders"     element={<OrderManagement />} />
            <Route path="/admin/complaints" element={<ComplaintsPage />} />
            <Route path="/admin/penalties"  element={<PenaltyManager />} />
            <Route path="/admin/escrow"     element={<EscrowManagement />} />
            <Route path="/admin/tailors/:id" element={<TailorDetail />} />
            <Route path="/admin/customers/:id" element={<CustomerDetail />} />
            <Route path="/admin/payments"   element={<PaymentVerification />} />
            <Route path="/admin/settings"   element={<AdminSettings />} />
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
