const STATUS_MAP = {
  available:  { color: 'var(--green)',  bg: 'var(--green-muted)',  border: 'var(--green-border)' },
  on_trip:    { color: 'var(--blue)',   bg: 'var(--blue-muted)',   border: 'var(--blue-border)' },
  in_shop:    { color: 'var(--amber)',  bg: 'var(--amber-muted)',  border: 'var(--amber-border)' },
  retired:    { color: 'var(--red)',    bg: 'var(--red-muted)',    border: 'var(--red-border)' },
  off_duty:   { color: 'var(--text-secondary)', bg: 'var(--surface-3)', border: 'var(--border-default)' },
  suspended:  { color: 'var(--red)',    bg: 'var(--red-muted)',    border: 'var(--red-border)' },
  draft:      { color: 'var(--text-secondary)', bg: 'var(--surface-3)', border: 'var(--border-default)' },
  dispatched: { color: 'var(--blue)',   bg: 'var(--blue-muted)',   border: 'var(--blue-border)' },
  completed:  { color: 'var(--green)',  bg: 'var(--green-muted)',  border: 'var(--green-border)' },
  cancelled:  { color: 'var(--red)',    bg: 'var(--red-muted)',    border: 'var(--red-border)' },
  active:     { color: 'var(--amber)',  bg: 'var(--amber-muted)',  border: 'var(--amber-border)' },
  closed:     { color: 'var(--green)',  bg: 'var(--green-muted)',  border: 'var(--green-border)' },
}

export default function Badge({ value }) {
  const s = STATUS_MAP[value?.toLowerCase()] ?? { color: 'var(--text-secondary)', bg: 'var(--surface-3)', border: 'var(--border-default)' }
  return (
    <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {value?.replace(/_/g, ' ')}
    </span>
  )
}
