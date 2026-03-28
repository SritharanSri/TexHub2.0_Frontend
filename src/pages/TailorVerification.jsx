import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, CheckCircle, AlertCircle, Clock, ArrowRight, Store, Phone, MapPin, ChevronLeft, ShieldCheck, FileText, ArrowLeft, Briefcase } from 'lucide-react'
import Input from '../components/ui/Input'
import { Select } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { aiVerificationService } from '../services/aiVerificationService'
import { tailorService } from '../services/tailorService'

const specializations = [
  'Traditional Wear (Kurta, Veshti)', 'Western Formal (Suits, Blazers)',
  'Bridal & Wedding Wear', 'Women\'s Wear (Salwar, Lehenga)',
  'Kids Clothing', 'Casual Wear', 'Sports & Active Wear', 'All Categories',
]

function ImageUploadBox({ label, hint, onChange, file }) {
  return (
    <label className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all group">
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-gray-800 text-center">{file.name}</p>
          <p className="text-xs text-emerald-600 font-medium">Uploaded successfully</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-purple-50 transition-colors">
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </div>
          <p className="font-semibold text-gray-700 text-sm text-center">{label}</p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      )}
    </label>
  )
}

const stepsMeta = [
  { icon: Briefcase, label: 'About You' },
  { icon: Store, label: 'Your Shop' },
  { icon: FileText, label: 'NIC Proof' },
  { icon: ShieldCheck, label: 'Verification' },
]

export default function TailorVerification() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const isDemo = user?._demo

  const [step, setStep] = useState(1)
  const [nicFront, setNicFront] = useState(null)
  const [nicBack, setNicBack] = useState(null)

  // Auto-fill phone from signup — tailor can change it if needed
  const signupPhone = user?.phone || ''
  const defaultShopPhone = signupPhone && signupPhone.trim() !== '+94' ? signupPhone : '+94 '

  const [form, setForm] = useState({
    nicNumber: '', specialization: '', experience: '', bio: '',
    shopName: '', shopAddress: '', phoneNumber: defaultShopPhone,
  })

  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (error) setError('')
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!form.specialization || !form.experience) {
        setError('Please select your specialization and experience.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!form.shopName || !form.phoneNumber || !form.shopAddress) {
        setError('Please fill in all shop details.')
        return
      }

      const phone = form.phoneNumber.trim().replace(/\s/g, '')
      if (phone.startsWith('+94')) {
        if (!/^\+94\d{9}$/.test(phone)) {
          setError('Enter a valid Sri Lankan number: +94 followed by 9 digits (e.g. +94 77 123 4567).')
          return
        }
      } else if (phone.startsWith('0')) {
        if (!/^0\d{9}$/.test(phone)) {
          setError('Enter a valid phone: 0 followed by 9 digits (e.g. 077 123 4567).')
          return
        }
      } else {
        setError('Phone number must start with +94 or 0.')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!nicFront || !form.nicNumber) {
        setError('Please upload your NIC photo and enter the NIC number.')
        return
      }
      setStep(4)
      startAIScan()
    }
  }

  const startAIScan = async () => {
    setIsScanning(true)
    setError('')

    try {
      const result = await aiVerificationService.verifyDocument(nicFront, form.nicNumber)
      setScanResult(result)
      setIsScanning(false)

      if (result.status === 'valid') {
        setTimeout(() => handleSubmit(), 2000)
      } else {
        setError(result.details)
      }
    } catch (err) {
      setIsScanning(false)
      setError('Verification system is temporarily unavailable. Please try again.')
    }
  }

  const handleSubmit = async () => {
    if (isDemo) {
      // Demo user: keep existing mock behavior with updateUser()
      updateUser({
        verificationStatus: 'pending',
        nicSubmitted: true,
        role: 'tailor',
        nicFront: '/temp_docs/nic_front.png',
        nicBack: '/temp_docs/nic_back.png',
        ...form
      })
      navigate('/tailor/pending', { replace: true })
      return
    }

    // Real user: submit to backend API
    setSubmitting(true)
    setError('')
    try {
      // Step 1: Update tailor profile with form data
      // Map experience string to integer for backend validation
      const experienceMap = { 'Less than 1 year': 0, '1–3 years': 2, '3–5 years': 4, '5–10 years': 7, '10+ years': 12 }
      await tailorService.updateProfile({
        specialization: form.specialization,
        experience: experienceMap[form.experience] ?? (parseInt(form.experience, 10) || 0),
        bio: form.bio,
        shopName: form.shopName,
        shopAddress: form.shopAddress,
        shopPhone: form.phoneNumber?.replace(/\s/g, ''),
        nicNumber: form.nicNumber,
      })

      // Step 2: Upload NIC images
      const fd = new FormData()
      fd.append('nicFront', nicFront)
      if (nicBack) {
        fd.append('nicBack', nicBack)
      }
      await tailorService.uploadNic(fd)

      // Step 3: Update local auth user state and navigate
      updateUser({
        verificationStatus: 'pending',
        nicSubmitted: true,
        role: 'tailor',
      })
      navigate('/tailor/pending', { replace: true })
    } catch (err) {
      console.error('Verification submission failed:', err)
      setError(err.message || err.response?.data?.message || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  // --- Progress Stepper ---
  const renderStepper = () => (
    <div className="flex items-center justify-center gap-0 w-full max-w-xl mx-auto">
      {stepsMeta.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              step > i + 1 ? 'bg-emerald-500 text-white'
                : step === i + 1 ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step > i + 1 ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${
              step === i + 1 ? 'text-purple-700' : step > i + 1 ? 'text-emerald-600' : 'text-gray-400'
            }`}>{s.label}</span>
          </div>
          {i < 3 && (
            <div className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] rounded-full transition-colors duration-300 ${
              step > i + 1 ? 'bg-emerald-300' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  // --- Step 1: About You ---
  const renderStep1 = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tell us about yourself</h3>
          <p className="text-sm text-gray-500">What type of tailoring do you specialize in?</p>
        </div>
      </div>

      <div className="space-y-5">
        <Select label="Your Specialization *" value={form.specialization} onChange={set('specialization')}>
          <option value="">What do you stitch best?</option>
          {specializations.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Years of Experience *" value={form.experience} onChange={set('experience')}>
          <option value="">How long have you been tailoring?</option>
          {['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'].map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">About Your Work (Optional)</label>
          <textarea rows={3} value={form.bio} onChange={set('bio')}
            placeholder="e.g. I specialize in bridal lehengas with 8 years of experience..."
            className="input-field resize-none" />
        </div>

        <Button onClick={handleNext} fullWidth size="lg" className="rounded-xl mt-2">
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  // --- Step 2: Shop Details ---
  const renderStep2 = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Your Shop Details</h3>
          <p className="text-sm text-gray-500">Where can customers find you?</p>
        </div>
      </div>

      <div className="space-y-5">
        <Input label="Shop / Studio Name *" value={form.shopName} onChange={set('shopName')}
          placeholder="e.g. Raja Tailors" icon={<Store className="w-4 h-4" />} />
        <Input label="Shop Address *" value={form.shopAddress} onChange={set('shopAddress')}
          placeholder="Street, Area, City, District" icon={<MapPin className="w-4 h-4" />} />
        <Input label="Contact Number *" value={form.phoneNumber} onChange={set('phoneNumber')}
          placeholder="+94 77 123 4567" icon={<Phone className="w-4 h-4" />}
          hint={signupPhone ? 'Auto-filled from your signup. You can change it if needed.' : '+94 followed by 9 digits'} />

        <div className="flex gap-3 pt-2">
          <Button variant="outline" fullWidth onClick={() => setStep(1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={handleNext} fullWidth>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )

  // --- Step 3: ID Verification ---
  const renderStep3 = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">NIC Verification</h3>
          <p className="text-sm text-gray-500">Upload your National Identity Card for verification</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadBox label="NIC Front Side *" hint="Clear photo, no blur" file={nicFront}
            onChange={e => setNicFront(e.target.files[0])} />
          <ImageUploadBox label="NIC Back Side" hint="Optional but recommended" file={nicBack}
            onChange={e => setNicBack(e.target.files[0])} />
        </div>

        <Input label="NIC Number *" value={form.nicNumber} onChange={set('nicNumber')}
          placeholder="e.g. 199512345V or 200012345678"
          icon={<ShieldCheck className="w-4 h-4" />}
          hint="Old format: 9 digits + V/X · New format: 12 digits" />

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Our system will verify your NIC automatically. Make sure the photo is clear with no glare or blur.
            Your data is encrypted and only visible to authorized administrators.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" fullWidth onClick={() => setStep(2)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={handleNext} fullWidth>
            Verify & Submit <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )

  // --- Step 4: AI Scanning ---
  const renderStep4 = () => (
    <div className="bg-dark rounded-2xl p-10 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
        <div className={`h-full bg-purple-500 transition-all duration-[2500ms] ease-out ${isScanning ? 'w-full' : 'w-0'}`} />
      </div>

      <div className="relative z-10 space-y-6">
        {isScanning ? (
          <>
            <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto flex items-center justify-center p-3">
              <div className="w-full h-full rounded-full border-4 border-white/10 border-b-white animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Verifying Your NIC</h2>
              <p className="text-gray-400 text-sm mt-2 animate-pulse">Scanning documents...</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-left py-2">
              {['Reading text', 'Checking format', 'Verifying NIC', 'Matching data'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" /> {t}
                </div>
              ))}
            </div>
          </>
        ) : scanResult?.status === 'valid' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-400">Verification Successful!</h2>
              <p className="text-gray-400 text-sm mt-2">Confidence: {(scanResult.confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="py-6">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-1 h-10 bg-emerald-500/30 rounded-full" />
                <p className="text-sm text-emerald-400 font-medium">
                  {submitting ? 'Submitting your profile...' : 'Setting up your account...'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-red-400">Verification Failed</h2>
              <div className="p-4 bg-red-950/40 rounded-xl border border-red-900/50 max-w-md mx-auto">
                <p className="text-sm text-red-200 leading-relaxed">{scanResult?.details || error}</p>
              </div>
              <Button onClick={() => { setStep(3); setScanResult(null); setError('') }} variant="outline"
                className="text-white border-white/20 hover:bg-white/10 mt-4 rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back & Retry
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-16 pt-8 px-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="text-sm text-gray-500">Just a few steps to start receiving orders on TexHub</p>
      </div>

      {/* Progress Stepper */}
      {renderStepper()}

      {/* Error banner */}
      {error && step < 4 && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Footer note */}
      {step < 4 && (
        <p className="text-center text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Your information is encrypted and securely stored. Only verified administrators can access your documents.
        </p>
      )}
    </div>
  )
}
