export function Skeleton({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton-shimmer h-12 w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer w-full" style={{ height: '56px', borderBottom: i < rows - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

export function SpinnerOverlay() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#3b82f6', borderRightColor: 'rgba(59,130,246,0.3)' }} />
        <div className="absolute inset-1 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#8b5cf6', borderRightColor: 'rgba(139,92,246,0.3)', animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
    </div>
  )
}
