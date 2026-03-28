import api from './api'

export const orderService = {
  // Customer
  create: (formData) => api.post('/orders', formData),
  getMyOrders:    (params) => api.get('/orders/my', { params }),
  getById:        (id)     => api.get(`/orders/${id}`),
  cancel:         (id)     => api.put(`/orders/${id}/cancel`),

  // Tailor
  getOpenOrders:  (params)       => api.get('/orders/open', { params }),
  updateOrder:    (id, data)     => api.put(`/orders/${id}`, data),
  updateProgress: (id, progress) => api.put(`/orders/${id}/progress`, { progress }),
  updateStatus:   (id, status)   => api.put(`/orders/${id}/status`, { status }),
}
