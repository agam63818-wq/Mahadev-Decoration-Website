'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogIn, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('कृपया सभी फील्ड भरें')
      return
    }
    setLoading(true)
    setError('')
    // Simulate auth (Part 3 will wire real Supabase auth)
    await new Promise((r) => setTimeout(r, 800))
    if (email === 'admin@mahadevdecoration.com' && password === 'admin123') {
      sessionStorage.setItem('admin_auth', 'true')
      router.push('/admin')
    } else {
      setError('गलत ईमेल या पासवर्ड')
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-bg-void p-4"
    >
      <div className="w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-burgundy flex items-center justify-center mx-auto mb-4 shadow-gold-glow-sm">
            <span className="text-2xl font-display font-bold text-bg-void font-devanagari">म</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">
            एडमिन लॉगिन
          </h1>
          <p className="text-text-muted text-sm mt-2 font-devanagari">
            महादेव डेकोरेशन — प्रबंधन एक्सेस
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.05] border border-gold/20 rounded-2xl p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-400/10 border border-rose-400/20 text-rose-400 text-sm font-devanagari">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-devanagari text-text-muted">ईमेल</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mahadevdecoration.com"
                className="bg-bg-void/50 border-gold/20 focus:border-gold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-devanagari text-text-muted">पासवर्ड</label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="पासवर्ड दर्ज करें"
                  className="bg-bg-void/50 border-gold/20 focus:border-gold pr-10"
                />
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-devanagari"
            >
              <LogIn size={18} />
              {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
            </Button>

            <p className="text-xs text-text-muted text-center font-devanagari">
              डेमो: admin&#64;mahadevdecoration.com / admin123
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
