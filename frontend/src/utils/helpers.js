import { format, formatDistanceToNow, isToday, isYesterday, startOfMonth, endOfMonth } from 'date-fns'

// ── Currency formatting ──
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

// ── Date formatting ──
export const formatDate = (date) => {
  const d = new Date(date)
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`
  return format(d, 'd MMM yyyy')
}

export const formatDateShort = (date) => format(new Date(date), 'd MMM')
export const formatMonth = (date) => format(new Date(date), 'MMMM yyyy')
export const currentMonth = () => format(new Date(), 'yyyy-MM')
export const getMonthRange = (month) => {
  const [y, m] = month.split('-').map(Number)
  return { from: startOfMonth(new Date(y, m - 1)).toISOString(), to: endOfMonth(new Date(y, m - 1)).toISOString() }
}

// ── Number formatting ──
export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0))

// ── Percentage ──
export const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0

// ── Color utils ──
export const progressColor = (percentage) => {
  if (percentage >= 100) return '#fb7185'   // red
  if (percentage >= 80)  return '#f59e0b'   // amber
  return '#4ade80'                           // green
}

// ── Class utility ──
export const cn = (...classes) => classes.filter(Boolean).join(' ')
