import api from './api'

export const userService = {
  getProfile:     ()     => api.get('/users/me'),
  updateProfile:  (data) => api.put('/users/me', data),
  uploadAvatar:   (file) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return api.put('/users/me/avatar', fd)
  },
  changePassword: (data) => api.put('/users/me/password', data),
  getSettings:    ()     => api.get('/users/me/settings'),
  updateSettings: (data) => api.put('/users/me/settings', data),
}
