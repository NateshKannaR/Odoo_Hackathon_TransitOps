const STATUS_STYLES = {
  available:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', color: '#34d399',  dot: '#10b981' },
  on_trip:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  color: '#60a5fa', dot: '#3b82f6' },
  in_shop:    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  color: '#fbbf24', dot: '#f59e0b' },
  retired:    { bg: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.2)',    color: '#fb7185', dot: '#f43f5e' },
  off_duty:   { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', color: '#94a3b8', dot: '#64748b' },
  suspended:  { bg: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.2)',    color: '#fb7185', dot: '#f43f5e' },
  draft:      { bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.2)',  color: '#94a3b8', dot: '#64748b' },
  dispatched: { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  color: '#60a5fa', dot: '#3b82f6' },
  completed:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  color: '#34d399', dot: '#10b981' },
  cancelled:  { bg: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.2)',    color: '#fb7185', dot: '#f43f5e' },
  active:     { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  color: '#fbbf24', dot: '#f59e0b' },
  closed:     { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  color: '#34d399', dot: '#10b981' },
}

export default function Badge({ value }) {
  const s = STATUS_STYLES[value?.toLowerCase()] ?? { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', color: '#94a3b8', dot: '#64748b' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold tracking-wide capitalize"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot, boxShadow: `0 0 4px ${s.dot}` }} />
      {value?.replace(/_/g, ' ')}
    </span>
  )
}
