import { useEffect } from 'react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  const maxW = size === 'lg' ? '640px' : size === 'sm' ? '400px' : '520px'

  return (
    <div
      className="animate-fade-in"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%', maxWidth: maxW,
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h2>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '4px', color: 'var(--text-tertiary)' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}>
              <path d="M12 4 4 12M4 4l8 8"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
