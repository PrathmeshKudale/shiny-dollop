import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { expenseService, insightService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import { formatCurrency, formatDate, currentMonth, getMonthRange } from '../utils/helpers'
import { PlusCircle, TrendingUp, TrendingDown, Wallet, Lightbulb, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function Dashboard() {
  const { user } = useAuthStore()
  const month = currentMonth()
  const { from, to } = getMonthRange(month)
  const currency = user?.currency || 'INR'

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => expenseService.getSummary({ from, to }),
  })

  const { data: recentData, isLoading: loadingRecent } = useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: () => expenseService.getAll({ limit: 5, sort: '-date' }),
  })

  const { data: insightsData } = useQuery({
    queryKey: ['insights', month],
    queryFn: () => insightService.get(month),
    staleTime: 1000 * 60 * 30,
  })

  const totalSpent = summaryData?.total || 0
  const categories = summaryData?.categories || []
  const recent = recentData?.data || []
  const firstInsight = insightsData?.insights?.[0]

  const hourOfDay = new Date().getHours()
  const greeting = hourOfDay < 12 ? 'Good morning' : hourOfDay < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-white/40 text-sm mb-1">{greeting},</p>
          <h1 className="font-serif text-3xl text-white">{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        <Link to="/add" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Expense
        </Link>
      </div>

      {/* Main metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-accent-pink" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-widest">Spent This Month</span>
          </div>
          <p className="text-2xl font-semibold text-white">{formatCurrency(totalSpent, currency)}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-green" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-widest">Monthly Income</span>
          </div>
          <p className="text-2xl font-semibold text-white">{formatCurrency(user?.monthlyIncome || 0, currency)}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-accent-cyan" />
            </div>
            <span className="text-xs text-white/40 uppercase tracking-widest">Remaining</span>
          </div>
          <p className="text-2xl font-semibold text-white">
            {formatCurrency(Math.max(0, (user?.monthlyIncome || 0) - totalSpent), currency)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Donut chart */}
        <div className="card col-span-2 p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4">Spending by Category</h3>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categories} dataKey="total" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {categories.map((cat, i) => (
                      <Cell key={i} fill={cat.color || '#4ade80'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    formatter={(v) => [formatCurrency(v, currency)]}
                    labelStyle={{ color: '#e8eaf0', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categories.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-white/50 flex-1 truncate">{cat.icon} {cat.name}</span>
                    <span className="text-xs text-white font-medium">{formatCurrency(cat.total, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-white/30 text-sm">
              <p>No expenses yet</p>
              <Link to="/add" className="text-accent-green text-xs mt-1 hover:underline">Add your first expense →</Link>
            </div>
          )}
        </div>

        {/* AI Insight card */}
        <div className="card col-span-3 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent-purple/15 border border-accent-purple/25 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-accent-purple" />
            </div>
            <h3 className="text-sm font-medium text-white/60">AI Insight</h3>
          </div>

          {firstInsight ? (
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xl">{firstInsight.emoji || '💡'}</span>
                <div>
                  <p className="text-white font-medium text-sm mb-1">{firstInsight.title}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{firstInsight.description}</p>
                </div>
              </div>
              {insightsData?.tips?.[0] && (
                <div className="mt-4 p-3 bg-accent-cyan/5 border border-accent-cyan/15 rounded-xl">
                  <p className="text-xs text-accent-cyan/80">💡 Tip: {insightsData.tips[0]}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Add more expenses to unlock AI insights
            </div>
          )}

          <Link to="/insights" className="flex items-center gap-1 text-xs text-accent-purple hover:underline mt-4">
            View all insights <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white/60">Recent Transactions</h3>
          <Link to="/history" className="text-xs text-accent-cyan hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-0.5">
          {recent.length > 0 ? recent.map((expense) => (
            <div key={expense._id} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-bg-card flex items-center justify-center text-lg flex-shrink-0">
                {expense.categoryId?.icon || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{expense.merchant || 'Unknown'}</p>
                <p className="text-xs text-white/40">{expense.categoryId?.name} · {formatDate(expense.date)}</p>
              </div>
              <p className="text-sm font-semibold text-accent-pink">
                -{formatCurrency(expense.amount, currency)}
              </p>
            </div>
          )) : (
            <div className="text-center py-10 text-white/30 text-sm">
              No expenses yet. <Link to="/add" className="text-accent-green hover:underline">Add one now →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
