import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'What is TransitOps?',
  'What can Fleet Manager do?',
  'How does trip tracking work?',
  'What is fuel analytics?',
  'How does maintenance work?',
  'What roles are available?',
  'How are expenses tracked?',
  'What reports can I generate?',
]

const KB = {
  'what is transitops': `TransitOps is a full-featured fleet management platform. It helps organizations manage vehicles, drivers, trips, fuel, maintenance, and expenses — all in one place with role-based access control.`,
  'what can fleet manager do': `Fleet Managers have full access to every module:\n• Vehicles & Drivers\n• Trips & Fuel logs\n• Maintenance schedules\n• Expenses & Reports\n\nThey are the super-admins of the platform.`,
  'how does trip tracking work': `Each trip is logged with:\n• Assigned driver & vehicle\n• Start / end location and time\n• Distance covered\n• Trip status (Scheduled, In Progress, Completed)\n\nFleet Managers, Drivers, and Safety Officers can view trips.`,
  'what is fuel analytics': `Fuel Analytics tracks every refuel event:\n• Liters filled & cost\n• Odometer reading\n• Fuel efficiency (km/L) trends\n• Alerts for abnormal consumption\n\nAccessible by Fleet Managers and Drivers.`,
  'how does maintenance work': `Maintenance module lets you:\n• Schedule preventive services\n• Log repairs with cost & parts\n• Set reminders by mileage or date\n• Track vehicle downtime\n\nManaged by Fleet Managers and Safety Officers.`,
  'what roles are available': `TransitOps has 4 roles:\n\n🔵 Fleet Manager — Full access\n🟢 Driver — Trips & Fuel\n🟡 Safety Officer — Vehicles, Drivers, Maintenance, Reports\n🟣 Financial Analyst — Expenses & Reports`,
  'how are expenses tracked': `Expenses module covers:\n• Fuel, maintenance, tolls, fines\n• Per-vehicle cost breakdown\n• Monthly & yearly summaries\n• Export-ready for accounting\n\nAccessible by Fleet Managers and Financial Analysts.`,
  'what reports can i generate': `Reports include:\n• Fleet utilization summary\n• Driver performance metrics\n• Fuel consumption trends\n• Maintenance cost analysis\n• Expense breakdowns by category\n\nAvailable to Fleet Managers, Financial Analysts, and Safety Officers.`,
}

function getReply(text) {
  const key = text.toLowerCase().replace(/[?!.]/g, '').trim()
  for (const [k, v] of Object.entries(KB)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  // fuzzy word match
  const words = key.split(' ')
  for (const [k, v] of Object.entries(KB)) {
    if (words.some(w => w.length > 3 && k.includes(w))) return v
  }
  return `I'm not sure about that. Try asking:\n• What is TransitOps?\n• What roles are available?\n• How does trip tracking work?`
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! 👋 I'm the TransitOps assistant.\nAsk me anything about this platform or fleet management." }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: msg }])
    setTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: getReply(msg) }])
      setTyping(false)
    }, 600)
  }

  const handleKey = (e) => { if (e.key === 'Enter') send() }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="animate-slide-up" style={{
          position: 'fixed', bottom: '80px', right: '24px', zIndex: 1000,
          width: '320px', maxHeight: '480px',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: '13px', height: '13px' }}>
                  <path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>TransitOps Assistant</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: '2px' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '13px', height: '13px' }}>
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 11px',
                  borderRadius: m.from === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  background: m.from === 'user' ? 'var(--brand)' : 'var(--surface-3)',
                  border: m.from === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  fontSize: '0.775rem',
                  color: m.from === 'user' ? '#fff' : 'var(--text-secondary)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 12px', borderRadius: '10px 10px 10px 2px', background: 'var(--surface-3)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-tertiary)', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div style={{ padding: '6px 10px', display: 'flex', gap: '5px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', scrollbarWidth: 'none' }}>
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button key={s} onClick={() => send(s)} style={{
                flexShrink: 0, fontSize: '0.65rem', padding: '3px 8px',
                background: 'var(--brand-muted)', border: '1px solid var(--brand-border)',
                borderRadius: '20px', color: 'var(--brand)', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{s}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask something…"
              className="input-base"
              style={{ flex: 1, fontSize: '0.775rem', padding: '6px 10px' }}
            />
            <button onClick={() => send()} className="btn-primary" style={{ padding: '6px 10px', borderRadius: '7px', flexShrink: 0 }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}>
                <path d="M12 7H2M8 3l4 4-4 4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: '48px', height: '48px', borderRadius: '50%',
          background: open ? 'var(--surface-3)' : 'var(--brand)',
          border: '1px solid ' + (open ? 'var(--border-default)' : 'rgba(255,255,255,0.15)'),
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? 'none' : '0 4px 20px rgba(91,106,240,0.45)',
          transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="TransitOps Assistant"
      >
        {open
          ? <svg viewBox="0 0 14 14" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}><path d="M2 2l10 10M12 2L2 12" /></svg>
          : <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.4" style={{ width: '17px', height: '17px' }}>
              <path d="M14 10.5c0 .8-.7 1.5-1.5 1.5H5l-3 3V4.5C2 3.7 2.7 3 3.5 3h9c.8 0 1.5.7 1.5 1.5v6z" />
            </svg>
        }
      </button>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
