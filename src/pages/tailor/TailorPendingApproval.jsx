import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, Upload, RefreshCw, Mail, Phone } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

const steps = [
  { icon: '📝', title: 'Registration', desc: 'Account created', done: true },
  { icon: '🪪', title: 'Documents Submitted', desc: 'NIC uploaded', done: true },
  { icon: '🔍', title: 'Admin Review', desc: 'Under verification', done: false, active: true },
  { icon: '✅', title: 'Approved', desc: 'Start receiving orders', done: false },
]

export default function TailorPendingApproval() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isRejected = user?.verificationStatus === 'rejected'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full p-8">
        {/* Status icon */}
        <div className="flex flex-col items-center mb-8">
          {isRejected ? (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4 relative">
              <Clock className="w-10 h-10 text-amber-600" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-ping opacity-30" />
            </div>
          )}
          <h1 className="text-2xl font-black text-gray-900 text-center">
            {isRejected ? 'Application Rejected' : 'Verification Pending'}
          </h1>
          <p className="text-gray-500 text-sm text-center mt-2">
            {isRejected
              ? 'Unfortunately your application was not approved. Please re-submit with correct documents.'
              : `Hi ${user?.name || 'Tailor'}! Your documents are under review. We'll notify you via email within 1–2 business days.`}
          </p>
        </div>

        {/* Progress steps */}
        <div className="relative mb-8">
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  s.done ? 'bg-green-500 text-white'
                    : s.active && !isRejected ? 'bg-amber-100 border-2 border-amber-400 text-amber-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {s.done ? <CheckCircle className="w-5 h-5" /> : s.icon}
                </div>
                <div className="pt-1.5">
                  <p className={`font-semibold text-sm ${s.done ? 'text-green-700' : s.active && !isRejected ? 'text-amber-700' : 'text-gray-400'}`}>
                    {s.title}
                  </p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimated time */}
        {!isRejected && (
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6">
            <p className="text-purple-800 font-semibold text-sm mb-1">⏱ Estimated Approval Time</p>
            <p className="text-purple-600 text-xs">1–2 business days. You'll receive an email at <strong>{user?.email}</strong></p>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-800 font-semibold text-sm mb-1">Reason for rejection</p>
            <p className="text-red-600 text-sm">Document quality was insufficient. Please upload clear, unblurred NIC photos.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isRejected ? (
            <Button onClick={() => navigate('/tailor/verify')} fullWidth>
              <Upload className="w-4 h-4" /> Re-submit Documents
            </Button>
          ) : (
            <Button variant="secondary" fullWidth onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" /> Check Status
            </Button>
          )}

          <div className="flex gap-2">
            <a href="mailto:support@texhub.com"
              className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-purple-600 bg-gray-50 border border-gray-200 rounded-xl py-2.5 transition-colors">
              <Mail className="w-4 h-4" /> Email Support
            </a>
            <button onClick={() => { logout(); navigate('/login') }}
              className="flex-1 flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 bg-gray-50 border border-gray-200 rounded-xl py-2.5 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
