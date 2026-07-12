import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext({})

const CONFIG = {
  success: { color: 'var(--green)',  bg: 'var(--surface-3)', border: 'var(--green-border)' },
  error:   { color: 'var(--red)',    bg: 'var(--surface-3)', border: 'var(--red-border)' },
  info:    { color: 'var(--brand)',  bg: 'var(--surface-3)', border: 'var(--brand-border)' },
}

const ICONS = {
  success: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M12 3.5 5.5 10 2 6.5"/></svg>,
  error:   <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M11 3 3 11M3 3l8 8"/></svg>,
  info:    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><circle cx="7" cy="7" r="6"/><path d="M7 9.5V7M7 4.5h.01"/></svg>,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100 }}>
        {toasts.map(t => {
          const s = CONFIG[t.type] ?? CONFIG.info
          return (
            <div
              key={t.id}
              className="animate-slide-right"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                maxWidth: '340px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ color: s.color, flexShrink: 0 }}>{ICONS[t.type]}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
