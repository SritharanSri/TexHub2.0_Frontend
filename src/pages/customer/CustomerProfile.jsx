import { useState, useEffect, useRef } from 'react'
import { Camera, Edit2, Lock, Save, X, CheckCircle, Package, Star } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { userService } from '../../services/userService'
import { orderService } from '../../services/orderService'

export default function CustomerProfile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState(null)
  const [passSuccess, setPassSuccess] = useState(false)
  const avatarInputRef = useRef(null)
  const [form, setForm] = useState({
    name:    user?.name || 'Customer',
    email:   user?.email || 'customer@texhub.com',
    phone:   user?.phone || '+91 99887 76655',
    address: user?.address || '45, MG Road, Bangalore - 560 001',
  })
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Load profile from API on mount
  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    userService.getProfile()
      .then(res => {
        if (cancelled) return
        const p = res.data || res
        const profileData = {
          name: p.name || user?.name || '',
          email: p.email || user?.email || '',
          phone: p.phone || '',
          address: p.address || '',
        }
        setForm(profileData)
        // Also update auth context with fresh data
        updateUser(p)
      })
      .catch(() => { /* keep existing form data */ })
      .finally(() => { if (!cancelled) setProfileLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load orders
  useEffect(() => {
    let cancelled = false
    setOrdersLoading(true)
    orderService.getMyOrders({ limit: 50 })
      .then(res => {
        if (cancelled) return
        const list = res?.data || res || []
        setOrders(Array.isArray(list) ? list : (list.orders || []))
      })
      .catch(() => setOrders([]))
      .finally(() => { if (!cancelled) setOrdersLoading(false) })
    return () => { cancelled = true }
  }, [])

  const totalOrders = orders.length
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const totalSpent = orders.reduce((sum, o) => sum + (o.payment?.amount || o.quotationAmount || 0), 0)
  const recentOrders = orders.slice(0, 5)

  const customerStats = [
    { label: 'Total Orders', value: totalOrders },
    { label: 'Delivered', value: deliveredOrders },
    { label: 'Active', value: activeOrders },
    { label: 'Spent', value: totalSpent > 0 ? `Rs.${(totalSpent / 1000).toFixed(1)}K` : 'Rs.0' },
  ]

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : ''

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const setP = field => e => setPassForm(p => ({ ...p, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await userService.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
      })
      updateUser({ name: form.name, phone: form.phone, address: form.address })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await userService.uploadAvatar(file)
      const data = res.data || res
      if (data.avatarUrl || data.avatar) {
        updateUser({ avatarUrl: data.avatarUrl || data.avatar })
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to upload avatar.')
    }
  }

  const handleChangePassword = async () => {
    setPassError(null)
    if (passForm.newPass !== passForm.confirm) {
      setPassError('New password and confirmation do not match.')
      return
    }
    if (passForm.newPass.length < 6) {
      setPassError('Password must be at least 6 characters.')
      return
    }

    setPassLoading(true)
    try {
      await userService.changePassword({
        currentPassword: passForm.current,
        newPassword: passForm.newPass,
      })
      setPassSuccess(true)
      setChangingPass(false)
      setPassForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setPassSuccess(false), 3000)
    } catch (err) {
      setPassError(err?.response?.data?.message || 'Failed to change password.')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">My Profile</h2>
          <p className="text-gray-500 text-sm">Manage your account details</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Profile saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover  — blue gradient for customer */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,.1) 8px, rgba(255,255,255,.1) 9px)' }}
            />
          </div>
          <div className="px-6 pb-6">
            <div className="relative -mt-10 mb-4 w-fit">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black ring-4 ring-white shadow-lg">
                {form.name.charAt(0)}
              </div>
              <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <h3 className="text-xl font-black text-gray-900">{form.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                👗 Customer
              </span>
              {memberSince && <span className="text-xs text-gray-400">Member since {memberSince}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              {customerStats.map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="font-black text-gray-900 text-lg">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>


          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Personal Details</h3>
              {!editing ? (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" onClick={handleSave} loading={saving}><Save className="w-3.5 h-3.5" /> Save</Button>
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.name} onChange={set('name')} disabled={!editing} />
              <Input label="Phone" value={form.phone} type="tel" onChange={set('phone')} disabled={!editing} />
              <Input label="Email" value={form.email} type="email" onChange={set('email')} disabled={!editing} className="sm:col-span-2" />
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Address</label>
                <textarea rows={2} value={form.address} onChange={set('address')} disabled={!editing}
                  className="input-field resize-none disabled:opacity-60 disabled:cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Order history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent Order History</h3>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{o.clothType || o.category || 'Custom Garment'}</p>
                      <p className="text-xs text-gray-400">{o.tailor?.name ? `By ${o.tailor.name}` : (o.orderNumber || o.id)}</p>
                    </div>
                    <div className="text-right">
                      {(o.payment?.amount || o.quotationAmount) && (
                        <p className="font-bold text-gray-800">Rs.{(o.payment?.amount || o.quotationAmount).toLocaleString()}</p>
                      )}
                      <span className="text-xs text-gray-400 capitalize">{o.status?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <Button size="sm" variant="outline" onClick={() => setChangingPass(c => !c)}>
                <Lock className="w-3.5 h-3.5" /> {changingPass ? 'Cancel' : 'Change'}
              </Button>
            </div>
            {changingPass ? (
              <div className="space-y-4">
                <Input label="Current Password" type="password" placeholder="••••••••" value={passForm.current} onChange={setP('current')} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="New Password" type="password" placeholder="Min. 6 characters" value={passForm.newPass} onChange={setP('newPass')} />
                  <Input label="Confirm" type="password" placeholder="Repeat" value={passForm.confirm} onChange={setP('confirm')} />
                </div>
                {passError && (
                  <p className="text-sm text-red-600 font-medium">{passError}</p>
                )}
                {passSuccess && (
                  <p className="text-sm text-green-600 font-medium">Password updated successfully.</p>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} loading={passLoading}>Update Password</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Click "Change" to update your password.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
