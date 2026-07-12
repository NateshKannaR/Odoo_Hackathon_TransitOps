import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EMPTY = { vehicle_id: '', driver_id: '', trip_id: '', liters: '', cost_per_liter: '', total_cost: '', fueled_at: '' }

export default function Fuel() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [l, v, d, t] = await Promise.all([
      supabase.from('fuel_logs').select('*, vehicles(registration_number,plate_number), drivers(full_name), trips(origin,destination)').order('fueled_at', { ascending: false }),
      supabase.from('vehicles').select('id,registration_number,plate_number'),
      supabase.from('drivers').select('id,full_name'),
      supabase.from('trips').select('id,origin,destination').in('status', ['dispatched','completed']).order('created_at', { ascending: false }),
    ])
    setLogs(l.data ?? []); setVehicles(v.data ?? []); setDrivers(d.data ?? []); setTrips(t.data ?? [])
    setLoading(false)
  }

  function handleLiterOrCostChange(field, value) {
    const updated = { ...form, [field]: value }
    const liters = parseFloat(updated.liters), cpl = parseFloat(updated.cost_per_liter)
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
    toast(editing ? 'Log updated.' : 'Log added.', 'success')
    setModal(false); setForm(EMPTY); setEditing(null); fetchAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this fuel log?')) return
    await supabase.from('fuel_logs').delete().eq('id', id)
    toast('Log deleted.', 'info'); fetchAll()
  }

  function openEdit(row) {
    setForm({ vehicle_id: row.vehicle_id, driver_id: row.driver_id ?? '', trip_id: row.trip_id ?? '', liters: row.liters, cost_per_liter: row.cost_per_liter, total_cost: row.total_cost, fueled_at: row.fueled_at?.slice(0,10) })
    setEditing(row.id); setModal(true)
  }

  const totalLiters = logs.reduce((s, r) => s + Number(r.liters ?? 0), 0)
  const totalCost = logs.reduce((s, r) => s + Number(r.total_cost ?? 0), 0)
  const avgCpl = logs.length > 0 ? logs.reduce((s, r) => s + Number(r.cost_per_liter ?? 0), 0) / logs.length : 0

  const getVehicleName = log => log.vehicles?.registration_number ?? log.vehicles?.plate_number ?? '—'
  const getTripLabel = log => log.trips ? `${log.trips.origin ?? ''} → ${log.trips.destination ?? ''}` : '—'

  return (
    <AppLayout>
      <PageHeader
        title="Fuel Logs"
        subtitle={`${logs.length} records`}
        action={<button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M7 1v12M1 7h12"/></svg>Add Log</button>}
      />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Fuel', value: `${totalLiters.toFixed(1)} L`, color: 'var(--blue)' },
          { label: 'Total Cost', value: `$${totalCost.toFixed(2)}`, color: 'var(--amber)' },
          { label: 'Avg $/Liter', value: `$${avgCpl.toFixed(2)}`, color: 'var(--green)' },
        ].map((item, i) => (
          <div key={item.label} className={`card animate-slide-up delay-${i+1}`} style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '600', color: item.color, letterSpacing: '-0.02em' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? <Skeleton rows={6} /> : logs.length === 0 ? (
        <EmptyState icon="⛽" title="No fuel logs" description="Start recording fuel consumption." action={<button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary">Add Log</button>} />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr>{['Vehicle','Driver','Trip','Liters','$/Liter','Total','Date',''].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getVehicleName(log)}</td>
                    <td>{log.drivers?.full_name ?? '—'}</td>
                    <td style={{ maxWidth: '160px' }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTripLabel(log)}</span></td>
                    <td>{log.liters ? `${Number(log.liters).toFixed(1)} L` : '—'}</td>
                    <td>{log.cost_per_liter ? `$${Number(log.cost_per_liter).toFixed(2)}` : '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--amber)' }}>{log.total_cost ? `$${Number(log.total_cost).toFixed(2)}` : '—'}</td>
                    <td>{log.fueled_at || '—'}</td>
                    <td><div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(log)} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Edit</button>
                      <button onClick={() => handleDelete(log.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>{logs.length} record{logs.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Fuel Log' : 'Add Fuel Log'} onClose={() => { setModal(false); setForm(EMPTY); setEditing(null) }}>
          <form onSubmit={handleSave} style={{ display: 'contents' }}>
            <div><label className="label-small">Vehicle *</label><select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base" required><option value="">Select vehicle…</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number ?? v.plate_number}</option>)}</select></div>
            <div><label className="label-small">Driver</label><select value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} className="input-base"><option value="">Select driver…</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div>
            <div><label className="label-small">Trip</label><select value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})} className="input-base"><option value="">Select trip…</option>{trips.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Liters *</label><input type="number" step="0.01" placeholder="0.00" value={form.liters} onChange={e => handleLiterOrCostChange('liters', e.target.value)} className="input-base" required /></div>
              <div><label className="label-small">Cost/Liter ($) *</label><input type="number" step="0.001" placeholder="0.000" value={form.cost_per_liter} onChange={e => handleLiterOrCostChange('cost_per_liter', e.target.value)} className="input-base" required /></div>
            </div>
            <div><label className="label-small">Total Cost ($)</label><input type="number" step="0.01" placeholder="0.00" value={form.total_cost} onChange={e => setForm({...form, total_cost: e.target.value})} className="input-base" required /></div>
            <div><label className="label-small">Date *</label><input type="date" value={form.fueled_at} onChange={e => setForm({...form, fueled_at: e.target.value})} className="input-base" required /></div>
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '38px' }}>{editing ? 'Save Changes' : 'Add Log'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
