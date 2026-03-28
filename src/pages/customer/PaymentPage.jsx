import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, CreditCard, Landmark, Package, ArrowLeft, Lock, Upload, Search, ShieldCheck, AlertCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import { quotations as mockQuotations } from '../../services/mockData'
import { paymentService } from '../../services/paymentService'
import { orderService } from '../../services/orderService'
import { useAuth } from '../../hooks/useAuth'

const paymentMethods = [
  { id: 'card', label: 'Card Payment', icon: CreditCard, desc: 'Securely pay via Credit or Debit card' },
  { id: 'bank', label: 'Bank Deposit', icon: Landmark, desc: 'Transfer to account & upload slip' },
]

// Hardcoded bank details (no public endpoint yet)
const adminBank = {
  bankName: 'State Bank of India',
  accountNumber: '1234 5678 9012',
  accountName: 'TexHub Escrow Pvt Ltd',
  branch: 'Chennai Main Branch',
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)
  const { user } = useAuth()

  const isDemo = !!user?._demo

  // Get orderId from route state or fall back
  const routeOrderId = location.state?.orderId

  const [orderData, setOrderData] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const [method, setMethod] = useState('card')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bankStep, setBankStep] = useState(1) // 1: Details + Upload, 2: Confirmation
  const [slipFile, setSlipFile] = useState(null)
  const [slipPreview, setSlipPreview] = useState(null)
  const [cardNumber, setCardNumber] = useState('')

  // Fetch order details on mount
  useEffect(() => {
    if (isDemo || !routeOrderId) {
      // Demo users: use mock quotation data
      const mock = mockQuotations[1] || mockQuotations[0]
      setOrderData({
        orderId: mock?.orderId || 'ORD-C01',
        item: mock?.item || 'Kurta',
        tailorName: mock?.tailorName || 'Ravi Tailor',
        amount: mock?.amount || 950,
      })
      return
    }

    let cancelled = false
    setFetchLoading(true)
    orderService.getById(routeOrderId)
      .then(res => {
        if (cancelled) return
        const o = res.data || res
        setOrderData({
          orderId: o.id,
          orderNumber: o.orderNumber || o.id,
          item: o.clothType || o.item || 'Custom Garment',
          tailorName: o.tailor?.name || 'Tailor',
          amount: parseFloat(o.quotationAmount || o.amount) || 0,
        })
      })
      .catch(err => {
        if (!cancelled) {
          setFetchError(err?.response?.data?.message || 'Failed to load order details.')
        }
      })
      .finally(() => { if (!cancelled) setFetchLoading(false) })
    return () => { cancelled = true }
  }, [routeOrderId, isDemo])

  // Computed values
  const baseAmount = orderData?.amount || 0
  const platformFee = Math.round(baseAmount * 0.10)
  const total = baseAmount + platformFee

  const handlePayCard = async () => {
    setLoading(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1500))
      } else {
        await paymentService.submitCard(orderData.orderId, { amount: total, cardLast4: cardNumber.slice(-4) || '0000' })
      }
      setSuccess(true)
    } catch (err) {
      alert(err?.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSlipFile(file)
    setSlipPreview(URL.createObjectURL(file))
    setBankStep(2)
  }

  const handleSubmitBankSlip = async () => {
    setLoading(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1500))
      } else {
        const fd = new FormData()
        fd.append('slipImage', slipFile)
        fd.append('amount', total)
        fd.append('bankName', adminBank?.bankName || '')
        fd.append('depositorName', user?.name || '')
        fd.append('depositDate', new Date().toISOString())
        await paymentService.submitBankDeposit(orderData.orderId, fd)
      }
      setSuccess(true)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit deposit slip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while fetching order
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto animate-pulse">
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Loading payment details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-600 font-medium">{fetchError}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  // No order data
  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-gray-500 font-medium">No order selected for payment.</p>
          <Button onClick={() => navigate('/customer/bids')}>View Quotations</Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 fade-in">
        <div className="relative">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gray-900 flex items-center justify-center mx-auto shadow-2xl rotate-12 scale-110">
            <CheckCircle className="w-16 h-16 text-white -rotate-12" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl border-4 border-white">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
            {method === 'card' ? 'Payment Successful.' : 'Slip Uploaded.'}
          </h2>
          <p className="text-gray-400 text-lg font-medium max-w-md mx-auto">
            {method === 'card'
              ? `Rs.${total.toLocaleString()} has been secured and your order is confirmed.`
              : 'Our team will verify your bank deposit within 24 hours.'}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-8 max-w-md w-full text-left space-y-4 shadow-xl shadow-gray-100/50">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${method === 'card' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {method === 'card' ? 'Production Active' : 'Verification Pending'}
            </p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            {method === 'card'
              ? `Your tailor, ${orderData.tailorName}, has been notified and can begin working on your order immediately.`
              : 'You will receive a notification and email once an admin approves your deposit slip.'}
          </p>
        </div>

        <Button onClick={() => navigate('/customer/my-orders')} className="rounded-2xl px-12 py-5 font-black uppercase tracking-widest bg-gray-900 text-white hover:scale-105 transition-all shadow-2xl shadow-gray-200">
          Track My Order →
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Settlement</h1>
          <p className="text-gray-400 font-medium">Secure your custom order with TexHub Escrow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Service Summary</p>
            <div className="space-y-6 relative z-10">
              <div>
                <h3 className="text-2xl font-black tracking-tight">{orderData.item}</h3>
                <p className="text-white/60 text-sm font-medium">by {orderData.tailorName}</p>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-white/40">Base Investment</span>
                  <span>Rs.{baseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-white/40">Platform Fee (10%)</span>
                  <span>Rs.{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-4">
                  <span>Total Capital</span>
                  <span className="text-emerald-400">Rs.{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 tracking-tight">TexHub Escrow</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Universal Security</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Funds are held in a secure vault. We only release payment to the tailor once you confirm the final fitting meets your specifications.
            </p>
          </div>
        </div>

        {/* Right: Payment Method */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Select Method</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {paymentMethods.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => { setMethod(pm.id); setBankStep(1); }}
                  className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group ${
                    method === pm.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                    method === pm.id ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 text-gray-400'
                  }`}>
                    <pm.icon className="w-6 h-6" />
                  </div>
                  <p className="font-black text-gray-900 text-sm tracking-tight">{pm.label}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{pm.desc}</p>
                  {method === pm.id && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </button>
              ))}
            </div>

            {method === 'card' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black tracking-widest focus:border-gray-900 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">CVC</label>
                        <input
                          type="password"
                          placeholder="***"
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-gray-900 focus:bg-white outline-none transition-all text-center"
                        />
                      </div>
                    </div>
                 </div>
                 <Button onClick={handlePayCard} loading={loading} className="w-full py-6 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] shadow-2xl shadow-gray-200 transition-all">
                    Initialize Secure Payment →
                 </Button>
              </div>
            )}

            {method === 'bank' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                 {bankStep === 1 && (
                   <div className="space-y-6">
                      <div className="bg-blue-50/50 rounded-3xl p-6 border-2 border-dashed border-blue-100 space-y-4">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Official Repository</p>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bank</p>
                            <p className="font-black text-gray-900 text-sm">{adminBank.bankName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account</p>
                            <p className="font-black text-gray-900 text-sm">{adminBank.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Holder</p>
                            <p className="font-black text-gray-900 text-sm">{adminBank.accountName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Branch</p>
                            <p className="font-black text-gray-900 text-sm">{adminBank.branch}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-200 text-center space-y-4 hover:border-gray-900 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto text-gray-400">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">Upload Deposit Slip</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                   </div>
                 )}

                 {bankStep === 2 && slipFile && (
                   <div className="space-y-6">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-emerald-900">Slip Uploaded</p>
                          <p className="text-xs text-emerald-600 font-medium">{slipFile.name} - Ready to submit for verification.</p>
                        </div>
                      </div>

                      {slipPreview && (
                        <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 flex justify-center">
                          <img src={slipPreview} alt="Deposit slip" className="max-h-48 rounded-xl object-contain" />
                        </div>
                      )}

                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Payment Summary</p>
                        <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                          <span className="text-gray-400 font-medium">Amount</span>
                          <span className="font-black text-emerald-600">Rs.{total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button onClick={() => { setBankStep(1); setSlipFile(null); setSlipPreview(null); }} className="flex-1 py-5 rounded-2xl border-2 border-gray-100 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Re-upload Slip</Button>
                        <Button onClick={handleSubmitBankSlip} loading={loading} className="flex-[2] py-5 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-gray-200 hover:scale-105 transition-all">Submit for Verification →</Button>
                      </div>
                   </div>
                 )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border border-gray-100 rounded-[2rem]">
            <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
              Protected by military-grade 256-bit encryption. Your financial metadata is never stored on our local repositories.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
