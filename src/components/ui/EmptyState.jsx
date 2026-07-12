export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(59,130,246,0.06), transparent 70%)' }} />
      <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {icon ?? '📭'}
        <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
      </div>
      <h3 className="text-white font-semibold text-base mb-1 relative">{title}</h3>
      {description && <p className="text-sm max-w-xs relative" style={{ color: '#475569' }}>{description}</p>}
      {action && <div className="mt-5 relative">{action}</div>}
    </div>
  )
}
