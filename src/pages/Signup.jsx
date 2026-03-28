import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Phone, Lock, ChevronRight } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

const roles = [
  { value: 'customer', label: 'Customer', emoji: '👗', desc: 'I want clothes stitched' },
  { value: 'tailor',   label: 'Tailor',   emoji: '✂️', desc: 'I provide stitching services' },
]

export default function Signup() {
  const navigate = useNavigate()
  const { signup, googleAuth } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '+94 ', role: 'customer', password: '', confirm: '',
  })
  const googleBtnRef = useRef(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Set up Google Sign-In with a global callback delegate
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    // Register this page's handler as the active Google callback
    window.__gsiCallback = async (response) => {
      setError('')
      setLoading(true)
      try {
        const res = await googleAuth(response.credential)
        const role = res.user?.role
        const tp = res.user?.tailorProfile
        if (role === 'admin') navigate('/admin/dashboard', { replace: true })
        else if (role === 'customer') navigate('/customer/dashboard', { replace: true })
        else if (role === 'tailor') {
          const vs = tp?.verificationStatus
          if (vs === 'approved') navigate('/dashboard', { replace: true })
          else if (tp?.nicFront) navigate('/tailor/pending', { replace: true })
          else navigate('/tailor/verify', { replace: true })
        } else navigate('/dashboard', { replace: true })
      } catch (err) {
        setError(err.message || 'Google sign-up failed.')
      } finally {
        setLoading(false)
      }
    }

    const waitForGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(waitForGoogle, 100)
        return
      }
      if (!window.__gsi_initialized) {
        window.__gsi_initialized = true
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => window.__gsiCallback?.(response),
        })
      }
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          size: 'large',
          width: 400,
        })
      }
    }
    waitForGoogle()
  }, [googleAuth, navigate])



  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }

    // Phone validation (Sri Lanka: +94 followed by 9 digits, or 10 digits starting with 0)
    const phone = form.phone.trim()
    if (phone && phone !== '+94') {
      const cleaned = phone.replace(/\s/g, '')
      if (cleaned.startsWith('+94')) {
        if (!/^\+94\d{9}$/.test(cleaned)) {
          setError('Enter a valid Sri Lankan number: +94 followed by 9 digits (e.g. +94 77 123 4567).')
          return
        }
      } else if (cleaned.startsWith('0')) {
        if (!/^0\d{9}$/.test(cleaned)) {
          setError('Enter a valid phone number: 0 followed by 9 digits (e.g. 077 123 4567).')
          return
        }
      } else {
        setError('Phone number must start with +94 or 0.')
        return
      }
    }

    setError('')
    setLoading(true)

    try {
      const phoneClean = phone === '+94' ? undefined : phone.replace(/\s/g, '')
      const res = await signup({
        name: form.name,
        email: form.email,
        phone: phoneClean,
        password: form.password,
        role: form.role,
      })
      navigate('/verify-otp', { state: { userId: res.userId, purpose: 'email_verify' } })
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Create Account</h1>
        <p className="text-gray-500 mt-2">Join TexHub and start your journey</p>
      </div>

      {/* Role selection */}
      <div className="flex gap-3 mb-6">
        {roles.map(r => (
          <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
            className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
              form.role === r.value ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
            }`}>
            <span className="text-2xl">{r.emoji}</span>
            <span className="font-bold text-gray-800 text-sm">{r.label}</span>
            <span className="text-xs text-gray-400">{r.desc}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name *" placeholder="Your full name" value={form.name}
          icon={<User className="w-4 h-4" />} onChange={set('name')} required />
        <Input label="Email Address *" type="email" placeholder="you@email.com" value={form.email}
          icon={<Mail className="w-4 h-4" />} onChange={set('email')} required />
        <Input label="Mobile Number" type="tel" placeholder="+94 77 123 4567" value={form.phone}
          icon={<Phone className="w-4 h-4" />} onChange={set('phone')}
          hint="Sri Lankan number (+94 followed by 9 digits)" />

        <div className="relative">
          <Input label="Password *" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
            value={form.password} icon={<Lock className="w-4 h-4" />} onChange={set('password')} required />
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-3 top-8 p-1 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input label="Confirm Password *" type={showPw ? 'text' : 'password'} placeholder="Repeat password"
          value={form.confirm} icon={<Lock className="w-4 h-4" />} onChange={set('confirm')} required />

        {/* Tailor NIC hint */}
        {form.role === 'tailor' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <span className="text-lg">🪪</span>
            <p className="text-amber-800 text-xs">
              <strong>Tailor accounts require NIC verification.</strong> After signup, you'll upload your National Identity Card (NIC) for admin approval before receiving orders.
            </p>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} className="flex items-center justify-center gap-2 mt-2">
          Create Account <ChevronRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <span className="relative px-3 bg-white text-sm text-gray-400 mx-auto flex justify-center w-fit">or continue with</span>
      </div>

      {/* Google Sign-In button rendered by GSI */}
      <div ref={googleBtnRef} className="flex justify-center [&>div]:w-full" />

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-purple-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
