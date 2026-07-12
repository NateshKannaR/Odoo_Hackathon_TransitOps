import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

function exportCSV(data) {
  const headers = ['Vehicle','Status','Acquisition Cost','Fuel Cost','Maintenance Cost','Other Expenses','Total Op. Cost','Total Distance (km)','Total Fuel (L)','Fuel Efficiency (km/L)','Revenue','ROI (%)']
  const rows = data.map(r => [
    r.plate_number, r.status, r.acquisition_cost ?? 0,
    r.fuelCost.toFixed(2), r.maintCost.toFixed(2), r.expCost.toFixed(2),
    r.totalCost.toFixed(2), r.totalDistance.toFixed(2), r.totalFuelConsumed.toFixed(2),
    r.fuelEfficiency, r.revenue.toFixed(2), r.roi,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'transitops_report.csv'; a.click()
  URL.revokeObjectURL(url)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(13,21,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? `$${p.value.toFixed(2)}` : p.value}</p>)}
    </div>
  )
}

export default function Reports() {
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchReport() }, [])

  async function fetchReport() {
    setLoading(true)
    const [vehicles, trips, fuelLogs, maintLogs, expenses] = await Promise.all([
      supabase.from('vehicles').select('id,registration_number,plate_number,status,acquisition_cost'),
      supabase.from('trips').select('id,vehicle_id,status,planned_distance,actual_distance,fuel_consumed,revenue'),
      supabase.from('fuel_logs').select('vehicle_id,total_cost,liters'),
      supabase.from('maintenance_logs').select('vehicle_id,cost'),
      supabase.from('expenses').select('vehicle_id,amount'),
    ])

    const v = vehicles.data ?? []
    const t = trips.data ?? []
    const fl = fuelLogs.data ?? []
    const ml = maintLogs.data ?? []
    const ex = expenses.data ?? []

    const rows = v.map(veh => {
      const plate_number = veh.registration_number ?? veh.plate_number
      const fuelCost = fl.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.total_cost ?? 0), 0)
      const maintCost = ml.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.cost ?? 0), 0)
      const expCost = ex.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.amount ?? 0), 0)
      const totalCost = fuelCost + maintCost + expCost

      const vTrips = t.filter(r => r.vehicle_id === veh.id && r.status === 'completed')
      const totalDistance = vTrips.reduce((s, r) => s + Number(r.actual_distance ?? r.planned_distance ?? 0), 0)
      const totalFuelConsumed = vTrips.reduce((s, r) => s + Number(r.fuel_consumed ?? 0), 0)
        + fl.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.liters ?? 0), 0)
      const fuelEfficiency = totalFuelConsumed > 0 ? (totalDistance / totalFuelConsumed).toFixed(2) : '—'

      const revenue = vTrips.reduce((s, r) => s + Number(r.revenue ?? 0), 0)
      const acqCost = Number(veh.acquisition_cost ?? 0)
      const roi = acqCost > 0 ? (((revenue - (maintCost + fuelCost)) / acqCost) * 100).toFixed(1) : '—'

      return { ...veh, plate_number, fuelCost, maintCost, expCost, totalCost, totalDistance, totalFuelConsumed, fuelEfficiency, revenue, roi }
    })

    setReport(rows)
    setLoading(false)
  }

  const filtered = statusFilter === 'all' ? report : report.filter(r => r.status === statusFilter)

  const chartData = filtered.map(r => ({ name: r.plate_number, Fuel: r.fuelCost, Maintenance: r.maintCost, Expenses: r.expCost }))
  const efficiencyData = filtered.filter(r => r.fuelEfficiency !== '—').map(r => ({ name: r.plate_number, efficiency: Number(r.fuelEfficiency) }))

  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0)
  const totalCost = filtered.reduce((s, r) => s + r.totalCost, 0)
  const avgEfficiency = efficiencyData.length > 0 ? (efficiencyData.reduce((s, r) => s + r.efficiency, 0) / efficiencyData.length).toFixed(2) : '—'

  return (
    <AppLayout>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fleet performance overview"
        action={
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: '140px' }}>
              <option value="all">All Vehicles</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="in_shop">In Shop</option>
              <option value="retired">Retired</option>
            </select>
            <button onClick={() => exportCSV(filtered)} className="btn-primary flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export CSV
            </button>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#10b981', icon: '💹' },
          { label: 'Total Op. Cost', value: `$${totalCost.toFixed(2)}`, color: '#f43f5e', icon: '💸' },
          { label: 'Net Profit', value: `$${(totalRevenue - totalCost).toFixed(2)}`, color: totalRevenue >= totalCost ? '#10b981' : '#f43f5e', icon: '📈' },
          { label: 'Avg Fuel Efficiency', value: avgEfficiency !== '—' ? `${avgEfficiency} km/L` : '—', color: '#3b82f6', icon: '⛽' },
        ].map(item => (
          <div key={item.label} className="card p-4 flex items-center gap-3 animate-fade-in-up">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>{item.label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? <Skeleton rows={6} /> : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {chartData.length > 0 && (
              <div className="card p-5 animate-fade-in-up">
                <h3 className="text-sm font-bold text-white mb-1">Operational Cost per Vehicle</h3>
                <p className="text-xs mb-4" style={{ color: '#475569' }}>Stacked by category</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Fuel" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Maintenance" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Expenses" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {efficiencyData.length > 0 && (
              <div className="card p-5 animate-fade-in-up">
                <h3 className="text-sm font-bold text-white mb-1">Fuel Efficiency</h3>
                <p className="text-xs mb-4" style={{ color: '#475569' }}>km per liter by vehicle</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={efficiencyData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="efficiency" radius={[6,6,0,0]}>
                      {efficiencyData.map((_, i) => <Cell key={i} fill={`hsl(${160 + i * 30}, 70%, 55%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Report Table */}
          <div className="card overflow-x-auto animate-fade-in-up">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-bold text-white">Vehicle Performance Report</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{filtered.length} vehicles</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  {['Vehicle','Status','Fuel Cost','Maint. Cost','Other Exp.','Total Cost','Distance','Fuel (L)','Efficiency','Revenue','ROI'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-8" style={{ color: '#334155' }}>No data available.</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-bold text-white">{r.plate_number}</td>
                    <td><Badge value={r.status} /></td>
                    <td style={{ color: '#60a5fa' }}>${r.fuelCost.toFixed(2)}</td>
                    <td style={{ color: '#fbbf24' }}>${r.maintCost.toFixed(2)}</td>
                    <td style={{ color: '#94a3b8' }}>${r.expCost.toFixed(2)}</td>
                    <td><span className="font-bold" style={{ color: '#fb7185' }}>${r.totalCost.toFixed(2)}</span></td>
                    <td>{r.totalDistance.toFixed(1)} km</td>
                    <td>{r.totalFuelConsumed.toFixed(1)} L</td>
                    <td>
                      <span className="font-semibold" style={{ color: r.fuelEfficiency !== '—' ? '#34d399' : '#475569' }}>
                        {r.fuelEfficiency !== '—' ? `${r.fuelEfficiency} km/L` : '—'}
                      </span>
                    </td>
                    <td style={{ color: '#34d399' }}>${r.revenue.toFixed(2)}</td>
                    <td>
                      {r.roi !== '—' ? (
                        <span className="font-bold" style={{ color: Number(r.roi) >= 0 ? '#34d399' : '#fb7185' }}>
                          {r.roi}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  )
}
