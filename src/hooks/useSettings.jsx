import { createContext, useContext, useState, useEffect } from 'react'
import { userService } from '../services/userService'

const SettingsContext = createContext({})

const DEFAULTS = {
  newOrder: true, bidUpdate: true, orderStatus: true, messages: true, marketing: false,
  profilePublic: true, twoFactor: true, activityLog: true,
  darkMode: false, compactView: false, autoAccept: false,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('texhub_token'))

  // Watch for token changes (login/logout) via storage events from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'texhub_token') {
        setToken(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Reload settings whenever token changes
  useEffect(() => {
    if (!token) {
      setSettings(DEFAULTS)
      setLoaded(true)
      return
    }
    setLoaded(false)
    userService.getSettings()
      .then(res => {
        const data = res?.data || res || {}
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [token])

  // Apply dark mode to <html> whenever settings change
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', !!settings.darkMode)
  }, [settings.darkMode])

  const updateSettings = async (newSettings) => {
    setSettings(newSettings)
    await userService.updateSettings(newSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings, updateSettings, loaded }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
