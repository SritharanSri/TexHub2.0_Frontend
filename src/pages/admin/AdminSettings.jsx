import { useState, useEffect } from 'react'
import { User, Mail, Phone, Camera, Landmark, CheckCircle, Shield, Bell, Lock } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { userService } from '../../services/userService'
import { paymentService } from '../../services/paymentService'

export default function AdminSettings() {
  const { user, updateUser } = useAuth()
  const isDemo = user?._demo === true

  const [personalDetails, setPersonalDetails] = useState({
    name: user?.name || 'Administrator',
    email: user?.email || 'admin@texhub.com',
    phone: user?.phone || '+94 77 123 4567',
    avatar: null
  })

  const defaultBank = { bankName: '', accountName: '', accountNumber: '', branch: '', swiftCode: '', logo: '' }
  const [bankDetails, setBankDetails] = useState(isDemo ? paymentService.getAdminBankDetails() : defaultBank)
  const [bankId, setBankId] = useState(null)
  const [saved, setSaved] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [loading, setLoading] = useState(!isDemo)

  // New State for Uploaded Images
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [brandingPreview, setBrandingPreview] = useState(null)
  const [isUploading, setIsUploading] = useState({ avatar: false, branding: false })

  // Toggles state
  const [toggles, setToggles] = useState({
    settlementAlerts: true,
    disputeReports: true,
    twoFactor: true,
    auditLogging: true
  })

  useEffect(() => {
    if (isDemo) return

    const fetchBankDetails = async () => {
      try {
        const res = await adminService.getBankDetails()
        const data = res?.data || res
        // Could be a single object or an array of bank details
        const bank = Array.isArray(data) ? data[0] : (data?.bankDetails?.[0] || data)
        if (bank && bank.bankName) {
          setBankDetails({
            bankName: bank.bankName || '',
            accountName: bank.accountName || bank.holderName || '',
            accountNumber: bank.accountNumber || '',
            branch: bank.branchName || bank.branch || '',
            swiftCode: bank.swiftCode || bank.swift || '',
            logo: bank.logo || '',
          })
          setBankId(bank.id || bank._id || null)
        }
      } catch (err) {
        console.error('Failed to fetch bank details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBankDetails()
  }, [isDemo])

  const toggleHandler = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(prev => ({ ...prev, [type]: true }))

    // Simulate upload delay
    setTimeout(() => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'avatar') setAvatarPreview(reader.result)
        else setBrandingPreview(reader.result)
        setIsUploading(prev => ({ ...prev, [type]: false }))
      }
      reader.readAsDataURL(file)
    }, 1500)
  }

  const handleSave = async () => {
    setIsUpdating(true)

    if (isDemo) {
      // Demo: original localStorage-based save
      updateUser({
        name: personalDetails.name,
        email: personalDetails.email,
        phone: personalDetails.phone,
        avatar: avatarPreview
      })
      paymentService.updateAdminBankDetails({
        ...bankDetails,
        logo: brandingPreview
      })
      localStorage.setItem('admin_settings_toggles', JSON.stringify(toggles))
      await new Promise(r => setTimeout(r, 1000))
      setIsUpdating(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      return
    }

    // Real: call API
    try {
      // Update profile via userService
      await userService.updateProfile({
        name: personalDetails.name,
        email: personalDetails.email,
        phone: personalDetails.phone,
      })
      updateUser({
        name: personalDetails.name,
        email: personalDetails.email,
        phone: personalDetails.phone,
        avatar: avatarPreview || user?.avatar,
      })

      // Update bank details only if required fields are provided
      const hasBankData = bankDetails.bankName && bankDetails.accountName && bankDetails.accountNumber
      if (hasBankData) {
        const bankPayload = {
          bankName: bankDetails.bankName,
          accountName: bankDetails.accountName,
          accountNumber: bankDetails.accountNumber,
          branchName: bankDetails.branch,
        }
        if (bankId) {
          await adminService.updateBankDetail(bankId, bankPayload)
        } else {
          const res = await adminService.createBankDetail(bankPayload)
          const created = res?.data || res
          setBankId(created?.id || created?._id || null)
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Command Center</h2>
          <p className="text-gray-500 font-medium">Configure your administrative identity and platform finances</p>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-right-4">
              <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full animate-bounce">
                <CheckCircle className="w-4 h-4 text-white" />
              </span>
              Security state synchronized
            </div>
          )}
          <Button onClick={handleSave} loading={isUpdating} className="rounded-2xl px-10 py-5 bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 shadow-2xl shadow-gray-200 transition-all active:scale-95">
            Secure Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Col: Personal Details */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8 flex items-center gap-3">
              <User className="w-6 h-6 text-gray-400" />
              Administrative Identity
            </h3>

            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className={`w-36 h-36 rounded-[3rem] bg-gray-50 border-4 border-white shadow-2xl flex items-center justify-center text-5xl overflow-hidden transition-all duration-700 ${isUploading.avatar ? 'animate-pulse opacity-50' : ''}`}>
                    {avatarPreview || user?.avatar ? (
                      <img src={avatarPreview || user.avatar} alt="Admin" className="w-full h-full object-cover" />
                    ) : (
                      <span className="grayscale opacity-30">{user?.name?.charAt(0) || 'A'}</span>
                    )}
                    {isUploading.avatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                         <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-xl hover:scale-110 cursor-pointer transition-all hover:bg-red-600 active:scale-95 group-hover:rotate-6">
                    <Camera className="w-6 h-6" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                  </label>
                </div>
                <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Institutional Avatar</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 ml-1">Full Identity</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={personalDetails.name}
                      onChange={(e) => setPersonalDetails({...personalDetails, name: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 ml-1">Communication Channel</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={personalDetails.email}
                      onChange={(e) => setPersonalDetails({...personalDetails, email: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 ml-1">Secure Contact</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={personalDetails.phone}
                      onChange={(e) => setPersonalDetails({...personalDetails, phone: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-2xl p-6 space-y-3">
             <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-600" />
                <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Security Advisory</p>
             </div>
             <p className="text-[11px] text-amber-700 leading-relaxed font-bold">
               All identity modifications are archived in the platform's tamper-proof audit vault. Ensure transparency.
             </p>
          </div>
        </div>

        {/* Right Col: Bank & Platform Settings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-10 shadow-sm space-y-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                <Landmark className="w-6 h-6 text-gray-400" />
                Platform Settlement Repository
              </h3>
              <p className="text-gray-400 text-sm font-medium">Configure where customers deposit funds for custom orders</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Financial Institution</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                  placeholder="e.g. Commercial Bank"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Repository Holder</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                  placeholder="e.g. TexHub PVT LTD"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Account Identifier</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                  placeholder="e.g. 8004561239"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Strategic Branch</label>
                <input
                  type="text"
                  value={bankDetails.branch}
                  onChange={(e) => setBankDetails({...bankDetails, branch: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                  placeholder="e.g. Colombo 07"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">SWIFT / Routing Index</label>
                <input
                  type="text"
                  value={bankDetails.swiftCode}
                  onChange={(e) => setBankDetails({...bankDetails, swiftCode: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all shadow-inner"
                  placeholder="e.g. COMBPCLK"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Institutional Branding</label>
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                  <div className={`w-16 h-16 rounded-2xl bg-white shadow-inner flex items-center justify-center text-3xl overflow-hidden border border-gray-100 transition-all ${isUploading.branding ? 'animate-pulse' : ''}`}>
                    {brandingPreview || bankDetails.logo ? (
                      <img src={brandingPreview || bankDetails.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="grayscale opacity-20">🏦</span>
                    )}
                  </div>
                  <label className="text-xs font-black text-blue-600 hover:text-red-600 underline uppercase tracking-widest cursor-pointer transition-colors">
                    {isUploading.branding ? 'Analyzing...' : 'Update Branding'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'branding')} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                  <h4 className="font-black text-gray-900 tracking-tight">Broadcast Control</h4>
                </div>
                <div className="space-y-4">
                  {[
                    { id: 'settlementAlerts', label: 'Settlement Alerts', desc: 'Notify on every deposit upload' },
                    { id: 'disputeReports', label: 'Dispute Reports', desc: 'Critical alerts for platform conflicts' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-bold text-gray-800">{item.label}</p>
                         <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
                       </div>
                       <button
                         onClick={() => toggleHandler(item.id)}
                         className={`w-12 h-6 rounded-full transition-all duration-500 flex items-center px-1 ${toggles[item.id] ? 'bg-gray-900' : 'bg-gray-200'}`}
                       >
                         <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${toggles[item.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                  ))}
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-gray-400" />
                  <h4 className="font-black text-gray-900 tracking-tight">Security Protocol</h4>
                </div>
                <div className="space-y-4">
                  {[
                    { id: 'twoFactor', label: '2FA Enforcement', desc: 'Mandatory for all admin actions' },
                    { id: 'auditLogging', label: 'Audit Logging', desc: 'Full transparency of repository changes' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-bold text-gray-800">{item.label}</p>
                         <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
                       </div>
                       <button
                         onClick={() => toggleHandler(item.id)}
                         className={`w-12 h-6 rounded-full transition-all duration-500 flex items-center px-1 ${toggles[item.id] ? 'bg-gray-900' : 'bg-gray-200'}`}
                       >
                         <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${toggles[item.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
