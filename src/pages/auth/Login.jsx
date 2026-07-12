import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Skeleton'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(form.email, form.password)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--surface-0)' }}>
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '15px', height: '15px' }}>
              <path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12"/>
            </svg>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TransitOps</span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Sign in</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Enter your credentials to continue</p>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'var(--red-muted)', border: '1px solid var(--red-border)', borderRadius: '7px', marginBottom: '16px' }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.5" style={{ width: '13px', height: '13px', flexShrink: 0, marginTop: '1px' }}><circle cx="7" cy="7" r="6"/><path d="M7 4.5v3M7 9.5h.01"/></svg>
            <span style={{ fontSize: '0.8125rem', color: 'var(--red)', lineHeight: '1.4' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="label-small">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-base"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="label-small">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-base"
                style={{ paddingRight: '36px' }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', display: 'flex' }}
              >
                {showPass
                  ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '14px', height: '14px' }}><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></svg>
                  : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '14px', height: '14px' }}><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '4px', height: '38px' }}>
            {loading ? <Spinner size={16} /> : 'Continue'}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '24px' }}>
          TransitOps Fleet Management · 2025
        </p>
      </div>
    </div>
  )
}
