import api from './api'

const PAYMENTS_KEY = 'texhub_payments'
const BANK_DETAILS_KEY = 'texhub_admin_bank'
const loadPayments = () => JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]')
const savePayments = (data) => localStorage.setItem(PAYMENTS_KEY, JSON.stringify(data))

const defaultAdminBank = {
  bankName: 'State Bank of India',
  accountName: 'TexHub Escrow Pvt Ltd',
  accountNumber: '1234 5678 9012',
  branch: 'Chennai Main Branch',
  swiftCode: 'SBININBB',
  logo: '',
}

export const paymentService = {
  submitBankDeposit: (orderId, formData) =>
    api.post(`/orders/${orderId}/payments/bank-deposit`, formData),
  submitCard:   (orderId, data) => api.post(`/orders/${orderId}/payments/card`, data),
  getByOrder:   (orderId)       => api.get(`/orders/${orderId}/payments`),

  // Demo-only: get pending demo payments
  getPendingPayments() {
    return loadPayments().filter(p => p.status === 'pending_verification')
  },

  // Demo-only: verify (approve/reject) a demo payment
  verifyPayment(orderId, approved, rejectionReason) {
    const data = loadPayments()
    const updated = data.map(p =>
      p.orderId === orderId
        ? { ...p, status: approved ? 'approved' : 'rejected', rejectionReason: approved ? null : rejectionReason }
        : p
    )
    savePayments(updated)
    return true
  },

  // Demo-only: get/set admin bank details
  getAdminBankDetails() {
    const stored = localStorage.getItem(BANK_DETAILS_KEY)
    return stored ? JSON.parse(stored) : { ...defaultAdminBank }
  },

  updateAdminBankDetails(details) {
    localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(details))
    return details
  },
}
