import api from './api'

export const authService = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  signup:         (data)            => api.post('/auth/signup', data),
  verifyOtp:      (data)            => api.post('/auth/verify-otp', data),
  resendOtp:      (data)            => api.post('/auth/resend-otp', data),
  googleAuth:     (idToken)         => api.post('/auth/google', { idToken }),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)            => api.post('/auth/reset-password', data),
}
