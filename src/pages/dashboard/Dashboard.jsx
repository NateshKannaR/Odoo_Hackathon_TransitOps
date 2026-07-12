import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import { PageSpinner } from '../../components/ui/Skeleton'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtMoney = (n) => '$' + fmt(n)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface-3)', border: '1px solid var(--border-default)',
      borderRadius: '6px', padding: '8px 12px', fontSize: '0.72rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {label && <p style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'value' && p.name !== 'count'
            ? fmtMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function Stat({ label, value, sub, accent }) {
  return (
    <div style={{
      padding: '20px 24px',
      background: 'var(--surface-1)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '10px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1.875rem', fontWeight: 700, color: accent ?? 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [costTrend, setCostTrend] = useState([])
  const [fleetDist, setFleetDist] = useState([])
  const [tripDist, setTripDist] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const [vRes, tRes, dRes, flRes, mlRes, exRes] = await Promise.all([
      supabase.from('vehicles').select('id,status'),
      supabase.from('trips').select('id,status'),
      supabase.from('drivers').select('id,status'),
      supabase.from('fuel_logs').select('total_cost,fueled_at'),
      supabase.from('maintenance_logs').select('cost,service_date'),
      supabase.from('expenses').select('amount,expense_date'),
    ])
    const v = vRes.data ?? [], t = tRes.data ?? [], d = dRes.data ?? []
    const fl = flRes.data ?? [], ml = mlRes.data ?? [], ex = exRes.data ?? []

    const active = v.filter(x => x.status !== 'retired')
    const onTrip = v.filter(x => x.status === 'on_trip')
    const utilPct = active.length ? ((onTrip.length / active.length) * 100).toFixed(0) : 0

    setStats({
      vehicles: active.length,
      available: v.filter(x => x.status === 'available').length,
      onTrip: onTrip.length,
      inShop: v.filter(x => x.status === 'in_shop').length,
      utilization: utilPct,
      totalTrips: t.length,
      activeTrips: t.filter(x => x.status === 'dispatched').length,
      completedTrips: t.filter(x => x.status === 'completed').length,
      totalDrivers: d.length,
      driversOnDuty: d.filter(x => x.status === 'on_trip').length,
      fuelCost: fl.reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
      maintCost: ml.reduce((s, r) => s + Number(r.cost ?? 0), 0),
      expCost: ex.reduce((s, r) => s + Number(r.amount ?? 0), 0),
    })

    setFleetDist([
      { name: 'Available', value: v.filter(x => x.status === 'available').length, color: '#22c55e' },
      { name: 'On Trip',   value: onTrip.length,                                  color: '#5b6af0' },
      { name: 'In Shop',   value: v.filter(x => x.status === 'in_shop').length,   color: '#f59e0b' },
      { name: 'Retired',   value: v.filter(x => x.status === 'retired').length,   color: '#3f3f52' },
    ])

    setTripDist([
      { name: 'Draft',      value: t.filter(x => x.status === 'draft').length,      color: '#3f3f52' },
      { name: 'Dispatched', value: t.filter(x => x.status === 'dispatched').length, color: '#5b6af0' },
      { name: 'Completed',  value: t.filter(x => x.status === 'completed').length,  color: '#22c55e' },
      { name: 'Cancelled',  value: t.filter(x => x.status === 'cancelled').length,  color: '#ef4444' },
    ].filter(x => x.value > 0))

    const months = []
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - i)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      months.push({
        month: dt.toLocaleString('default', { month: 'short' }),
        Fuel:        fl.filter(r => r.fueled_at?.startsWith(key)).reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
        Maintenance: ml.filter(r => r.service_date?.startsWith(key)).reduce((s, r) => s + Number(r.cost ?? 0), 0),
        Expenses:    ex.filter(r => r.expense_date?.startsWith(key)).reduce((s, r) => s + Number(r.amount ?? 0), 0),
      })
    }
    setCostTrend(months)
  }

  if (!stats) return <AppLayout><PageSpinner /></AppLayout>

  const totalCost = stats.fuelCost + stats.maintCost + stats.expCost
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <AppLayout>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Dashboard</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{date}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Live</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }} className="d-kpi">
        <Stat label="Fleet Size"       value={stats.vehicles}     sub={`${stats.available} available · ${stats.inShop} in shop`} />
        <Stat label="Utilization"      value={`${stats.utilization}%`} sub={`${stats.onTrip} vehicles on trip`} accent="var(--brand)" />
        <Stat label="Active Trips"     value={stats.activeTrips}  sub={`${stats.completedTrips} completed · ${stats.totalTrips} total`} />
        <Stat label="Drivers on Duty"  value={stats.driversOnDuty} sub={`of ${stats.totalDrivers} total drivers`} />
      </div>

      {/* Cost row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }} className="d-cost">
        {[
          { label: 'Fuel Cost',         value: fmtMoney(stats.fuelCost) },
          { label: 'Maintenance Cost',  value: fmtMoney(stats.maintCost) },
          { label: 'Other Expenses',    value: fmtMoney(stats.expCost) },
        ].map(c => (
          <div key={c.label} style={{
            padding: '14px 20px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.label}</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* Charts — main row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px', marginBottom: '12px' }} className="d-row1">

        {/* Cost trend */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cost Trend</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Last 6 months</p>
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              {[['Fuel','#5b6af0'],['Maintenance','#f59e0b'],['Expenses','#ef4444']].map(([l,c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                  <span style={{ width: '12px', height: '2px', background: c, borderRadius: '1px', display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={costTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {[['f','#5b6af0'],['m','#f59e0b'],['e','#ef4444']].map(([id,c]) => (
                  <linearGradient key={id} id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={c} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.035)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Fuel"        stroke="#5b6af0" fill="url(#gf)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="Maintenance" stroke="#f59e0b" fill="url(#gm)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="Expenses"    stroke="#ef4444" fill="url(#ge)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet distribution */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px 24px' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Fleet Distribution</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>Vehicles by status</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={fleetDist} barSize={28} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.035)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {fleetDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            {fleetDist.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                  {d.name}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="d-row2">

        {/* Trip breakdown */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px 24px' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Trip Breakdown</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>By status</p>
          {tripDist.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tripDist.map(d => {
                const pct = stats.totalTrips > 0 ? (d.value / stats.totalTrips * 100) : 0
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                        {d.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: d.color, borderRadius: '2px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>No trip data available.</p>
          )}
        </div>

        {/* Cost breakdown */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px 24px' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Cost Breakdown</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>Operational expenditure</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Fuel',         value: stats.fuelCost,  color: '#5b6af0' },
              { label: 'Maintenance',  value: stats.maintCost, color: '#f59e0b' },
              { label: 'Expenses',     value: stats.expCost,   color: '#ef4444' },
            ].map(item => {
              const pct = totalCost > 0 ? (item.value / totalCost * 100) : 0
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fmtMoney(item.value)}</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{fmtMoney(totalCost)}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .d-kpi  { grid-template-columns: repeat(2,1fr) !important; }
          .d-cost { grid-template-columns: repeat(2,1fr) !important; }
          .d-row1 { grid-template-columns: 1fr !important; }
          .d-row2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .d-kpi  { grid-template-columns: 1fr 1fr !important; }
          .d-cost { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  )
}
