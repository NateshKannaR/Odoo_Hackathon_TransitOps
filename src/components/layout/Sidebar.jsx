import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  {
    to: '/dashboard', label: 'Dashboard',
    roles: ['fleet_manager','driver','safety_officer','financial_analyst'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: '/vehicles', label: 'Vehicles',
    roles: ['fleet_manager','safety_officer'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M1 17h2m18 0h2M3 17V9l3-5h12l3 5v8M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm6 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/>
        <path d="M3 9h18"/>
      </svg>
    ),
  },
  {
    to: '/drivers', label: 'Drivers',
    roles: ['fleet_manager','safety_officer'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    to: '/trips', label: 'Trips',
    roles: ['fleet_manager','driver','safety_officer'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M3 12h18M3 12l4-4m-4 4 4 4M21 12l-4-4m4 4-4 4"/>
      </svg>
    ),
  },
  {
    to: '/maintenance', label: 'Maintenance',
    roles: ['fleet_manager','safety_officer'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    to: '/fuel', label: 'Fuel Logs',
    roles: ['fleet_manager','driver'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M3 22h12M13 6h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9l-3-3"/>
        <path d="M7 10h4"/>
      </svg>
    ),
  },
  {
    to: '/expenses', label: 'Expenses',
    roles: ['fleet_manager','financial_analyst'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    to: '/reports', label: 'Reports',
    roles: ['fleet_manager','financial_analyst','safety_officer'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
]

const ROLE_META = {
  fleet_manager:     { label: 'Fleet Manager',     color: 'from-blue-500 to-cyan-500',    glow: 'rgba(59,130,246,0.4)' },
  driver:            { label: 'Driver',             color: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.4)' },
  safety_officer:    { label: 'Safety Officer',     color: 'from-orange-500 to-amber-500', glow: 'rgba(245,158,11,0.4)' },
  financial_analyst: { label: 'Financial Analyst',  color: 'from-violet-500 to-purple-500',glow: 'rgba(139,92,246,0.4)' },
}

export default function Sidebar({ onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const allowed = NAV.filter(item => item.roles.includes(profile?.role))
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const roleMeta = ROLE_META[profile?.role] ?? { label: profile?.role, color: 'from-slate-500 to-slate-600', glow: 'rgba(100,116,139,0.4)' }

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{
      background: 'linear-gradient(180deg, rgba(6,11,24,0.98) 0%, rgba(8,14,28,0.98) 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(24px)',
    }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg relative" style={{
            background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
            boxShadow: '0 4px 20px rgba(59,130,246,0.5)',
          }}>
            🚍
            <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
          </div>
          <div>
            <h1 className="text-sm font-bold gradient-text tracking-tight">TransitOps</h1>
            <p className="text-[10px]" style={{ color: '#334155' }}>Fleet Platform</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {allowed.map((item, idx) => {
          const active = pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group overflow-hidden"
              style={{
                background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))' : 'transparent',
                color: active ? '#60a5fa' : '#64748b',
                border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                animationDelay: `${idx * 0.04}s`,
              }}
            >
              {/* Active glow bg */}
              {active && (
                <div className="absolute inset-0 rounded-xl opacity-30" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.3), transparent 70%)' }} />
              )}
              {/* Active left bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full" style={{ background: 'linear-gradient(180deg,#60a5fa,#818cf8)', boxShadow: '0 0 8px rgba(96,165,250,0.8)' }} />
              )}
              {/* Hover bg */}
              {!active && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.04)' }} />
              )}
              <span className={`relative z-10 transition-colors ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <span className={`relative z-10 transition-colors ${active ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-200'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleMeta.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
            style={{ boxShadow: `0 4px 12px ${roleMeta.glow}` }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
            <p className="text-[10px] truncate" style={{ color: '#334155' }}>{roleMeta.label}</p>
          </div>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all group"
          style={{ color: '#475569', background: 'transparent', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'transparent' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
