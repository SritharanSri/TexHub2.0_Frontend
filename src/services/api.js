import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('texhub_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Let browser set Content-Type with boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Unwrap response data, handle 401 auto-logout
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || 'Network error'

    if (status === 401) {
      // Only auto-redirect if there was a token (i.e., real user session expired)
      // Don't redirect if already on login page or if no token (demo mode)
      const hadToken = !!localStorage.getItem('texhub_token')
      localStorage.removeItem('texhub_token')
      localStorage.removeItem('texhub_user')
      if (hadToken && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/verify-otp')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject({ status, message, raw: error })
  }
)

// Build full URL for uploaded files (avatars, NIC docs, slip images, etc.)
export const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
  const base = baseUrl.includes('/api/v1') ? baseUrl.substring(0, baseUrl.indexOf('/api/v1')) : baseUrl.replace(/\/api\/.*$/, '')
  return `${base}/${path.replace(/^\//, '')}`
}

export default api
