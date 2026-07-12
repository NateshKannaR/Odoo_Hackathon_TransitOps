export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <div className="page-header-line w-16 mt-1.5 mb-1" />
        {subtitle && <p className="text-sm" style={{ color: '#475569' }}>{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 flex-wrap">{action}</div>}
    </div>
  )
}
