import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import ChatBot from '../ui/ChatBot'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-0)', position: 'relative' }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            zIndex: 20, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        ...(isMobile ? {
          position: 'fixed', inset: '0 auto 0 0', zIndex: 30,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1)',
        } : {
          position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
        }),
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile topbar */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px',
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: '32px', height: '32px', borderRadius: '7px',
                background: 'var(--surface-3)', border: '1px solid var(--border-default)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: '14px', height: '14px' }}>
                <path d="M2 4h12M2 8h8M2 12h12" />
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '11px', height: '11px' }}>
                  <path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12" />
                </svg>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>TransitOps</span>
            </div>
          </div>
        )}

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      <ChatBot />
    </div>
  )
}
