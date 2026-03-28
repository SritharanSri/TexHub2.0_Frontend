import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const { login, googleAuth } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const googleBtnRef = useRef(null)

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
        setError(err.message || 'Google sign-in failed.')
      } finally {
        setLoading(false)
      }
    }

    const waitForGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(waitForGoogle, 100)
        return
      }
      // Only initialize once globally to avoid GSI_LOGGER warnings
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
    setError('')
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const res = await login(form.email, form.password)
      if (res.token) {
        // 2FA disabled — backend returned token directly, useAuth already stored it
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
      } else {
        // OTP required
        const purpose = res.requiresVerification ? 'email_verify' : 'login_2fa'
        navigate('/verify-otp', { state: { userId: res.userId, purpose } })
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="mb-7">
        <h2 className="text-3xl font-black text-gray-900">Welcome back!</h2>
        <p className="text-gray-500 mt-2">Sign in to your TexHub account</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email Address" type="email" placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
              className="input-field pl-10 pr-10"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-purple-600 font-medium hover:underline">Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">Sign In</Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Sign-In button rendered by GSI */}
        <div ref={googleBtnRef} className="flex justify-center [&>div]:w-full" />
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-purple-600 font-semibold hover:underline">Sign up free</Link>
      </p>
    </div>
  )
}
