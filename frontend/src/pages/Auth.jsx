import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Wallet, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register: registerUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(data.email, data.password)
        toast.success('Welcome back! 👋')
      } else {
        await registerUser(data.name, data.email, data.password)
        toast.success('Account created! Let\'s get started 🚀')
      }
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => { setMode(m => m === 'login' ? 'register' : 'login'); reset() }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-green/10 border border-accent-green/30 rounded-2xl mb-4">
            <Wallet className="w-7 h-7 text-accent-green" />
          </div>
          <h1 className="font-serif text-3xl text-white mb-1">FinanceAI</h1>
          <p className="text-white/40 text-sm">Your AI-powered money manager</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tab switcher */}
          <div className="flex bg-bg-tertiary rounded-xl p-1 mb-8">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); reset() }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize ${
                  mode === m ? 'bg-accent-green text-bg-primary' : 'text-white/50 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="input"
                  placeholder="Rahul Sharma"
                />
                {errors.name && <p className="text-accent-pink text-xs mt-1">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                className="input"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-accent-pink text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  className="input pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-accent-pink text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} className="text-accent-cyan hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
