import api from './api'

export const adminService = {
  // Dashboard
  getDashboard:      ()           => api.get('/admin/dashboard'),

  // Users
  listUsers:         (params)     => api.get('/admin/users', { params }),
  getUserById:       (id)         => api.get(`/admin/users/${id}`),
  toggleSuspend:     (id)         => api.put(`/admin/users/${id}/suspend`),

  // Tailor Verification
  getPendingTailors: (params)     => api.get('/admin/tailors/pending', { params }),
  verifyTailor:      (id, data)   => api.put(`/admin/tailors/${id}/verify`, data),

  // Orders
  listOrders:        (params)     => api.get('/admin/orders', { params }),
  getOrderDetail:    (id)         => api.get(`/admin/orders/${id}`),

  // Payments
  listPayments:      (params)     => api.get('/admin/payments', { params }),
  verifyPayment:     (id, data)   => api.put(`/admin/payments/${id}/verify`, data),

  // Escrow
  listEscrows:       (params)     => api.get('/admin/escrows', { params }),
  releaseEscrow:     (id)         => api.put(`/admin/escrows/${id}/release`),
  refundEscrow:      (id)         => api.put(`/admin/escrows/${id}/refund`),

  // Complaints
  listComplaints:    (params)     => api.get('/admin/complaints', { params }),
  resolveComplaint:  (id, data)   => api.put(`/admin/complaints/${id}/resolve`, data),

  // Bank Details
  getBankDetails:    ()           => api.get('/admin/bank-details'),
  createBankDetail:  (data)       => api.post('/admin/bank-details', data),
  updateBankDetail:  (id, data)   => api.put(`/admin/bank-details/${id}`, data),
  deleteBankDetail:  (id)         => api.delete(`/admin/bank-details/${id}`),
}
