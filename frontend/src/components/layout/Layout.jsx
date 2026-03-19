import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, PlusCircle, Clock, Lightbulb,
  Target, MessageCircle, Settings, LogOut, Wallet
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/add',       icon: PlusCircle,      label: 'Add Expense' },
  { to: '/history',   icon: Clock,           label: 'History' },
  { to: '/insights',  icon: Lightbulb,       label: 'AI Insights' },
  { to: '/budgets',   icon: Target,          label: 'Budgets' },
  { to: '/chat',      icon: MessageCircle,   label: 'AI Chat' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/auth') }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-bg-secondary border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-green/20 border border-accent-green/30 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-accent-green" />
            </div>
            <span className="font-serif text-lg text-white">FinanceAI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings + User */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-white/[0.06] pt-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>

          {/* User chip */}
          <div className="flex items-center gap-3 px-3 py-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-xs font-bold text-accent-purple">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-white/30 hover:text-accent-pink transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
