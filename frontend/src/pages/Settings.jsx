import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Loader2, User, Bell, Palette, Database, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']
const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data & Privacy', icon: Database },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      name: user?.name || '',
      currency: user?.currency || 'INR',
      monthlyIncome: user?.monthlyIncome || 0,
      timezone: user?.timezone || 'Asia/Kolkata',
    },
  })

  const profileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: ({ user: updated }) => {
      updateUser(updated)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const notifMutation = useMutation({
    mutationFn: (prefs) => authService.updateProfile({ notifPrefs: prefs }),
    onSuccess: ({ user: updated }) => { updateUser(updated); toast.success('Preferences saved!') },
  })

  const handleLogout = () => { logout(); navigate('/auth') }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">Settings</h1>
        <p className="text-white/40 text-sm">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="col-span-1">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === id
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-pink/60 hover:text-accent-pink hover:bg-accent-pink/10 transition-all mt-4"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-3">
          {activeSection === 'profile' && (
            <div className="card p-6">
              <h2 className="text-white font-semibold mb-6">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-2xl font-bold text-accent-purple">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{user?.name}</p>
                  <p className="text-white/40 text-sm">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} className="space-y-5">
                <div>
                  <label className="label">Display Name</label>
                  <input {...register('name')} className="input" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Currency</label>
                    <select {...register('currency')} className="input">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Monthly Income</label>
                    <input type="number" min="0" {...register('monthlyIncome')} className="input" />
                  </div>
                </div>

                <div>
                  <label className="label">Timezone</label>
                  <select {...register('timezone')} className="input">
                    {['Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Singapore'].map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={!isDirty || profileMutation.isPending} className="btn-primary flex items-center gap-2 disabled:opacity-40">
                  {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-white font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'email',        label: 'Email notifications',   desc: 'Receive alerts via email' },
                  { key: 'budgetAlerts', label: 'Budget alerts',         desc: 'Notify when approaching budget limit' },
                  { key: 'weeklyDigest', label: 'Weekly digest',         desc: 'Sunday morning spending summary email' },
                  { key: 'push',         label: 'Push notifications',    desc: 'In-app real-time alerts' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                    <div>
                      <p className="text-sm text-white font-medium">{label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...user.notifPrefs, [key]: !user.notifPrefs?.[key] }
                        notifMutation.mutate(updated)
                        updateUser({ notifPrefs: updated })
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        user?.notifPrefs?.[key] ? 'bg-accent-green' : 'bg-bg-card border border-white/10'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        user?.notifPrefs?.[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="card p-6">
              <h2 className="text-white font-semibold mb-6">Data &amp; Privacy</h2>
              <div className="space-y-4">
                <div className="p-4 bg-bg-tertiary rounded-xl">
                  <p className="text-sm font-medium text-white mb-1">Export All Data</p>
                  <p className="text-xs text-white/40 mb-3">Download all your expenses and budgets as a JSON file.</p>
                  <button className="btn-ghost text-sm px-4 py-2">Export JSON</button>
                </div>
                <div className="p-4 bg-accent-pink/5 border border-accent-pink/20 rounded-xl">
                  <p className="text-sm font-medium text-accent-pink mb-1">Delete Account</p>
                  <p className="text-xs text-white/40 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
                  <button className="btn-danger text-sm px-4 py-2">Delete Account</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
