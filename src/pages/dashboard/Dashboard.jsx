import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/layout/AppLayout'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts'

const KPI_CONFIG = [
  { key: 'activeVehicles',   label: 'Available Vehicles', icon: '🚗', color: '#10b981', glow: 'rgba(16,185,129,0.2)',  sub: 'Ready to dispatch' },
  { key: 'onTripVehicles',   label: 'On Trip',            icon: '🛣️', color: '#3b82f6', glow: 'rgba(59,130,246,0.2)',  sub: 'Currently active' },
  { key: 'inShopVehicles',   label: 'In Maintenance',     icon: '🔧', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',  sub: 'Under service' },
  { key: 'utilization',      label: 'Fleet Utilization',  icon: '📊', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',  sub: 'On Trip / Non-Retired', suffix: '%' },
  { key: 'activeTrips',      label: 'Active Trips',       icon: '🗺️', color: '#06b6d4', glow: 'rgba(6,182,212,0.2)',   sub: 'Dispatched' },
  { key: 'pendingTrips',     label: 'Pending Trips',      icon: '⏳', color: '#64748b', glow: 'rgba(100,116,139,0.2)', sub: 'Draft status' },
  { key: 'driversOnDuty',    label: 'Drivers On Duty',    icon: '👤', color: '#6366f1', glow: 'rgba(99,102,241,0.2)',  sub: 'Currently on trip' },
  { key: 'availableDrivers', label: 'Available Drivers',  icon: '✅', color: '#ec4899', glow: 'rgba(236,72,153,0.2)',  sub: 'Ready to assign' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(6,11,24,0.97)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.name !== 'count' ? `$${p.value.toFixed(0)}` : p.value}</p>
      ))}
    </div>
  )
}

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (target === null || target === undefined) return
    const num = parseFloat(target)
    if (isNaN(num)) { setCount(target); return }
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Number.isInteger(num) ? Math.round(eased * num) : (eased * num).toFixed(1))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [target, duration])
  return count
}

function KPICard({ config, value, index }) {
  const animated = useCountUp(value, 900 + index * 80)
  return (
    <div
      className="card card-hover p-5 animate-fade-in-up relative overflow-hidden"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-15 -translate-y-10 translate-x-10" style={{ background: config.color, filter: 'blur(24px)' }} />
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${config.color}60, transparent)` }} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{
          background: config.glow,
          border: `1px solid ${config.color}30`,
          boxShadow: `0 4px 12px ${config.glow}`,
        }}>
          {config.icon}
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: config.color, boxShadow: `0 0 10px ${config.color}` }} />
      </div>

      <p className="text-3xl font-bold text-white mb-1 relative z-10 animate-count-up" style={{ animationDelay: `${index * 0.06 + 0.1}s` }}>
        {animated}{config.suffix ?? ''}
      </p>
      <p className="text-xs font-semibold relative z-10" style={{ color: config.color }}>{config.label}</p>
      <p className="text-xs mt-0.5 relative z-10" style={{ color: '#1e293b' }}>{config.sub}</p>
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
      supabase.from('vehicles').select('id,status,created_at'),
      supabase.from('trips').select('id,status,vehicle_id,scheduled_at'),
      supabase.from('drivers').select('id,status'),
      supabase.from('fuel_logs').select('total_cost,fueled_at,vehicle_id'),
      supabase.from('maintenance_logs').select('cost,service_date,vehicle_id'),
      supabase.from('expenses').select('amount,expense_date'),
    ])

    const v = vehicles.data ?? []
    const t = trips.data ?? []
    const d = drivers.data ?? []
    const fl = fuelLogs.data ?? []
    const ml = maintenanceLogs.data ?? []
    const ex = expenses.data ?? []

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
      { name: 'Available', count: v.filter(x => x.status === 'available').length, fill: '#10b981' },
      { name: 'On Trip',   count: onTrip.length, fill: '#3b82f6' },
      { name: 'In Shop',   count: v.filter(x => x.status === 'in_shop').length, fill: '#f59e0b' },
      { name: 'Retired',   count: v.filter(x => x.status === 'retired').length, fill: '#f43f5e' },
    ])

    setTripStatusData([
      { name: 'Draft',      value: t.filter(x => x.status === 'draft').length,      fill: '#64748b' },
      { name: 'Dispatched', value: t.filter(x => x.status === 'dispatched').length,  fill: '#3b82f6' },
      { name: 'Completed',  value: t.filter(x => x.status === 'completed').length,   fill: '#10b981' },
      { name: 'Cancelled',  value: t.filter(x => x.status === 'cancelled').length,   fill: '#f43f5e' },
    ].filter(x => x.value > 0))

    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleString('default', { month: 'short' })
      const fuel = fl.filter(r => r.fueled_at?.startsWith(key)).reduce((s, r) => s + Number(r.total_cost ?? 0), 0)
      const maint = ml.filter(r => r.service_date?.startsWith(key)).reduce((s, r) => s + Number(r.cost ?? 0), 0)
      const exp = ex.filter(r => r.expense_date?.startsWith(key)).reduce((s, r) => s + Number(r.amount ?? 0), 0)
      months.push({ month: label, Fuel: fuel, Maintenance: maint, Expenses: exp })
    }
    setCostTrendData(months)
  }

  if (!stats) return (
    <AppLayout>
      <div className="flex items-center justify-center py-32">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#3b82f6', borderRightColor: 'rgba(59,130,246,0.3)' }} />
          <div className="absolute inset-1 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#8b5cf6', borderRightColor: 'rgba(139,92,246,0.3)', animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
      </div>
    </AppLayout>
  )

  const totalOpCost = stats.totalFuelCost + stats.totalMaintCost + stats.totalExpenses

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
            Live
          </span>
        </div>
        <div className="page-header-line w-20 mb-1" />
        <p className="text-sm" style={{ color: '#475569' }}>
          Welcome back, <span style={{ color: '#94a3b8' }}>{profile?.full_name}</span> · <span className="capitalize">{profile?.role?.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPI_CONFIG.map((cfg, i) => (
          <KPICard key={cfg.key} config={cfg} value={stats[cfg.key]} index={i} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cost Trend */}
        <div className="card p-5 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Cost Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: '#334155' }}>Last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#475569' }}>
              {[['Fuel','#3b82f6'],['Maintenance','#f59e0b'],['Expenses','#f43f5e']].map(([l,c]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={costTrendData}>
              <defs>
                {[['fuel','#3b82f6'],['maint','#f59e0b'],['exp','#f43f5e']].map(([id,c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Fuel" stroke="#3b82f6" fill="url(#fuel)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Maintenance" stroke="#f59e0b" fill="url(#maint)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trip Status Pie */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-sm font-bold text-white mb-1">Trip Status</h3>
          <p className="text-xs mb-4" style={{ color: '#334155' }}>Distribution</p>
          {tripStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={tripStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {tripStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {tripStatusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2" style={{ color: '#94a3b8' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill, boxShadow: `0 0 4px ${d.fill}` }} />{d.name}
                    </span>
                    <span className="font-semibold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-xs" style={{ color: '#1e293b' }}>No trip data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fleet Status Bar */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm font-bold text-white mb-1">Fleet Status Breakdown</h3>
          <p className="text-xs mb-4" style={{ color: '#334155' }}>Vehicle count by status</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={utilizationData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[8,8,0,0]}>
                {utilizationData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Summary */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <h3 className="text-sm font-bold text-white mb-1">Cost Summary</h3>
          <p className="text-xs mb-5" style={{ color: '#334155' }}>Total operational expenditure</p>
          <div className="space-y-4">
            {[
              { label: 'Fuel Costs',        value: stats.totalFuelCost,  color: '#3b82f6', pct: totalOpCost > 0 ? (stats.totalFuelCost / totalOpCost * 100) : 0 },
              { label: 'Maintenance Costs', value: stats.totalMaintCost, color: '#f59e0b', pct: totalOpCost > 0 ? (stats.totalMaintCost / totalOpCost * 100) : 0 },
              { label: 'Other Expenses',    value: stats.totalExpenses,  color: '#f43f5e', pct: totalOpCost > 0 ? (stats.totalExpenses / totalOpCost * 100) : 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span className="font-semibold text-white">${item.value.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`, boxShadow: `0 0 8px ${item.color}60` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Total Op. Cost</span>
                <span className="text-xl font-bold gradient-text">${totalOpCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
