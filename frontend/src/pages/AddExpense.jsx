import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '../services/services'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
  Pencil, Mic, Camera, Loader2, CheckCircle,
  Upload, StopCircle, RefreshCw
} from 'lucide-react'
import api from '../services/api'

const TABS = [
  { id: 'manual', label: 'Manual',       icon: Pencil },
  { id: 'voice',  label: 'Voice Input',  icon: Mic    },
  { id: 'receipt',label: 'Scan Receipt', icon: Camera },
]

export default function AddExpense() {
  const [tab, setTab] = useState('manual')
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/expenses/summary').then(() =>
      api.get('/budgets').then(r => r.data) // reuse budgets to get categoryIds
    ),
    staleTime: Infinity,
  })

  // Fallback category list (hardcoded for speed)
  const DEFAULT_CATS = [
    { _id: 'food',          name: 'Food & Dining',  icon: '🍔' },
    { _id: 'transport',     name: 'Transport',      icon: '🚗' },
    { _id: 'shopping',      name: 'Shopping',       icon: '🛍️' },
    { _id: 'entertainment', name: 'Entertainment',  icon: '🎬' },
    { _id: 'health',        name: 'Health',         icon: '💊' },
    { _id: 'utilities',     name: 'Utilities',      icon: '⚡' },
    { _id: 'rent',          name: 'Rent & Housing', icon: '🏠' },
    { _id: 'education',     name: 'Education',      icon: '📚' },
    { _id: 'travel',        name: 'Travel',         icon: '✈️' },
    { _id: 'other',         name: 'Other',          icon: '📦' },
  ]

  const addMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['summary'])
      queryClient.invalidateQueries(['insights'])
      toast.success('Expense added! 💸')
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.message || 'Failed to add expense'),
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">Add Expense</h1>
        <p className="text-white/40 text-sm">Choose how you want to add your expense</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-bg-secondary border border-white/[0.08] rounded-2xl p-1 mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              tab === id
                ? 'bg-accent-green text-bg-primary'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'manual'  && <ManualForm  onAdd={addMutation.mutate} categories={DEFAULT_CATS} currency={user?.currency} loading={addMutation.isPending} />}
      {tab === 'voice'   && <VoiceInput  onAdd={addMutation.mutate} categories={DEFAULT_CATS} currency={user?.currency} loading={addMutation.isPending} />}
      {tab === 'receipt' && <ReceiptScan onAdd={addMutation.mutate} categories={DEFAULT_CATS} currency={user?.currency} loading={addMutation.isPending} />}
    </div>
  )
}

// ── Manual Form ──────────────────────────────────────────────
function ManualForm({ onAdd, categories, currency, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })

  const submit = (data) => onAdd({
    ...data,
    amount: parseFloat(data.amount),
    source: 'manual',
  })

  return (
    <form onSubmit={handleSubmit(submit)} className="card p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Amount ({currency})</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be positive' } })}
            className="input text-2xl font-semibold"
          />
          {errors.amount && <p className="text-accent-pink text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="label">Merchant / Payee</label>
          <input
            placeholder="e.g. Swiggy, Amazon"
            {...register('merchant', { required: 'Merchant is required' })}
            className="input"
          />
          {errors.merchant && <p className="text-accent-pink text-xs mt-1">{errors.merchant.message}</p>}
        </div>

        <div>
          <label className="label">Date</label>
          <input type="date" {...register('date')} className="input" />
        </div>

        <div className="col-span-2">
          <label className="label">Category</label>
          <select {...register('categoryId', { required: 'Category is required' })} className="input">
            <option value="">Select category…</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-accent-pink text-xs mt-1">{errors.categoryId.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="label">Note (optional)</label>
          <input placeholder="e.g. Team lunch" {...register('note')} className="input" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Save Expense</>}
      </button>
    </form>
  )
}

// ── Voice Input ──────────────────────────────────────────────
function VoiceInput({ onAdd, categories, currency, loading }) {
  const [recording, setRecording]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed]         = useState(null)
  const [parsing, setParsing]       = useState(false)
  const recognitionRef              = useRef(null)

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser.'); return }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(t)
    }
    recognition.onerror = () => { setRecording(false); toast.error('Microphone error. Check permissions.') }

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const parseTranscript = async () => {
    if (!transcript.trim()) return
    setParsing(true)
    try {
      const { parsed: p } = await expenseService.parseVoice(transcript)
      setParsed(p)
    } catch {
      toast.error('Failed to parse transcript')
    } finally {
      setParsing(false)
    }
  }

  const saveParsed = () => {
    if (!parsed?.amount) { toast.error('Could not detect amount'); return }
    const cat = categories.find(c => c.name.toLowerCase() === parsed.category?.toLowerCase())
    onAdd({
      amount: parsed.amount,
      merchant: parsed.merchant || 'Voice Entry',
      categoryId: cat?._id || categories.find(c => c.name === 'Other')?._id,
      note: parsed.note,
      date: parsed.date,
      source: 'voice',
    })
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Record button */}
      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            recording
              ? 'bg-accent-pink/20 border-2 border-accent-pink animate-pulse'
              : 'bg-accent-green/10 border-2 border-accent-green/30 hover:bg-accent-green/20'
          }`}
        >
          {recording
            ? <StopCircle className="w-8 h-8 text-accent-pink" />
            : <Mic className="w-8 h-8 text-accent-green" />
          }
        </button>
        <p className="text-sm text-white/50">
          {recording ? '🔴 Recording… tap to stop' : 'Tap to start recording'}
        </p>
        <p className="text-xs text-white/30 text-center max-w-xs">
          Try: "Spent 450 on groceries at Dmart today"
        </p>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-bg-tertiary border border-white/[0.08] rounded-xl p-4">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Transcript</p>
          <p className="text-white text-sm italic">"{transcript}"</p>
        </div>
      )}

      {/* Parse button */}
      {transcript && !parsed && (
        <button onClick={parseTranscript} disabled={parsing} className="btn-primary w-full flex items-center justify-center gap-2">
          {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing with AI…</> : '✨ Parse with AI'}
        </button>
      )}

      {/* Parsed result */}
      {parsed && (
        <div className="space-y-4">
          <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4 space-y-2">
            <p className="text-xs text-accent-green uppercase tracking-widest mb-3">Parsed Result — Confirm?</p>
            {[
              ['Amount',   parsed.amount ? formatCurrency(parsed.amount, currency) : '—'],
              ['Merchant', parsed.merchant || '—'],
              ['Category', parsed.category || '—'],
              ['Date',     parsed.date || '—'],
              ['Note',     parsed.note || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-white/40">{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setTranscript(''); setParsed(null) }} className="btn-ghost flex-1 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button onClick={saveParsed} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm & Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Receipt Scan ──────────────────────────────────────────────
function ReceiptScan({ onAdd, categories, currency, loading }) {
  const [preview, setPreview]     = useState(null)
  const [scanning, setScanning]   = useState(false)
  const [extracted, setExtracted] = useState(null)
  const fileRef                   = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)
      const { parsed } = await expenseService.uploadReceipt(formData)
      setExtracted(parsed)
      toast.success('Receipt scanned successfully!')
    } catch (err) {
      toast.error('Failed to scan receipt: ' + (err.message || 'Unknown error'))
    } finally {
      setScanning(false)
    }
  }

  const saveExtracted = () => {
    if (!extracted?.amount) { toast.error('Could not detect amount. Please enter manually.'); return }
    const cat = categories.find(c => c._id === extracted.categoryId)
    onAdd({
      amount: extracted.amount,
      merchant: extracted.merchant || 'Receipt',
      categoryId: extracted.categoryId || categories.find(c => c.name === 'Other')?._id,
      date: extracted.date || new Date().toISOString().split('T')[0],
      source: 'ocr',
    })
  }

  return (
    <div className="card p-6 space-y-5">
      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all duration-150"
      >
        <Camera className="w-10 h-10 text-white/20" />
        <p className="text-sm text-white/50">Click to upload or drag & drop a receipt</p>
        <p className="text-xs text-white/30">JPEG, PNG, PDF · Max 5MB</p>
        <button className="badge-cyan mt-1">
          <Upload className="w-3 h-3 inline mr-1" />Choose File
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />

      {/* Preview */}
      {preview && (
        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
          <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-cover" />
        </div>
      )}

      {/* Scanning state */}
      {scanning && (
        <div className="flex items-center justify-center gap-3 py-4 text-accent-cyan">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Scanning receipt with OCR…</span>
        </div>
      )}

      {/* Extracted data */}
      {extracted && (
        <div className="space-y-4">
          <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-4 space-y-2">
            <p className="text-xs text-accent-amber uppercase tracking-widest mb-3">Extracted Data — Confirm?</p>
            {[
              ['Amount',   extracted.amount ? formatCurrency(extracted.amount, currency) : '—'],
              ['Merchant', extracted.merchant || '—'],
              ['Date',     extracted.date || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-white/40">{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setPreview(null); setExtracted(null) }} className="btn-ghost flex-1">
              <RefreshCw className="w-4 h-4 inline mr-1" />Retry
            </button>
            <button onClick={saveExtracted} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Expense
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
