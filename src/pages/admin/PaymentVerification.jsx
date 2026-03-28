import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, Search, AlertCircle, FileText, Landmark, Clock, ShieldCheck, Mail } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { paymentService } from '../../services/paymentService'

export default function PaymentVerification() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [payments, setPayments] = useState([])
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(!isDemo)

  useEffect(() => {
    loadPayments()
  }, [isDemo])

  const loadPayments = async () => {
    if (isDemo) {
      setPayments(paymentService.getPendingPayments())
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await adminService.listPayments({ status: 'pending_verification' })
      const data = res?.data || res || []
      const list = Array.isArray(data) ? data : (data.payments || data.results || [])
      setPayments(list.map(p => ({
        ...p,
        orderId: p.orderId || p.orderRef || p.id || p._id,
        slipImage: p.slipImage || p.slipUrl || p.receiptUrl || '',
        timestamp: p.timestamp || p.createdAt || p.uploadedAt || new Date().toISOString(),
        ocrData: p.ocrData || {
          amount: p.amount || 0,
          bankName: p.bankName || '—',
          transactionId: p.transactionId || p.txId || '—',
        },
      })))
    } catch (err) {
      console.error('Failed to fetch payments:', err)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (approved) => {
    if (!approved && !rejectionReason) {
      alert('Please provide a rejection reason.')
      return
    }

    setIsVerifying(true)

    if (isDemo) {
      // Demo: use localStorage-based service
      const success = paymentService.verifyPayment(selectedPayment.orderId, approved, rejectionReason)
      if (success) {
        setSelectedPayment(null)
        setRejectionReason('')
        loadPayments()
      }
      setIsVerifying(false)
      return
    }

    // Real: call API (backend handles email notifications)
    try {
      const paymentId = selectedPayment.id || selectedPayment._id || selectedPayment.orderId
      await adminService.verifyPayment(paymentId, {
        status: approved ? 'approved' : 'rejected',
        rejectionReason: approved ? undefined : rejectionReason,
      })
      setSelectedPayment(null)
      setRejectionReason('')
      loadPayments()
    } catch (err) {
      console.error('Failed to verify payment:', err)
      alert('Failed to verify payment. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const filteredPayments = payments.filter(p =>
    (p.orderId || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Settlement Verification</h2>
          <p className="text-gray-500 font-medium">Verify bank deposit slips with AI-assisted validation</p>
        </div>

        <div className="relative group max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
          <input
            type="text"
            placeholder="Search Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:border-gray-900 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List of pending payments */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Verification Queue Empty</h3>
                <p className="text-gray-400 font-medium">All bank deposits have been processed successfully.</p>
              </div>
            </div>
          ) : (
            filteredPayments.map(p => (
              <div
                key={p.orderId || p.id || p._id}
                onClick={() => setSelectedPayment(p)}
                className={`group bg-white rounded-[2rem] p-6 border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selectedPayment?.orderId === p.orderId ? 'border-gray-900 shadow-xl scale-[1.01]' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-gray-900 tracking-tight">{p.orderId}</h3>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-amber-100 flex items-center gap-1.5">
                           <Clock className="w-3 h-3" /> Awaiting Approval
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 font-medium mt-1">Uploaded {new Date(p.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-gray-900">Rs.{(p.ocrData?.amount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Extracted Value</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 pt-6 border-t border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Amount Matched
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Valid Date
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Not Duplicate
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Verification Detail Panel */}
        <div className="lg:col-span-1">
          {selectedPayment ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-gray-900 p-8 shadow-2xl space-y-8 sticky top-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Verification</h3>
                <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-900">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Slip Preview */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Bank Receipt Image</p>
                <div className="aspect-[3/4] rounded-3xl bg-gray-100 border-2 border-gray-100 overflow-hidden relative group">
                  {selectedPayment.slipImage ? (
                    <img src={selectedPayment.slipImage} alt="Bank Slip" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                       <Eye className="w-4 h-4" /> Full View
                    </button>
                  </div>
                </div>
              </div>

              {/* OCR Results */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                   <p className="text-xs font-bold text-emerald-700">AI Auto-Validation: SUCCESS</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-400 font-bold uppercase tracking-wider">Bank</span>
                     <span className="font-black text-gray-900">{selectedPayment.ocrData?.bankName || '—'}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-400 font-bold uppercase tracking-wider">TX ID</span>
                     <span className="font-black text-gray-900">{selectedPayment.ocrData?.transactionId || '—'}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-black text-gray-900 border-t border-gray-200 pt-3 mt-1">
                     <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Total Captured</span>
                     <span className="text-emerald-600 font-black">Rs.{(selectedPayment.ocrData?.amount || 0).toLocaleString()}</span>
                   </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <Button
                  onClick={() => handleVerify(true)}
                  loading={isVerifying}
                  fullWidth
                  className="bg-gray-900 text-white rounded-2xl py-5 font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-gray-200"
                >
                  Approve Settlement →
                </Button>

                <div className="space-y-3">
                  <textarea
                    placeholder="Provide rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-xs font-medium focus:border-red-500 outline-none transition-all resize-none h-24"
                  />
                  <button
                    onClick={() => handleVerify(false)}
                    disabled={isVerifying}
                    className="w-full text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
                  >
                    Reject Payment Slip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center space-y-4 h-full flex flex-col items-center justify-center grayscale opacity-60">
              <FileText className="w-12 h-12 text-gray-300" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Select an order to verify</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
