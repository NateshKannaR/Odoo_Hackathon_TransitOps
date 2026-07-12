import { useEffect, useState, useMemo } from 'react'
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

const VEHICLE_TYPES = ['Bus', 'Van', 'Truck', 'Minibus', 'SUV', 'Pickup']
const VEHICLE_STATUSES = ['available', 'on_trip', 'in_shop', 'retired']

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.72rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {label && <p style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'value' && p.name !== 'count' ? fmtMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function Stat({ label, value, sub, accent }) {
  return (
    <div style={{ padding: '20px 24px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1.875rem', fontWeight: 700, color: accent ?? 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
  )
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        height: '32px', padding: '0 28px 0 10px', fontSize: '0.78rem',
        background: value ? 'var(--brand-muted)' : 'var(--surface-2)',
        border: `1px solid ${value ? 'var(--brand-border)' : 'var(--border-default)'}`,
        borderRadius: '7px', color: value ? 'var(--brand)' : 'var(--text-secondary)',
        cursor: 'pointer', outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 3l3 4 3-4' stroke='%234a4a5e' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()

  // raw data
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [maintLogs, setMaintLogs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)

  // filters
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRegion, setFilterRegion] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const [vRes, tRes, dRes, flRes, mlRes, exRes] = await Promise.all([
      supabase.from('vehicles').select('id,status,type,region'),
      supabase.from('trips').select('id,status,vehicle_id'),
      supabase.from('drivers').select('id,status'),
      supabase.from('fuel_logs').select('vehicle_id,total_cost,fueled_at'),
      supabase.from('maintenance_logs').select('vehicle_id,cost,service_date'),
      supabase.from('expenses').select('vehicle_id,amount,expense_date'),
    ])
    const v = vRes.data ?? []
    setVehicles(v)
    setTrips(tRes.data ?? [])
    setDrivers(dRes.data ?? [])
    setFuelLogs(flRes.data ?? [])
    setMaintLogs(mlRes.data ?? [])
    setExpenses(exRes.data ?? [])
    // collect unique regions
    const uniqueRegions = [...new Set(v.map(x => x.region).filter(Boolean))].sort()
    setRegions(uniqueRegions)
    setLoading(false)
  }

  // filtered vehicle ids
  const filteredVehicles = useMemo(() => {
    let v = vehicles
    if (filterType) v = v.filter(x => x.type === filterType)
    if (filterStatus) v = v.filter(x => x.status === filterStatus)
    if (filterRegion) v = v.filter(x => x.region === filterRegion)
    return v
  }, [vehicles, filterType, filterStatus, filterRegion])

  const filteredIds = useMemo(() => new Set(filteredVehicles.map(v => v.id)), [filteredVehicles])

  const isFiltered = filterType || filterStatus || filterRegion

  // scoped data
  const scopedTrips = useMemo(() => isFiltered ? trips.filter(t => filteredIds.has(t.vehicle_id)) : trips, [trips, filteredIds, isFiltered])
  const scopedFuel = useMemo(() => isFiltered ? fuelLogs.filter(r => filteredIds.has(r.vehicle_id)) : fuelLogs, [fuelLogs, filteredIds, isFiltered])
  const scopedMaint = useMemo(() => isFiltered ? maintLogs.filter(r => filteredIds.has(r.vehicle_id)) : maintLogs, [maintLogs, filteredIds, isFiltered])
  const scopedExp = useMemo(() => isFiltered ? expenses.filter(r => filteredIds.has(r.vehicle_id)) : expenses, [expenses, filteredIds, isFiltered])

  const stats = useMemo(() => {
    const v = filteredVehicles
    const t = scopedTrips
    const d = isFiltered ? drivers : drivers  // drivers not filtered by vehicle
    const fl = scopedFuel, ml = scopedMaint, ex = scopedExp

    const active = v.filter(x => x.status !== 'retired')
    const onTrip = v.filter(x => x.status === 'on_trip')
    const utilPct = active.length ? ((onTrip.length / active.length) * 100).toFixed(0) : 0

    return {
      vehicles: active.length,
      available: v.filter(x => x.status === 'available').length,
      onTrip: onTrip.length,
      inShop: v.filter(x => x.status === 'in_shop').length,
      utilization: utilPct,
      totalTrips: t.length,
      activeTrips: t.filter(x => x.status === 'dispatched').length,
      completedTrips: t.filter(x => x.status === 'completed').length,
      pendingTrips: t.filter(x => x.status === 'draft').length,
      totalDrivers: d.length,
      driversOnDuty: d.filter(x => x.status === 'on_trip').length,
      fuelCost: fl.reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
      maintCost: ml.reduce((s, r) => s + Number(r.cost ?? 0), 0),
      expCost: ex.reduce((s, r) => s + Number(r.amount ?? 0), 0),
    }
  }, [filteredVehicles, scopedTrips, scopedFuel, scopedMaint, scopedExp, drivers, isFiltered])

  const fleetDist = useMemo(() => [
    { name: 'Available', value: filteredVehicles.filter(x => x.status === 'available').length, color: '#22c55e' },
    { name: 'On Trip',   value: filteredVehicles.filter(x => x.status === 'on_trip').length,   color: '#5b6af0' },
    { name: 'In Shop',   value: filteredVehicles.filter(x => x.status === 'in_shop').length,   color: '#f59e0b' },
    { name: 'Retired',   value: filteredVehicles.filter(x => x.status === 'retired').length,   color: '#3f3f52' },
  ], [filteredVehicles])

  const tripDist = useMemo(() => [
    { name: 'Draft',      value: scopedTrips.filter(x => x.status === 'draft').length,      color: '#3f3f52' },
    { name: 'Dispatched', value: scopedTrips.filter(x => x.status === 'dispatched').length, color: '#5b6af0' },
    { name: 'Completed',  value: scopedTrips.filter(x => x.status === 'completed').length,  color: '#22c55e' },
    { name: 'Cancelled',  value: scopedTrips.filter(x => x.status === 'cancelled').length,  color: '#ef4444' },
  ].filter(x => x.value > 0), [scopedTrips])

  const costTrend = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - i)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      months.push({
        month: dt.toLocaleString('default', { month: 'short' }),
        Fuel:        scopedFuel.filter(r => r.fueled_at?.startsWith(key)).reduce((s, r) => s + Number(r.total_cost ?? 0), 0),
        Maintenance: scopedMaint.filter(r => r.service_date?.startsWith(key)).reduce((s, r) => s + Number(r.cost ?? 0), 0),
        Expenses:    scopedExp.filter(r => r.expense_date?.startsWith(key)).reduce((s, r) => s + Number(r.amount ?? 0), 0),
      })
    }
    return months
  }, [scopedFuel, scopedMaint, scopedExp])

  if (loading) return <AppLayout><PageSpinner /></AppLayout>

  const totalCost = stats.fuelCost + stats.maintCost + stats.expCost
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hasFilters = filterType || filterStatus || filterRegion

  return (
    <AppLayout>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Dashboard</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{date}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Live</span>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        padding: '10px 14px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        marginBottom: '20px',
      }}>
        <svg viewBox="0 0 14 14" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.4" style={{ width: 13, height: 13, flexShrink: 0 }}>
          <path d="M1 3h12M3 7h8M5 11h4" />
        </svg>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginRight: '4px' }}>Filter by</span>

        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          options={VEHICLE_TYPES}
          placeholder="Vehicle Type"
        />
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={VEHICLE_STATUSES.map(s => ({ value: s, label: s.replace('_', ' ') }))}
          placeholder="Status"
        />
        <FilterSelect
          value={filterRegion}
          onChange={setFilterRegion}
          options={regions}
          placeholder="Region"
        />

        {hasFilters && (
          <button
            onClick={() => { setFilterType(''); setFilterStatus(''); setFilterRegion('') }}
            style={{ marginLeft: '4px', fontSize: '0.72rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            Clear
          </button>
        )}

        {hasFilters && (
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--brand)', background: 'var(--brand-muted)', border: '1px solid var(--brand-border)', borderRadius: '5px', padding: '2px 8px' }}>
            {filteredVehicles.length} of {vehicles.length} vehicles
          </span>
        )}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }} className="d-kpi">
        <Stat label="Fleet Size"      value={stats.vehicles}      sub={`${stats.available} available · ${stats.inShop} in shop`} />
        <Stat label="Utilization"     value={`${stats.utilization}%`} sub={`${stats.onTrip} vehicles on trip`} accent="var(--brand)" />
        <Stat label="Active Trips"    value={stats.activeTrips}   sub={`${stats.pendingTrips} pending · ${stats.completedTrips} completed`} />
        <Stat label="Drivers on Duty" value={stats.driversOnDuty} sub={`of ${stats.totalDrivers} total drivers`} />
      </div>

      {/* Cost row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }} className="d-cost">
        {[
          { label: 'Fuel Cost',        value: fmtMoney(stats.fuelCost) },
          { label: 'Maintenance Cost', value: fmtMoney(stats.maintCost) },
          { label: 'Other Expenses',   value: fmtMoney(stats.expCost) },
        ].map(c => (
          <div key={c.label} style={{ padding: '14px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.label}</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px', marginBottom: '12px' }} className="d-row1">

        {/* Cost trend */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cost Trend</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Last 6 months</p>
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              {[['Fuel', '#5b6af0'], ['Maintenance', '#f59e0b'], ['Expenses', '#ef4444']].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                  <span style={{ width: '12px', height: '2px', background: c, borderRadius: '1px', display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={costTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {[['f', '#5b6af0'], ['m', '#f59e0b'], ['e', '#ef4444']].map(([id, c]) => (
                  <linearGradient key={id} id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.18} />
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
                  <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />{d.name}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
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
                        <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />{d.name}
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
              { label: 'Fuel',        value: stats.fuelCost,  color: '#5b6af0' },
              { label: 'Maintenance', value: stats.maintCost, color: '#f59e0b' },
              { label: 'Expenses',    value: stats.expCost,   color: '#ef4444' },
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
