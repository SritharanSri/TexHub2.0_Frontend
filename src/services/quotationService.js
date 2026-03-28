import api from './api'

export const quotationService = {
  create:      (orderId, data) => api.post(`/orders/${orderId}/quotations`, data),
  getForOrder: (orderId)       => api.get(`/orders/${orderId}/quotations`),
  accept:      (quotationId)   => api.put(`/quotations/${quotationId}/accept`),
}
