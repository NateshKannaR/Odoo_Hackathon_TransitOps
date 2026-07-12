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
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface-0)' }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: '1 1 55%',
        background: 'linear-gradient(135deg, #0d0d1a 0%, #111128 50%, #0a0a18 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-left">
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,106,240,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(91,106,240,0.4)' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '16px', height: '16px' }}>
              <path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12" />
            </svg>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>TransitOps</span>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
            {[
              { label: 'Active Vehicles', value: '248', color: 'var(--brand)' },
              { label: 'Trips Today', value: '1,340', color: 'var(--green)' },
              { label: 'Fuel Saved', value: '12%', color: 'var(--amber)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '16px' }}>
            Fleet intelligence<br />
            <span style={{ background: 'linear-gradient(90deg, var(--brand), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>at your fingertips.</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '380px' }}>
            Real-time tracking, driver management, fuel analytics, and compliance — all in one unified platform.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '28px' }}>
            {['Live Tracking', 'RBAC Security', 'Fuel Analytics', 'Maintenance Alerts', 'Trip Reports'].map(f => (
              <span key={f} style={{ fontSize: '0.7rem', fontWeight: '500', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px 10px' }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', position: 'relative' }}>© 2025 TransitOps · Fleet Management Platform</p>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: '0 0 420px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        borderLeft: '1px solid var(--border-subtle)',
        background: 'var(--surface-1)',
      }} className="login-right">
        <div className="animate-slide-up" style={{ width: '100%', maxWidth: '320px' }}>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '6px' }}>Welcome back</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'var(--red-muted)', border: '1px solid var(--red-border)', borderRadius: '8px', marginBottom: '16px' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.5" style={{ width: '13px', height: '13px', flexShrink: 0, marginTop: '1px' }}><circle cx="7" cy="7" r="6" /><path d="M7 4.5v3M7 9.5h.01" /></svg>
              <span style={{ fontSize: '0.8rem', color: 'var(--red)', lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label-small">Email address</label>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="label-small" style={{ margin: 0 }}>Password</label>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--brand)', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-base"
                  style={{ paddingRight: '38px' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', display: 'flex' }}
                >
                  {showPass
                    ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '14px', height: '14px' }}><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" /><circle cx="8" cy="8" r="2" /><path d="M2 2l12 12" /></svg>
                    : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '14px', height: '14px' }}><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" /><circle cx="8" cy="8" r="2" /></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '4px', height: '40px', fontSize: '0.875rem', borderRadius: '8px' }}>
              {loading ? <Spinner size={16} /> : 'Sign in'}
            </button>
          </form>

          {/* Role hint */}
          <div style={{ marginTop: '28px', padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Access Roles</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { role: 'Fleet Manager', color: 'var(--brand)', desc: 'Full access' },
                { role: 'Driver', color: 'var(--green)', desc: 'Trips & fuel' },
                { role: 'Safety Officer', color: 'var(--amber)', desc: 'Compliance & maintenance' },
                { role: 'Financial Analyst', color: 'var(--violet)', desc: 'Expenses & reports' },
              ].map(r => (
                <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.role}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
