import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { socketService } from '../services/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('texhub_token'))
  const [loading, setLoading] = useState(true)

  // On mount: validate existing token
  useEffect(() => {
    if (token) {
      api.get('/users/me')
        .then(res => {
          const userData = res.data
          setUser(userData)
          localStorage.setItem('texhub_user', JSON.stringify(userData))
        })
        .catch(() => {
          localStorage.removeItem('texhub_token')
          localStorage.removeItem('texhub_user')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Real login: POST /auth/login → returns userId + OTP flag, or token directly if 2FA disabled
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    if (res.token) {
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('texhub_token', res.token)
      localStorage.setItem('texhub_user', JSON.stringify(res.user))
    }
    return res // { success, userId, requiresOtp?, requiresVerification?, token?, user? }
  }

  // Real signup: POST /auth/signup → returns userId
  const signup = async (data) => {
    const res = await api.post('/auth/signup', data)
    return res // { success, userId, message }
  }

  // Verify OTP: POST /auth/verify-otp → returns token + user
  const verifyOtp = async (userId, code, purpose) => {
    const res = await api.post('/auth/verify-otp', { userId, code, purpose })
    if (res.token) {
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('texhub_token', res.token)
      localStorage.setItem('texhub_user', JSON.stringify(res.user))
    }
    return res
  }

  // Resend OTP
  const resendOtp = async (userId, purpose) => {
    const res = await api.post('/auth/resend-otp', { userId, purpose })
    return res
  }

  // Google Auth: POST /auth/google → returns token + user directly
  const googleAuth = async (idToken) => {
    const res = await api.post('/auth/google', { idToken })
    if (res.token) {
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('texhub_token', res.token)
      localStorage.setItem('texhub_user', JSON.stringify(res.user))
    }
    return res
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('texhub_token')
    localStorage.removeItem('texhub_user')
    socketService.disconnect()
  }

  // Socket Lifecycle Management
  useEffect(() => {
    if (user && token && !user._demo) {
      socketService.connect(token)
    }
  }, [user, token])

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('texhub_user', JSON.stringify(updated))
      return updated
    })
  }

  const approveTailor = () => updateUser({ verificationStatus: 'approved' })

  // Derive verification status
  const verificationStatus = user?.tailorProfile?.verificationStatus || user?.verificationStatus

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isTailor: user?.role === 'tailor',
      isCustomer: user?.role === 'customer',
      tailorApproved: user?.role === 'tailor' && verificationStatus === 'approved',
      login,
      signup,
      verifyOtp,
      resendOtp,
      googleAuth,
      logout,
      updateUser,
      approveTailor,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
