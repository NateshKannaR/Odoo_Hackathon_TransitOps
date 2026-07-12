import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext({})

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
}

const STYLES = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', icon: '#34d399', text: '#a7f3d0' },
  error:   { bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)',  icon: '#fb7185', text: '#fecdd3' },
  info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', icon: '#60a5fa', text: '#bfdbfe' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 space-y-2 z-[100]">
        {toasts.map(t => {
          const s = STYLES[t.type] ?? STYLES.info
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm max-w-sm animate-fade-in-up"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ color: s.icon, flexShrink: 0, marginTop: '1px' }}>{ICONS[t.type]}</span>
              <span style={{ color: s.text }}>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
