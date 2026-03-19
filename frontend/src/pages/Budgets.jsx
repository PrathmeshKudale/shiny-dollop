import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { budgetService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import { formatCurrency, progressColor, currentMonth } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, X, Loader2, Pencil, Trash2 } from 'lucide-react'

const DEFAULT_CATS = [
  { _id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f59e0b' },
  { _id: 'transport', name: 'Transport', icon: '🚗', color: '#60a5fa' },
  { _id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#a78bfa' },
  { _id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#f472b6' },
  { _id: 'health', name: 'Health', icon: '💊', color: '#4ade80' },
  { _id: 'utilities', name: 'Utilities', icon: '⚡', color: '#22d3ee' },
  { _id: 'rent', name: 'Rent & Housing', icon: '🏠', color: '#fb7185' },
  { _id: 'education', name: 'Education', icon: '📚', color: '#fbbf24' },
  { _id: 'travel', name: 'Travel', icon: '✈️', color: '#34d399' },
  { _id: 'other', name: 'Other', icon: '📦', color: '#94a3b8' },
]

export default function Budgets() {
  const [showForm, setShowForm] = useState(false)
  const [month]                 = useState(currentMonth())
  const { user }                = useAuthStore()
  const queryClient             = useQueryClient()
  const currency                = user?.currency || 'INR'

  const { data, isLoading } = useQuery({
    queryKey: ['budgets', month],
    queryFn: () => budgetService.getAll(month),
  })

  const createMutation = useMutation({
    mutationFn: budgetService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets'])
      toast.success('Budget created!')
      setShowForm(false)
    },
    onError: (err) => toast.error(err.message || 'Failed to create budget'),
  })

  const deleteMutation = useMutation({
    mutationFn: budgetService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets'])
      toast.success('Budget removed')
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { alertAt: 80, rollover: false, month },
  })

  const onSubmit = (data) => createMutation.mutate({ ...data, limit: parseFloat(data.limit), alertAt: parseInt(data.alertAt) })

  const budgets = data?.budgets || []
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent  = budgets.reduce((s, b) => s + (b.spent || 0), 0)
  const overallPct  = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Budgets</h1>
          <p className="text-white/40 text-sm">{new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Budget
        </button>
      </div>

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Overall Budget</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(totalSpent, currency)} <span className="text-white/40 font-normal text-sm">of {formatCurrency(totalBudget, currency)}</span>
              </p>
            </div>
            <span className={`text-2xl font-bold ${overallPct >= 100 ? 'text-accent-pink' : overallPct >= 80 ? 'text-accent-amber' : 'text-accent-green'}`}>
              {overallPct}%
            </span>
          </div>
          <div className="h-2 bg-bg-card rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallPct, 100)}%`, background: progressColor(overallPct) }}
            />
          </div>
        </div>
      )}

      {/* New budget form */}
      {showForm && (
        <div className="card p-6 mb-6 border border-accent-green/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-medium">Create New Budget</h3>
            <button onClick={() => { setShowForm(false); reset() }} className="text-white/30 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('categoryId', { required: 'Select a category' })} className="input">
                <option value="">Choose…</option>
                {DEFAULT_CATS.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-accent-pink text-xs mt-1">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="label">Monthly Limit ({currency})</label>
              <input type="number" min="1" placeholder="e.g. 5000" {...register('limit', { required: 'Limit is required', min: 1 })} className="input" />
              {errors.limit && <p className="text-accent-pink text-xs mt-1">{errors.limit.message}</p>}
            </div>

            <div>
              <label className="label">Alert Threshold (%)</label>
              <input type="number" min="1" max="100" {...register('alertAt')} className="input" />
              <p className="text-xs text-white/30 mt-1">Get notified when you reach this % of budget</p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input type="checkbox" {...register('rollover')} className="w-4 h-4 rounded accent-accent-green" />
                <div>
                  <p className="text-sm text-white">Rollover unused budget</p>
                  <p className="text-xs text-white/30">Add leftover to next month</p>
                </div>
              </label>
            </div>

            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); reset() }} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-16 text-white/30 text-sm">
          <p className="text-3xl mb-3">💰</p>
          <p>No budgets set for this month.</p>
          <button onClick={() => setShowForm(true)} className="text-accent-green hover:underline text-sm mt-1">Create your first budget →</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const pct = budget.progress || 0
            const color = progressColor(pct)
            const cat = DEFAULT_CATS.find(c => c._id === budget.categoryId?._id?.toString()) || DEFAULT_CATS.find(c => c.name === budget.categoryId?.name) || DEFAULT_CATS[DEFAULT_CATS.length - 1]

            return (
              <div key={budget._id} className="card p-5 group relative">
                {/* Delete button */}
                <button
                  onClick={() => deleteMutation.mutate(budget._id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-white/20 hover:text-accent-pink hover:bg-accent-pink/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}20` }}>
                    {budget.categoryId?.icon || cat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{budget.categoryId?.name || cat.name}</p>
                    <p className="text-xs text-white/40">Alert at {budget.alertAt}%</p>
                  </div>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-lg font-bold text-white">{formatCurrency(budget.spent || 0, currency)}</p>
                    <p className="text-xs text-white/40">of {formatCurrency(budget.limit, currency)}</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color }}>{pct}%</p>
                </div>

                <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                  />
                </div>

                {pct >= 100 && (
                  <p className="text-xs text-accent-pink mt-2">⚠️ Budget exceeded by {formatCurrency((budget.spent || 0) - budget.limit, currency)}</p>
                )}
                {pct >= budget.alertAt && pct < 100 && (
                  <p className="text-xs text-accent-amber mt-2">🔔 Approaching limit</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
