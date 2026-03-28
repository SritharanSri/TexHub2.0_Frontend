import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, RefreshCw, ArrowLeft, Mail } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export default function TwoFactor() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const refs = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const { user, verifyOtp, resendOtp } = useAuth()

  const userId = location.state?.userId
  const purpose = location.state?.purpose || 'login_2fa'

  // Redirect if no userId in state (direct URL access)
  useEffect(() => {
    if (!userId && !user) {
      navigate('/login', { replace: true })
    }
  }, [userId, user, navigate])

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    setError('')
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits'); return }
    setLoading(true)
    try {
      const res = await verifyOtp(userId, code, purpose)
      const role = res.user?.role
      const tailorProfile = res.user?.tailorProfile

      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'customer') navigate('/customer/dashboard', { replace: true })
      else if (role === 'tailor') {
        const vStatus = tailorProfile?.verificationStatus
        if (vStatus === 'approved') navigate('/dashboard', { replace: true })
        else if (tailorProfile?.nicFront) navigate('/tailor/pending', { replace: true })
        else navigate('/tailor/verify', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await resendOtp(userId, purpose)
      setResent(true)
      setCountdown(30)
      setTimeout(() => setResent(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-3xl bg-gray-900 flex items-center justify-center mb-6 shadow-xl shadow-gray-200">
          <ShieldCheck className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 text-center tracking-tight">Security Check</h1>
        <p className="text-gray-400 text-base mt-3 text-center max-w-sm">
          {purpose === 'email_verify'
            ? 'We sent a verification code to your email. Enter it below to verify your account.'
            : 'We sent a 6-digit code to your email. Enter it below to verify your identity.'}
        </p>
      </div>

      {/* OTP Input Section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center gap-2 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-12 h-16 text-center text-3xl font-black rounded-2xl border-2 outline-none transition-all focus:border-gray-900 focus:ring-4 focus:ring-gray-100 ${
                error ? 'border-red-400 bg-red-50' : digit ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-gray-50'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-6 font-semibold">{error}</p>}

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-8 flex items-center gap-3 justify-center">
          <Mail className="w-5 h-5 text-purple-600" />
          <p className="text-gray-600 text-xs">
            Check your email for the OTP code sent by TexHub.
          </p>
        </div>

        <Button onClick={handleVerify} fullWidth loading={loading} className="py-5 text-lg rounded-2xl">
          Verify Identity
        </Button>

        <div className="mt-8 flex flex-col gap-4 items-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray-400 font-medium">Resend code in <span className="text-gray-900 font-bold">{countdown}s</span></p>
          ) : (
            <button onClick={handleResend} className="text-sm font-bold text-gray-900 hover:underline flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {resent ? 'New code sent!' : 'Request new code'}
            </button>
          )}

          <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm text-gray-400 font-bold hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Cancel & Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
