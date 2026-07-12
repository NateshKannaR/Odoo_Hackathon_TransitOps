import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const empty = { vehicle_id: '', driver_id: '', trip_id: '', liters: '', cost_per_liter: '', total_cost: '', fueled_at: '' }

export default function Fuel() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [l, v, d, t] = await Promise.all([
      supabase.from('fuel_logs').select('*, vehicles(registration_number,plate_number), drivers(full_name), trips(source,origin,destination)').order('fueled_at', { ascending: false }),
      supabase.from('vehicles').select('id,registration_number,plate_number'),
      supabase.from('drivers').select('id,full_name'),
      supabase.from('trips').select('id,source,origin,destination').in('status', ['dispatched','completed']).order('created_at', { ascending: false }),
    ])
    setLogs(l.data ?? [])
    setVehicles(v.data ?? [])
    setDrivers(d.data ?? [])
    setTrips(t.data ?? [])
    setLoading(false)
  }

  function handleLiterOrCostChange(field, value) {
    const updated = { ...form, [field]: value }
    const liters = parseFloat(updated.liters)
    const cpl = parseFloat(updated.cost_per_liter)
    if (!isNaN(liters) && !isNaN(cpl)) updated.total_cost = (liters * cpl).toFixed(2)
    setForm(updated)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = { ...form, trip_id: form.trip_id || null, driver_id: form.driver_id || null }
    const { error } = editing
      ? await supabase.from('fuel_logs').update(payload).eq('id', editing)
      : await supabase.from('fuel_logs').insert(payload)
    if (error) { toast(error.message, 'error'); return }
    toast(editing ? 'Fuel log updated.' : 'Fuel log added.', 'success')
    setModal(false); setForm(empty); setEditing(null)
    fetchAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this fuel log?')) return
    await supabase.from('fuel_logs').delete().eq('id', id)
    toast('Fuel log deleted.', 'info')
    fetchAll()
  }

  function openEdit(row) {
    setForm({ vehicle_id: row.vehicle_id, driver_id: row.driver_id ?? '', trip_id: row.trip_id ?? '', liters: row.liters, cost_per_liter: row.cost_per_liter, total_cost: row.total_cost, fueled_at: row.fueled_at?.slice(0,10) })
    setEditing(row.id); setModal(true)
  }

  const totalLiters = logs.reduce((s, r) => s + Number(r.liters ?? 0), 0)
  const totalCost = logs.reduce((s, r) => s + Number(r.total_cost ?? 0), 0)
  const avgCpl = logs.length > 0 ? logs.reduce((s, r) => s + Number(r.cost_per_liter ?? 0), 0) / logs.length : 0

  const getVehicleName = (log) => log.vehicles?.registration_number ?? log.vehicles?.plate_number ?? '—'
  const getTripLabel = (log) => {
    if (!log.trips) return '—'
    return `${log.trips.source ?? log.trips.origin ?? ''} → ${log.trips.destination ?? ''}`
  }

  return (
    <AppLayout>
      <PageHeader
        title="Fuel Logs"
        subtitle={`${logs.length} records`}
        action={
          <button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            Add Fuel Log
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Fuel', value: `${totalLiters.toFixed(1)} L`, color: '#3b82f6', icon: '⛽' },
          { label: 'Total Cost', value: `$${totalCost.toFixed(2)}`, color: '#f59e0b', icon: '💰' },
          { label: 'Avg Cost/Liter', value: `$${avgCpl.toFixed(2)}`, color: '#10b981', icon: '📊' },
        ].map(item => (
          <div key={item.label} className="card p-4 flex items-center gap-4 animate-fade-in-up">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>{item.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? <Skeleton rows={6} /> : logs.length === 0 ? (
        <EmptyState icon="⛽" title="No fuel logs" description="Start recording fuel consumption." action={<button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary">+ Add Fuel Log</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Vehicle','Driver','Trip','Liters','$/Liter','Total Cost','Date','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="font-semibold text-white">{getVehicleName(log)}</td>
                  <td>{log.drivers?.full_name ?? '—'}</td>
                  <td style={{ maxWidth: '160px' }}><span className="truncate block">{getTripLabel(log)}</span></td>
                  <td>{log.liters ? `${Number(log.liters).toFixed(1)} L` : '—'}</td>
                  <td>{log.cost_per_liter ? `$${Number(log.cost_per_liter).toFixed(2)}` : '—'}</td>
                  <td><span className="font-semibold" style={{ color: '#fbbf24' }}>{log.total_cost ? `$${Number(log.total_cost).toFixed(2)}` : '—'}</span></td>
                  <td>{log.fueled_at || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(log)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>Edit</button>
                      <button onClick={() => handleDelete(log.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-xs" style={{ color: '#334155', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{logs.length} record{logs.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Fuel Log' : 'Add Fuel Log'} onClose={() => { setModal(false); setForm(empty); setEditing(null) }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label-small">Vehicle *</label>
              <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base" required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number ?? v.plate_number}</option>)}
              </select>
            </div>
            <div>
              <label className="label-small">Driver (optional)</label>
              <select value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} className="input-base">
                <option value="">Select driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-small">Link to Trip (optional)</label>
              <select value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})} className="input-base">
                <option value="">Select trip...</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.source ?? t.origin} → {t.destination}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Liters *</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.liters} onChange={e => handleLiterOrCostChange('liters', e.target.value)} className="input-base" required />
              </div>
              <div>
                <label className="label-small">Cost per Liter ($) *</label>
                <input type="number" step="0.001" placeholder="0.000" value={form.cost_per_liter} onChange={e => handleLiterOrCostChange('cost_per_liter', e.target.value)} className="input-base" required />
              </div>
            </div>
            <div>
              <label className="label-small">Total Cost ($) — auto-calculated</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.total_cost} onChange={e => setForm({...form, total_cost: e.target.value})} className="input-base" style={{ background: 'rgba(59,130,246,0.05)' }} required />
            </div>
            <div>
              <label className="label-small">Date *</label>
              <input type="date" value={form.fueled_at} onChange={e => setForm({...form, fueled_at: e.target.value})} className="input-base" required />
            </div>
            <button type="submit" className="btn-primary w-full">{editing ? 'Update Log' : 'Add Fuel Log'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
