import { useQuery } from '@tanstack/react-query'
import { insightService, expenseService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import { formatCurrency, currentMonth, getMonthRange } from '../utils/helpers'
import { Lightbulb, TrendingUp, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

export default function Insights() {
  const { user } = useAuthStore()
  const month = currentMonth()
  const { from, to } = getMonthRange(month)
  const currency = user?.currency || 'INR'

  const { data: insightsData, isLoading: loadingInsights, refetch, isFetching } = useQuery({
    queryKey: ['insights', month],
    queryFn: () => insightService.get(month),
    staleTime: 1000 * 60 * 30,
  })

  const { data: anomalyData, isLoading: loadingAnomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: insightService.anomalies,
    staleTime: 1000 * 60 * 30,
  })

  const { data: trendsData } = useQuery({
    queryKey: ['trends'],
    queryFn: insightService.trends,
  })

  const { data: summaryData } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => expenseService.getSummary({ from, to }),
  })

  const insights    = insightsData?.insights || []
  const tips        = insightsData?.tips || []
  const anomalies   = anomalyData?.anomalies || []
  const trends      = trendsData?.trends || []
  const categories  = summaryData?.categories || []

  const INSIGHT_COLORS = { positive: 'accent-green', warning: 'accent-amber', info: 'accent-cyan' }
  const INSIGHT_BG     = { positive: 'bg-accent-green/5 border-accent-green/20', warning: 'bg-accent-amber/5 border-accent-amber/20', info: 'bg-accent-cyan/5 border-accent-cyan/20' }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">AI Insights</h1>
          <p className="text-white/40 text-sm">GPT-4o analysis of your spending patterns</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Insights grid */}
      {loadingInsights ? (
        <div className="flex items-center justify-center gap-3 py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin text-accent-purple" />
          <span className="text-sm">Generating insights with GPT-4o…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {insights.map((insight, i) => (
              <div key={i} className={`card p-5 border ${INSIGHT_BG[insight.type] || INSIGHT_BG.info}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.emoji || '💡'}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{insight.title}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="col-span-2 text-center py-10 text-white/30 text-sm card">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Add more expenses to unlock AI insights
              </div>
            )}
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="card p-5 mb-6">
              <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent-amber" /> Saving Tips
              </h3>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="text-accent-amber text-xs mt-0.5 font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Spending trend chart */}
      {trends.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-cyan" /> Weekly Spend Trend (12 weeks)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends}>
              <XAxis dataKey="_id" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v, currency)} width={80} />
              <Tooltip
                contentStyle={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                formatter={(v) => [formatCurrency(v, currency), 'Spent']}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category bar chart */}
      {categories.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">Category Breakdown This Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categories} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v, currency)} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                formatter={(v) => [formatCurrency(v, currency)]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {categories.map((cat, i) => (
                  <Cell key={i} fill={cat.color || '#4ade80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Anomalies */}
      {!loadingAnomalies && anomalies.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-amber" /> Unusual Transactions
          </h3>
          <div className="space-y-3">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-accent-amber/5 border border-accent-amber/15 rounded-xl">
                <span className="text-lg">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{a.expense?.merchant} — {formatCurrency(a.expense?.amount, currency)}</p>
                  <p className="text-xs text-white/40 mt-0.5">{a.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
