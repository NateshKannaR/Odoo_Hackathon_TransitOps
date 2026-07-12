export function Skeleton({ rows = 5 }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: '40px', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '52px', borderRadius: 0, borderBottom: i < rows - 1 ? '1px solid var(--border-subtle)' : 'none', animationDelay: `${i * 0.06}s` }} />
      ))}
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border-default)`,
      borderTopColor: 'var(--brand)',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

export function PageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <Spinner size={24} />
    </div>
  )
}

// inject spin keyframe once
const style = document.createElement('style')
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
document.head.appendChild(style)
