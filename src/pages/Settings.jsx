import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Globe, Moon, Palette, CheckCircle, Loader2 } from 'lucide-react'
import Button from '../components/ui/Button'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../hooks/useAuth'

const settingSections = [
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Manage how and when you receive alerts',
    settings: [
      { key: 'newOrder',    label: 'New Order Alerts',      desc: 'Get notified when a customer places a new order' },
      { key: 'bidUpdate',   label: 'Bid Updates',           desc: 'Alerts when bids are placed on your listings' },
      { key: 'orderStatus', label: 'Order Status Changes',  desc: 'Updates when order status changes' },
      { key: 'messages',    label: 'Customer Messages',     desc: 'Receive in-app and email messages' },
      { key: 'marketing',   label: 'Promotional Emails',    desc: 'News, tips, and platform updates' },
    ],
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Control your data and security settings',
    settings: [
      { key: 'profilePublic', label: 'Public Profile',       desc: 'Allow customers to find your profile' },
      { key: 'twoFactor',    label: 'Two-Factor Auth',       desc: 'Extra security layer for your account' },
      { key: 'activityLog',  label: 'Activity Logging',      desc: 'Track logins and account changes' },
    ],
  },
  {
    id: 'preferences',
    icon: Palette,
    title: 'Preferences',
    description: 'Customize your TexHub experience',
    settings: [
      { key: 'darkMode',    label: 'Dark Mode',              desc: 'Switch to a darker color scheme' },
      { key: 'compactView', label: 'Compact Table View',     desc: 'Show more rows with less padding' },
      { key: 'autoAccept',  label: 'Auto-Accept Low Bids',   desc: 'Automatically accept bids below your minimum', roles: ['customer'] },
    ],
  },
]

export default function Settings() {
  const { settings, setSettings, updateSettings, loaded } = useSettings()
  const { user } = useAuth()
  const role = user?.role
  const [toggles, setToggles] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync local toggles when context settings load
  useEffect(() => {
    if (loaded) setToggles(settings)
  }, [loaded])

  const toggle = (key) => {
    setToggles(t => {
      const updated = { ...t, [key]: !t[key] }
      // Apply dark mode and compact view immediately
      setSettings(updated)
      return updated
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(toggles)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Settings</h2>
          <p className="text-gray-500 text-sm">Configure your TexHub preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Settings saved!
            </div>
          )}
          <Button onClick={handleSave} disabled={saving || !loaded}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <div className="space-y-5">
        {settingSections.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-400">{section.description}</p>
              </div>
            </div>

            {/* Settings list */}
            <div className="divide-y divide-gray-50">
              {section.settings.filter(s => !s.roles || s.roles.includes(role)).map((s) => (
                <div key={s.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => toggle(s.key)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none ${
                      toggles[s.key] ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                      toggles[s.key] ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-red-100 bg-red-50">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-800">Danger Zone</h3>
              <p className="text-sm text-red-400">These actions are irreversible</p>
            </div>
          </div>
          <div className="px-6 py-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Delete Account</p>
              <p className="text-sm text-gray-400">Permanently remove your account and all associated data</p>
            </div>
            <Button variant="danger" className="flex-shrink-0">Delete Account</Button>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
