'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, signInWithGoogle } from '@/lib/firebase/auth'
import { getUserProfile, makeAdmin } from '@/lib/firebase/firestore'
import { motion } from 'framer-motion'
import { Cake, Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const cred = await signIn(email, password)
      const profile = await getUserProfile(cred.user.uid)
      
      if (profile?.role === 'admin') {
        toast.success('Welcome back, Admin!')
        router.push('/admin/dashboard')
      } else {
        toast.success('Welcome back!')
        router.push('/')
      }
    } catch (e: any) {
      const msg = e.code === 'auth/invalid-credential' ? 'Invalid email or password' : 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const cred = await signUp(email, password, name)
      toast.success('Account created! Welcome to Bakes & Delights!')
      router.push('/')
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use' ? 'Email already in use' : 'Signup failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const cred = await signInWithGoogle()
      const profile = await getUserProfile(cred.user.uid)
      
      if (profile?.role === 'admin') {
        toast.success('Welcome back, Admin!')
        router.push('/admin/dashboard')
      } else {
        toast.success(`Welcome, ${cred.user.displayName || 'there'}!`)
        router.push('/')
      }
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        toast.error('Google sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (mode === 'login') handleLogin()
    else handleSignup()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark/95 to-brand-primary/20 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-56 h-56 bg-brand-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="glass-dark rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Cake size={28} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Bakes & Delights</h1>
            <p className="text-brand-text-light text-sm mt-1">
              {mode === 'login' ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                  mode === m ? 'bg-brand-primary text-white' : 'text-brand-text-light hover:text-white'
                }`}
              >
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm text-brand-text-light mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-light" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                    placeholder="Your full name"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-brand-text-light mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-light" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-brand-text-light mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-light" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-orange-dark text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 transition-all"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Please wait...</> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-brand-text-light">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 font-medium py-3 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Emergency Setup Helper */}
            <div className="pt-4 mt-4 border-t border-white/5 text-center">
              <button
                onClick={async () => {
                  const { auth } = await import('@/lib/firebase/config')
                  const { syncUserProfile, makeAdmin } = await import('@/lib/firebase/firestore')
                  const user = auth.currentUser
                  if (!user) {
                    toast.error('Please sign in with Google first')
                    return
                  }
                  try {
                    await syncUserProfile(user.uid, { 
                      email: user.email || '', 
                      name: user.displayName || 'Admin' 
                    })
                    await makeAdmin(user.uid)
                    toast.success('Profile Fixed! You are now an Admin.')
                    router.push('/admin/dashboard')
                  } catch (e) {
                    toast.error('Sync failed. Please check Firestore Rules.')
                  }
                }}
                className="text-[10px] text-brand-primary/40 hover:text-brand-primary transition-colors uppercase tracking-widest font-bold"
              >
                Fix Database Profile & Make Admin
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-brand-text-light hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
