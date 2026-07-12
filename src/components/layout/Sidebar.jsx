import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  {
    to: '/dashboard', label: 'Dashboard',
    roles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>,
  },
  {
    to: '/vehicles', label: 'Vehicles',
    roles: ['fleet_manager', 'safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12" /></svg>,
  },
  {
    to: '/drivers', label: 'Drivers',
    roles: ['fleet_manager', 'safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" /></svg>,
  },
  {
    to: '/trips', label: 'Trips',
    roles: ['fleet_manager', 'driver', 'safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" /></svg>,
  },
  {
    to: '/maintenance', label: 'Maintenance',
    roles: ['fleet_manager', 'safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><path d="M9.5 4.5a1 1 0 0 0 0 1l1 1a1 1 0 0 0 1 0l2.5-2.5a4 4 0 0 1-5.3 5.3L4.2 13.8a1.4 1.4 0 0 1-2-2L6.7 7.3A4 4 0 0 1 12 2L9.5 4.5z" /></svg>,
  },
  {
    to: '/fuel', label: 'Fuel Logs',
    roles: ['fleet_manager', 'driver'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><path d="M2 15V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11M2 15h8M9 4h1.5a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1 1 1 0 0 0 1-1V5.5L11 3" /><path d="M4.5 7h3" /></svg>,
  },
  {
    to: '/expenses', label: 'Expenses',
    roles: ['fleet_manager', 'financial_analyst'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><path d="M8 1v14M11 3.5H6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H4" /></svg>,
  },
  {
    to: '/reports', label: 'Reports',
    roles: ['fleet_manager', 'financial_analyst', 'safety_officer'],
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 14, height: 14 }}><path d="M12 14V7M8 14V2M4 14v-4" /></svg>,
  },
]

const ROLE_LABELS = {
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
}

const ROLE_COLORS = {
  fleet_manager: 'var(--brand)',
  driver: 'var(--green)',
  safety_officer: 'var(--amber)',
  financial_analyst: 'var(--violet)',
}

export default function Sidebar({ onClose, isMobile }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const allowed = NAV.filter(item => item.roles.includes(profile?.role))
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const roleColor = ROLE_COLORS[profile?.role] ?? 'var(--brand)'

  return (
    <aside style={{
      width: '224px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border-subtle)',
      overflow: 'hidden',
    }}>

      {/* Logo row */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(91,106,240,0.35)',
            }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}>
                <path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TransitOps</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Fleet Management</div>
            </div>
          </div>

          {/* Close button — always rendered, only visible on mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'var(--surface-3)', border: '1px solid var(--border-default)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-muted)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: '11px', height: '11px' }}>
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: '14px 14px 4px', flexShrink: 0 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Navigation</span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {allowed.map(item => {
          const active = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '7px 8px', borderRadius: '7px',
                fontSize: '0.8125rem', fontWeight: active ? '500' : '400',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--surface-3)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
                marginBottom: '1px',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              {/* Active indicator */}
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: '2.5px', borderRadius: '0 2px 2px 0',
                  background: 'var(--brand)',
                }} />
              )}
              <span style={{ color: active ? 'var(--brand)' : 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {/* Profile card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px', borderRadius: '8px',
          background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
          marginBottom: '6px',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: `${roleColor}18`,
            border: `1px solid ${roleColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: '700', color: roleColor,
            flexShrink: 0, letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name ?? 'User'}
            </div>
            <div style={{ fontSize: '0.65rem', color: roleColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
              {ROLE_LABELS[profile?.role] ?? profile?.role}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '7px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '0.8rem', color: 'var(--text-tertiary)',
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-muted)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '13px', height: '13px', flexShrink: 0 }}>
            <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
