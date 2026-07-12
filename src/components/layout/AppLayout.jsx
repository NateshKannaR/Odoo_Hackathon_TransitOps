import { useState } from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-0)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 20, backdropFilter: 'blur(4px)' }}
          className="lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar */}
        <div className="lg:hidden" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 16px',
          background: 'var(--surface-1)',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost" style={{ padding: '6px' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '15px', height: '15px' }}>
              <path d="M2 4h12M2 8h12M2 12h12"/>
            </svg>
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>TransitOps</span>
        </div>

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
