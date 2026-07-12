import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  {
    to: '/dashboard', label: 'Dashboard',
    roles: ['fleet_manager','driver','safety_officer','financial_analyst'],
    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z" opacity=".9"/></svg>,
  },
  {
    to: '/vehicles', label: 'Vehicles',
    roles: ['fleet_manager','safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12"/></svg>,
  },
  {
    to: '/drivers', label: 'Drivers',
    roles: ['fleet_manager','safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>,
  },
  {
    to: '/trips', label: 'Trips',
    roles: ['fleet_manager','driver','safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3"/></svg>,
  },
  {
    to: '/maintenance', label: 'Maintenance',
    roles: ['fleet_manager','safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><path d="M9.5 4.5a1 1 0 0 0 0 1l1 1a1 1 0 0 0 1 0l2.5-2.5a4 4 0 0 1-5.3 5.3L4.2 13.8a1.4 1.4 0 0 1-2-2L6.7 7.3A4 4 0 0 1 12 2L9.5 4.5z"/></svg>,
  },
  {
    to: '/fuel', label: 'Fuel Logs',
    roles: ['fleet_manager','driver'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><path d="M2 15V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11M2 15h8M9 4h1.5a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1 1 1 0 0 0 1-1V5.5L11 3"/><path d="M4.5 7h3"/></svg>,
  },
  {
    to: '/expenses', label: 'Expenses',
    roles: ['fleet_manager','financial_analyst'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><path d="M8 1v14M11 3.5H6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H4"/></svg>,
  },
  {
    to: '/reports', label: 'Reports',
    roles: ['fleet_manager','financial_analyst','safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5"><path d="M12 14V7M8 14V2M4 14v-4"/></svg>,
  },
]

const ROLE_LABELS = {
  fleet_manager:     'Fleet Manager',
  driver:            'Driver',
  safety_officer:    'Safety Officer',
  financial_analyst: 'Financial Analyst',
}

export default function Sidebar({ onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const allowed = NAV.filter(item => item.roles.includes(profile?.role))
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border-subtle)',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}>
                <path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>TransitOps</span>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost" style={{ padding: '4px' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}><path d="M12 4 4 12M4 4l8 8"/></svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {allowed.map(item => {
          const active = pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: active ? '500' : '400',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--surface-3)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.1s, color 0.1s',
                marginBottom: '1px',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              <span style={{ color: active ? 'var(--brand)' : 'var(--text-tertiary)', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', marginBottom: '2px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'var(--brand-muted)',
            border: '1px solid var(--brand-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6875rem', fontWeight: '600', color: 'var(--brand)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ROLE_LABELS[profile?.role] ?? profile?.role}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 8px', borderRadius: '6px', background: 'transparent',
            border: 'none', cursor: 'pointer', fontSize: '0.8125rem',
            color: 'var(--text-tertiary)', transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-muted)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '13px', height: '13px', flexShrink: 0 }}>
            <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
