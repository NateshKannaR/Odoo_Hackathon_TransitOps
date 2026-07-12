import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { PageSpinner } from '../../components/ui/Skeleton'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'

const KPI = [
  { key: 'activeVehicles',   label: 'Available',       sub: 'Vehicles',  color: 'var(--green)',  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><path d="M1 11h1m12 0h1M2 11V7l2-4h8l2 4v4M5 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm3 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM2 7h12"/></svg> },
  { key: 'onTripVehicles',   label: 'On Trip',         sub: 'Vehicles',  color: 'var(--blue)',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3"/></svg> },
  { key: 'inShopVehicles',   label: 'In Maintenance',  sub: 'Vehicles',  color: 'var(--amber)',  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><path d="M9.5 4.5a1 1 0 0 0 0 1l1 1a1 1 0 0 0 1 0l2.5-2.5a4 4 0 0 1-5.3 5.3L4.2 13.8a1.4 1.4 0 0 1-2-2L6.7 7.3A4 4 0 0 1 12 2L9.5 4.5z"/></svg> },
  { key: 'utilization',      label: 'Utilization',     sub: 'Fleet',     color: 'var(--brand)',  suffix: '%', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><path d="M12 14V7M8 14V2M4 14v-4"/></svg> },
  { key: 'activeTrips',      label: 'Active',          sub: 'Trips',     color: 'var(--cyan)',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> },
  { key: 'pendingTrips',     label: 'Pending',         sub: 'Trips',     color: 'var(--text-secondary)', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> },
  { key: 'driversOnDuty',    label: 'On Duty',         sub: 'Drivers',   color: 'var(--violet)', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
  { key: 'availableDrivers', label: 'Available',       sub: 'Drivers',   color: 'var(--pink)',   icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{width:14,height:14}}><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg> },
]

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-4)', border: '1px solid var(--border-default)', borderRadius: '7px', padding: '8px 12px', fontSize: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>{p.name}: {typeof p.value === 'number' && p.name !== 'count' ? `$${p.value.toFixed(0)}` : p.value}</p>
      ))}
    </div>
  )
}

function KPICard({ cfg, value, delay }) {
  return (
    <div className="card animate-slide-up" style={{ padding: '16px 18px', animationDelay: delay }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{cfg.sub}</span>
        <span style={{ color: cfg.color, opacity: 0.7 }}>{cfg.icon}</span>
      </div>
      <div style={{ fontSize: '1.625rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' }}>
        {value ?? '—'}{cfg.suffix ?? ''}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{cfg.label}</div>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [utilizationData, setUtilizationData] = useState([])
  const [costTrendData, setCostTrendData] = useState([])
  const [tripStatusData, setTripStatusData] = useState([])

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    const [vehicles, trips, drivers, fuelLogs, maintenanceLogs, expenses] = await Promise.all([
      supabase.from('vehicles').select('id,status'),
      supabase.from('trips').select('id,status'),
      supabase.from('drivers').select('id,status'),
      supabase.from('fuel_logs').select('total_cost,fueled_at'),
      supabase.from('maintenance_logs').select('cost,service_date'),
      supabase.from('expenses').select('amount,expense_date'),
    ])
    const v = vehicles.data ?? [], t = trips.data ?? [], d = drivers.data ?? []
    const fl = fuelLogs.data ?? [], ml = maintenanceLogs.data ?? [], ex = expenses.data ?? []

    const nonRetired = v.filter(x => x.status !== 'retired')
    const onTrip = v.filter(x => x.status === 'on_trip')
    const utilization = nonRetired.length > 0 ? ((onTrip.length / nonRetired.length) * 100).toFixed(1) : 0

    setStats({
      activeVehicles: v.filter(x => x.status === 'available').length,
      onTripVehicles: onTrip.length,
      inShopVehicles: v.filter(x => x.status === 'in_shop').length,
      utilization,
      activeTrips: t.filter(x => x.status === 'dispatched').length,
      pendingTrips: t.filter(x => x.status === 'draft').length,
      driversOnDuty: d.filter(x => x.status === 'on_trip').length,
      availableDrivers: d.filter(x => x.status === 'available').length,
      totalFuelCost: fl.reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
      totalMaintCost: ml.reduce((s, r) => s + Number(r.cost ?? 0), 0),
      totalExpenses: ex.reduce((s, r) => s + Number(r.amount ?? 0), 0),
    })

    setUtilizationData([
      { name: 'Available', count: v.filter(x => x.status === 'available').length, fill: '#22c55e' },
      { name: 'On Trip',   count: onTrip.length, fill: '#3b82f6' },
      { name: 'In Shop',   count: v.filter(x => x.status === 'in_shop').length, fill: '#f59e0b' },
      { name: 'Retired',   count: v.filter(x => x.status === 'retired').length, fill: '#ef4444' },
    ])

    setTripStatusData([
      { name: 'Draft',      value: t.filter(x => x.status === 'draft').length,      fill: '#4a4a5e' },
      { name: 'Dispatched', value: t.filter(x => x.status === 'dispatched').length,  fill: '#3b82f6' },
      { name: 'Completed',  value: t.filter(x => x.status === 'completed').length,   fill: '#22c55e' },
      { name: 'Cancelled',  value: t.filter(x => x.status === 'cancelled').length,   fill: '#ef4444' },
    ].filter(x => x.value > 0))

    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(); date.setMonth(date.getMonth() - i)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleString('default', { month: 'short' })
      months.push({
        month: label,
        Fuel: fl.filter(r => r.fueled_at?.startsWith(key)).reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
        Maintenance: ml.filter(r => r.service_date?.startsWith(key)).reduce((s, r) => s + Number(r.cost ?? 0), 0),
        Expenses: ex.filter(r => r.expense_date?.startsWith(key)).reduce((s, r) => s + Number(r.amount ?? 0), 0),
      })
    }
    setCostTrendData(months)
  }

  if (!stats) return <AppLayout><PageSpinner /></AppLayout>

  const totalOpCost = stats.totalFuelCost + stats.totalMaintCost + stats.totalExpenses

  return (
    <AppLayout>
      {/* Header */}
      <div className="animate-slide-up" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Overview</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {profile?.full_name} · {profile?.role?.replace(/_/g, ' ')}
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }} className="kpi-grid">
        {KPI.map((cfg, i) => (
          <KPICard key={cfg.key} cfg={cfg} value={stats[cfg.key]} delay={`${i * 0.04}s`} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', marginBottom: '12px' }}>
        {/* Cost trend */}
        <div className="card animate-slide-up delay-3" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>Cost Trend</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>Last 6 months</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[['Fuel','#3b82f6'],['Maint.','#f59e0b'],['Expenses','#ef4444']].map(([l,c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  <span style={{ width: '8px', height: '2px', background: c, borderRadius: '1px', display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={costTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {[['f','#3b82f6'],['m','#f59e0b'],['e','#ef4444']].map(([id,c]) => (
                  <linearGradient key={id} id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Fuel" stroke="#3b82f6" fill="url(#gf)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="Maintenance" stroke="#f59e0b" fill="url(#gm)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="url(#ge)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trip status */}
        <div className="card animate-slide-up delay-4" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Trip Status</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Distribution</p>
          {tripStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={tripStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {tripStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {tripStatusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.fill, flexShrink: 0 }} />{d.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>No data</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Fleet status bar */}
        <div className="card animate-slide-up delay-5" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Fleet Status</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Vehicles by status</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={utilizationData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {utilizationData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost breakdown */}
        <div className="card animate-slide-up delay-6" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Cost Breakdown</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>Operational expenditure</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Fuel',        value: stats.totalFuelCost,  color: '#3b82f6' },
              { label: 'Maintenance', value: stats.totalMaintCost, color: '#f59e0b' },
              { label: 'Expenses',    value: stats.totalExpenses,  color: '#ef4444' },
            ].map(item => {
              const pct = totalOpCost > 0 ? (item.value / totalOpCost * 100) : 0
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>${item.value.toFixed(2)}</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--surface-4)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>${totalOpCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </AppLayout>
  )
}
