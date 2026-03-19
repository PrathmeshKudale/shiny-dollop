import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import { formatCurrency, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Search, Trash2, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react'

const PAGE_SIZE = 15

export default function History() {
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')
  const { user }              = useAuthStore()
  const queryClient           = useQueryClient()
  const currency              = user?.currency || 'INR'

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, search, from, to],
    queryFn: () => expenseService.getAll({ page, limit: PAGE_SIZE, search: search || undefined, from: from || undefined, to: to || undefined }),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: expenseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['summary'])
      toast.success('Expense deleted')
    },
    onError: () => toast.error('Failed to delete expense'),
  })

  const handleDelete = (id) => {
    if (confirm('Delete this expense?')) deleteMutation.mutate(id)
  }

  const exportCSV = () => {
    const expenses = data?.data || []
    if (!expenses.length) { toast.error('No expenses to export'); return }
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Note', 'Source']
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.merchant, e.categoryId?.name || 'Other',
      e.amount, e.note || '', e.source,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const expenses = data?.data || []
  const totalPages = data?.pages || 1
  const total = data?.total || 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Expense History</h1>
          <p className="text-white/40 text-sm">{total} total transactions</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search merchant or note…"
              className="input pl-9"
            />
          </div>
          <div>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} className="input" placeholder="From date" />
          </div>
          <div>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} className="input" placeholder="To date" />
          </div>
        </div>
        {(search || from || to) && (
          <button
            onClick={() => { setSearch(''); setFrom(''); setTo(''); setPage(1) }}
            className="text-xs text-accent-pink hover:underline mt-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No expenses found{search ? ` for "${search}"` : ''}.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06] text-xs text-white/30 uppercase tracking-widest font-medium">
              <div className="col-span-1"></div>
              <div className="col-span-4">Merchant</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Source</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {expenses.map((expense) => (
              <div
                key={expense._id}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center group"
              >
                <div className="col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-bg-card flex items-center justify-center text-base">
                    {expense.categoryId?.icon || '📦'}
                  </div>
                </div>
                <div className="col-span-4">
                  <p className="text-sm text-white font-medium truncate">{expense.merchant || 'Unknown'}</p>
                  {expense.note && <p className="text-xs text-white/40 truncate">{expense.note}</p>}
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
                    {expense.categoryId?.name || 'Other'}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-white/40">{formatDate(expense.date)}</div>
                <div className="col-span-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    expense.source === 'voice'  ? 'badge-purple' :
                    expense.source === 'ocr'    ? 'badge-amber'  :
                    'badge-cyan'
                  }`}>
                    {expense.source}
                  </span>
                </div>
                <div className="col-span-1 text-right text-sm font-semibold text-accent-pink">
                  {formatCurrency(expense.amount, currency)}
                </div>
                <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-accent-pink hover:bg-accent-pink/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-white/30">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost px-3 py-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost px-3 py-2 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
