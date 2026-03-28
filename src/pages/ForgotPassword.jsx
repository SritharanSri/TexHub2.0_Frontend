import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { authService } from '../services/authService'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = email, 2 = OTP + new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)
  const refs = useRef([])

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Step 1: Request reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setStep(2)
      setCountdown(30)
      setSuccess('A 6-digit code has been sent to your email.')
      setTimeout(() => refs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err.message || 'Could not send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP & reset password
  const handleReset = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits.'); return }
    if (!password) { setError('Please enter a new password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      await authService.resetPassword({ email, code, password })
      setSuccess('')
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in with your new password.' } })
    } catch (err) {
      setError(err.message || 'Reset failed. Please check your code and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    try {
      await authService.forgotPassword(email)
      setCountdown(30)
      setSuccess('A new code has been sent to your email.')
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend code.')
    }
  }

  // OTP input handlers
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    setError('')
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || ''
    setOtp(next)
    const focusIdx = Math.min(pasted.length, 5)
    refs.current[focusIdx]?.focus()
  }

  // ── Step 1: Enter email ──
  if (step === 1) {
    return (
      <div className="fade-in">
        <div className="mb-7">
          <h2 className="text-3xl font-black text-gray-900">Forgot Password?</h2>
          <p className="text-gray-500 mt-2">Enter your email and we'll send you a reset code</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            required
          />

          <Button type="submit" fullWidth loading={loading} size="lg">
            Send Reset Code
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/login" className="text-sm text-purple-600 font-semibold hover:underline inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </p>
      </div>
    )
  }

  // ── Step 2: OTP + New Password ──
  return (
    <div className="fade-in">
      <div className="mb-7 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900">Reset Password</h2>
        <p className="text-gray-500 mt-2">
          Enter the code sent to <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>

      {success && (
        <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">{success}</div>
      )}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>
      )}

      <div className="space-y-6">
        {/* OTP Inputs */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Verification Code</label>
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all focus:border-purple-600 focus:ring-4 focus:ring-purple-100 ${
                  error && otp.join('').length === 6 ? 'border-red-400 bg-red-50' : digit ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-gray-50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">New Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="input-field pl-10 pr-10"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
            />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Repeat new password"
          icon={<Lock className="w-4 h-4" />}
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError('') }}
          required
        />

        <Button onClick={handleReset} fullWidth loading={loading} size="lg">
          Reset Password
        </Button>

        {/* Resend / Back */}
        <div className="flex flex-col gap-3 items-center pt-2">
          {countdown > 0 ? (
            <p className="text-sm text-gray-400 font-medium">
              Resend code in <span className="text-gray-900 font-bold">{countdown}s</span>
            </p>
          ) : (
            <button onClick={handleResend} className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Resend Code
            </button>
          )}

          <button onClick={() => { setStep(1); setError(''); setSuccess('') }}
            className="text-sm text-gray-400 font-semibold hover:text-gray-600 flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Use a different email
          </button>
        </div>
      </div>
    </div>
  )
}
