import { useState, useEffect } from 'react'
import { Camera, Edit2, Lock, Save, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { currentUser } from '../services/mockData'
import { RatingStars } from '../components/ui/StatusBadge'
import { userService } from '../services/userService'
import { tailorService } from '../services/tailorService'
import { ratingService } from '../services/ratingService'
import StarRating from '../components/ui/StarRating'
import { getFileUrl } from '../services/api'

export default function Profile() {
  const { user } = useAuth()
  const isDemo = user?._demo

  const [editing, setEditing] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(() => getFileUrl(user?.avatar) || null)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const [profileData, setProfileData] = useState({
    rating: currentUser.rating,
    totalWorks: currentUser.totalWorks,
    activeOrders: 4,
    earnings: 'Rs.42.8K',
  })

  const [form, setForm] = useState({
    name:    user?.name || currentUser.name,
    email:   user?.email || currentUser.email,
    phone:   user?.phone || currentUser.phone,
    address: user?.address || currentUser.address,
  })
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })

  const set = (field) => (e) => setForm(f => ({...f, [field]: e.target.value}))
  const setP = (field) => (e) => setPassForm(p => ({...p, [field]: e.target.value}))

  useEffect(() => {
    if (!isDemo) {
      fetchProfile()
    }
  }, [isDemo])

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const [userRes, tailorRes] = await Promise.allSettled([
        userService.getProfile(),
        tailorService.getMyProfile(),
      ])

      if (userRes.status === 'fulfilled') {
        const u = userRes.value.data || userRes.value
        setForm(prev => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          address: u.address || u.tailorProfile?.shopAddress || prev.address,
        }))
        if (u.avatar) setAvatarUrl(getFileUrl(u.avatar))
      }

      if (tailorRes.status === 'fulfilled') {
        const t = tailorRes.value.data || tailorRes.value
        setProfileData({
          rating: t.avgRating || 0,
          totalWorks: t.completedOrders || t.totalWorks || 0,
          activeOrders: t.activeOrdersCount || 0,
          earnings: t.totalEarnings ? `Rs.${(t.totalEarnings / 1000).toFixed(1)}K` : 'Rs.0',
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError('Could not load profile data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isDemo && user?.id) {
      fetchReviews()
    }
  }, [isDemo, user?.id])

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      const res = await ratingService.getByTailor(user?._realId || user?.id, { limit: 10 })
      const list = res.data || res.ratings || []
      setReviews(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleSave = async () => {
    if (isDemo) {
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
      return
    }

    setSaving(true)
    setError('')
    try {
      await userService.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
      })
      // Also update tailor-specific fields if available
      try {
        await tailorService.updateProfile({})
      } catch {
        // Tailor profile update is optional
      }
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPassError('')
    setPassSuccess(false)

    if (passForm.newPass !== passForm.confirm) {
      setPassError('New password and confirmation do not match.')
      return
    }
    if (passForm.newPass.length < 6) {
      setPassError('New password must be at least 6 characters.')
      return
    }

    if (isDemo) {
      setPassSuccess(true)
      setChangingPass(false)
      setPassForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setPassSuccess(false), 3000)
      return
    }

    setSaving(true)
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
      console.error('Failed to change password:', err)
      setPassError(err.response?.data?.message || 'Failed to change password. Check your current password.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || isDemo) return

    setUploadingAvatar(true)
    try {
      await userService.uploadAvatar(file)
      // Optionally refresh profile after upload
      fetchProfile()
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      setError('Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const stats = [
    { label: 'Total Works', value: profileData.totalWorks },
    { label: 'Rating', value: `${Number(profileData.rating || 0)}/5` },
    { label: 'Active Orders', value: profileData.activeOrders },
    { label: 'Earnings', value: profileData.earnings },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-purple-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-medium">Loading profile...</span>
      </div>
    )
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
        {passSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Password updated
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,.1) 8px, rgba(255,255,255,.1) 9px)' }}
            />
          </div>
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 w-fit">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white text-3xl font-black ring-4 ring-white shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={form.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    {form.name.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </label>
            </div>

            <h3 className="text-xl font-black text-gray-900">{form.name}</h3>
            <p className="text-gray-400 text-sm capitalize mb-1">{user?.role || 'Tailor'}</p>
            <RatingStars rating={profileData.rating} />

            <div className="grid grid-cols-2 gap-3 mt-5">
              {stats.map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="font-black text-gray-900 text-lg">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Personal Details</h3>
              {!editing ? (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                    <X className="w-3.5 h-3.5" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.name}
                onChange={set('name')} disabled={!editing} />
              <Input label="Mobile Number" value={form.phone} type="tel"
                onChange={set('phone')} disabled={!editing} />
              <Input label="Email Address" value={form.email} type="email"
                onChange={set('email')} disabled={!editing} className="sm:col-span-2" />
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={set('address')}
                  disabled={!editing}
                  className="input-field resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <Button size="sm" variant="outline" onClick={() => setChangingPass(c => !c)}>
                <Lock className="w-3.5 h-3.5" />
                {changingPass ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {/* Password error */}
            {passError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {passError}
              </div>
            )}

            {changingPass && (
              <div className="space-y-4">
                <Input label="Current Password" type="password" placeholder="••••••••"
                  value={passForm.current} onChange={setP('current')} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="New Password" type="password" placeholder="Min. 6 characters"
                    value={passForm.newPass} onChange={setP('newPass')} />
                  <Input label="Confirm Password" type="password" placeholder="Repeat password"
                    value={passForm.confirm} onChange={setP('confirm')} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            )}
            {!changingPass && (
              <p className="text-sm text-gray-400">Password was last changed 30 days ago.</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Customer Reviews & Feedback</h3>
          <span className="text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full">
            {profileData.totalWorks} Total Reviews
          </span>
        </div>
        <div className="p-6">
          {loadingReviews ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading reviews...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Edit2 className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm italic">No reviews received yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r, idx) => (
                <div key={r.id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                      {r.reviewer?.avatar ? (
                        <img src={getFileUrl(r.reviewer.avatar)} alt={r.reviewer.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        r.reviewer?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{r.reviewer?.name || 'Verified Customer'}</h4>
                      <p className="text-[10px] text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}</p>
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={r.stars} size="xs" />
                    </div>
                  </div>
                  {r.review ? (
                    <p className="text-xs text-gray-600 leading-relaxed italic">"{r.review}"</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No comment provided.</p>
                  )}
                  {r.latePenaltyApplied && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                      <AlertCircle className="w-3 h-3" /> Late Delivery Penalty Applied
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
