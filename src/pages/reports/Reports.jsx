import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function exportPDF(data, summary) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFillColor(11, 11, 23)
  doc.rect(0, 0, 297, 20, 'F')
  doc.setTextColor(244, 244, 246)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TransitOps — Fleet Performance Report', 14, 13)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(139, 139, 158)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 230, 13)

  // Summary KPIs
  doc.setTextColor(30, 30, 50)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  const kpis = [
    ['Total Revenue', `$${summary.revenue.toFixed(2)}`],
    ['Total Op. Cost', `$${summary.cost.toFixed(2)}`],
    ['Net Profit', `$${(summary.revenue - summary.cost).toFixed(2)}`],
    ['Avg Fuel Efficiency', summary.avgEff !== '—' ? `${summary.avgEff} km/L` : '—'],
  ]
  kpis.forEach(([label, val], i) => {
    const x = 14 + i * 68
    doc.setFillColor(245, 245, 250)
    doc.roundedRect(x, 24, 64, 14, 2, 2, 'F')
    doc.setTextColor(100, 100, 120)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(label, x + 4, 30)
    doc.setTextColor(20, 20, 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(val, x + 4, 36)
  })

  // Table
  autoTable(doc, {
    startY: 44,
    head: [['Vehicle', 'Status', 'Fuel ($)', 'Maintenance ($)', 'Expenses ($)', 'Total Cost ($)', 'Distance (km)', 'Fuel (L)', 'Efficiency (km/L)', 'Revenue ($)', 'ROI (%)']],
    body: data.map(r => [
      r.plate_number,
      r.status,
      r.fuelCost.toFixed(2),
      r.maintCost.toFixed(2),
      r.expCost.toFixed(2),
      r.totalCost.toFixed(2),
      r.totalDistance.toFixed(1),
      r.totalFuelConsumed.toFixed(1),
      r.fuelEfficiency,
      r.revenue.toFixed(2),
      r.roi,
    ]),
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 30, 50] },
    headStyles: { fillColor: [91, 106, 240], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 200)
    doc.text(`TransitOps Fleet Report · Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 6)
  }

  doc.save(`transitops_report_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function exportCSV(data) {
  const headers = ['Vehicle','Status','Acquisition Cost','Fuel Cost','Maintenance Cost','Other Expenses','Total Op. Cost','Total Distance (km)','Total Fuel (L)','Fuel Efficiency (km/L)','Revenue','ROI (%)']
  const rows = data.map(r => [r.plate_number, r.status, r.acquisition_cost ?? 0, r.fuelCost.toFixed(2), r.maintCost.toFixed(2), r.expCost.toFixed(2), r.totalCost.toFixed(2), r.totalDistance.toFixed(2), r.totalFuelConsumed.toFixed(2), r.fuelEfficiency, r.revenue.toFixed(2), r.roi])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'transitops_report.csv'; a.click()
  URL.revokeObjectURL(url)
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-4)', border: '1px solid var(--border-default)', borderRadius: '7px', padding: '8px 12px', fontSize: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>{p.name}: {typeof p.value === 'number' ? `$${p.value.toFixed(2)}` : p.value}</p>)}
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
    const v = vehicles.data ?? [], t = trips.data ?? [], fl = fuelLogs.data ?? [], ml = maintLogs.data ?? [], ex = expenses.data ?? []
    const rows = v.map(veh => {
      const plate_number = veh.registration_number ?? veh.plate_number
      const fuelCost = fl.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.total_cost ?? 0), 0)
      const maintCost = ml.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.cost ?? 0), 0)
      const expCost = ex.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.amount ?? 0), 0)
      const totalCost = fuelCost + maintCost + expCost
      const vTrips = t.filter(r => r.vehicle_id === veh.id && r.status === 'completed')
      const totalDistance = vTrips.reduce((s, r) => s + Number(r.actual_distance ?? r.planned_distance ?? 0), 0)
      const totalFuelConsumed = vTrips.reduce((s, r) => s + Number(r.fuel_consumed ?? 0), 0) + fl.filter(r => r.vehicle_id === veh.id).reduce((s, r) => s + Number(r.liters ?? 0), 0)
      const fuelEfficiency = totalFuelConsumed > 0 ? (totalDistance / totalFuelConsumed).toFixed(2) : '—'
      const revenue = vTrips.reduce((s, r) => s + Number(r.revenue ?? 0), 0)
      const acqCost = Number(veh.acquisition_cost ?? 0)
      const roi = acqCost > 0 ? (((revenue - (maintCost + fuelCost)) / acqCost) * 100).toFixed(1) : '—'
      return { ...veh, plate_number, fuelCost, maintCost, expCost, totalCost, totalDistance, totalFuelConsumed, fuelEfficiency, revenue, roi }
    })
    setReport(rows); setLoading(false)
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
        title="Reports"
        subtitle="Fleet performance analytics"
        action={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: '130px', height: '34px', fontSize: '0.8125rem' }}>
              <option value="all">All Vehicles</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="in_shop">In Shop</option>
              <option value="retired">Retired</option>
            </select>
            <button onClick={() => exportCSV(filtered)} className="btn-secondary" style={{ height: '34px' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}><path d="M7 9V1M4 6l3 3 3-3M1 11v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"/></svg>
              CSV
            </button>
            <button
              onClick={() => exportPDF(filtered, { revenue: totalRevenue, cost: totalCost, avgEff: avgEfficiency })}
              className="btn-secondary"
              style={{ height: '34px', color: 'var(--red)', borderColor: 'var(--red-border)', background: 'var(--red-muted)' }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '12px', height: '12px' }}><path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L8 1z"/><path d="M8 1v5h5"/></svg>
              PDF
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'var(--green)' },
          { label: 'Total Op. Cost', value: `$${totalCost.toFixed(2)}`, color: 'var(--red)' },
          { label: 'Net Profit', value: `$${(totalRevenue - totalCost).toFixed(2)}`, color: totalRevenue >= totalCost ? 'var(--green)' : 'var(--red)' },
          { label: 'Avg Fuel Efficiency', value: avgEfficiency !== '—' ? `${avgEfficiency} km/L` : '—', color: 'var(--blue)' },
        ].map((item, i) => (
          <div key={item.label} className={`card animate-slide-up delay-${i+1}`} style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '1.125rem', fontWeight: '600', color: item.color, letterSpacing: '-0.02em' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? <Skeleton rows={6} /> : (
        <>
          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {chartData.length > 0 && (
              <div className="card animate-slide-up" style={{ padding: '16px 18px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Cost per Vehicle</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>Stacked by category</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={22} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Fuel" stackId="a" fill="var(--blue)" />
                    <Bar dataKey="Maintenance" stackId="a" fill="var(--amber)" />
                    <Bar dataKey="Expenses" stackId="a" fill="var(--red)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {efficiencyData.length > 0 && (
              <div className="card animate-slide-up delay-1" style={{ padding: '16px 18px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>Fuel Efficiency</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '14px' }}>km/L by vehicle</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={efficiencyData} barSize={22} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="efficiency" radius={[3,3,0,0]}>
                      {efficiencyData.map((_, i) => <Cell key={i} fill={`hsl(${155 + i * 25}, 60%, 50%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="card animate-slide-up delay-2" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>Vehicle Performance</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>{filtered.length} vehicles</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr>{['Vehicle','Status','Fuel','Maintenance','Expenses','Total Cost','Distance','Fuel (L)','Efficiency','Revenue','ROI'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>No data available.</td></tr>}
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.plate_number}</td>
                      <td><Badge value={r.status} /></td>
                      <td style={{ color: 'var(--blue)' }}>${r.fuelCost.toFixed(2)}</td>
                      <td style={{ color: 'var(--amber)' }}>${r.maintCost.toFixed(2)}</td>
                      <td>${r.expCost.toFixed(2)}</td>
                      <td style={{ fontWeight: 500, color: 'var(--red)' }}>${r.totalCost.toFixed(2)}</td>
                      <td>{r.totalDistance.toFixed(1)} km</td>
                      <td>{r.totalFuelConsumed.toFixed(1)} L</td>
                      <td style={{ color: r.fuelEfficiency !== '—' ? 'var(--green)' : 'var(--text-tertiary)', fontWeight: r.fuelEfficiency !== '—' ? 500 : 400 }}>{r.fuelEfficiency !== '—' ? `${r.fuelEfficiency} km/L` : '—'}</td>
                      <td style={{ color: 'var(--green)' }}>${r.revenue.toFixed(2)}</td>
                      <td>{r.roi !== '—' ? <span style={{ fontWeight: 600, color: Number(r.roi) >= 0 ? 'var(--green)' : 'var(--red)' }}>{r.roi}%</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
