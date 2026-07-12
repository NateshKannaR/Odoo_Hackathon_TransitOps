export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.75rem', marginBottom: '12px', opacity: 0.5 }}>{icon ?? '📭'}</div>
      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</p>
      {description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>{description}</p>}
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  )
}
