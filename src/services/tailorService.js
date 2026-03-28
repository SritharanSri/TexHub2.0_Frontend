import api from './api'

export const tailorService = {
  getMyProfile:     ()         => api.get('/tailors/me/profile'),
  updateProfile:    (data)     => api.put('/tailors/me/profile', data),
  uploadNic:        (formData) => api.post('/tailors/me/nic', formData),
  getPublicProfile: (id)       => api.get(`/tailors/${id}/public`),
  getStats:         (id)       => api.get(`/tailors/${id}/stats`),
}
