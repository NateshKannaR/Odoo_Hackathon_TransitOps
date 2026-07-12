export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }} className="animate-slide-up">
      <div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: '1.4' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      {action && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{action}</div>}
    </div>
  )
}
