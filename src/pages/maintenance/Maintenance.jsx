import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EMPTY = { vehicle_id: '', description: '', cost: '', service_date: '', next_service_date: '', status: 'active' }

function MaintenanceCard({ log, onEdit, onDelete, onClose }) {
  const isActive = log.status === 'active'
  return (
    <div className="card card-interactive animate-slide-up" style={{ padding: '16px', borderTop: `2px solid ${isActive ? 'var(--amber)' : 'var(--green)'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{log.vehicles?.registration_number ?? '—'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{log.description}</p>
        </div>
        <Badge value={log.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
        {[
          { label: 'Cost', value: log.cost ? `$${Number(log.cost).toFixed(2)}` : '—' },
          { label: 'Service Date', value: log.service_date || '—' },
          { label: 'Next Service', value: log.next_service_date || '—' },
          { label: 'Vehicle', value: log.vehicles?.status?.replace('_',' ') || '—' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: '6px', padding: '7px 9px' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        {isActive && <button onClick={() => onClose(log)} className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px', color: 'var(--green)', borderColor: 'var(--green-border)', background: 'var(--green-muted)' }}>Close</button>}
        <button onClick={() => onEdit(log)} className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px' }}>Edit</button>
        <button onClick={() => onDelete(log.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>Delete</button>
      </div>
    </div>
  )
}

export default function Maintenance() {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [prevStatus, setPrevStatus] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [l, v] = await Promise.all([
      supabase.from('maintenance_logs').select('*, vehicles(id,registration_number,plate_number,status)').order('service_date', { ascending: false }),
      supabase.from('vehicles').select('id,registration_number,plate_number,status'),
    ])
    setLogs(l.data ?? []); setVehicles(v.data ?? []); setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (editing) {
      await supabase.from('maintenance_logs').update(form).eq('id', editing)
      if (prevStatus === 'active' && form.status === 'completed') {
        const vehicle = vehicles.find(v => v.id === form.vehicle_id)
        if (vehicle?.status !== 'retired') { await supabase.from('vehicles').update({ status: 'available' }).eq('id', form.vehicle_id); toast('Maintenance closed — vehicle restored.', 'success') }
      }
    } else {
      await supabase.from('maintenance_logs').insert(form)
      if (form.status === 'active') { await supabase.from('vehicles').update({ status: 'in_shop' }).eq('id', form.vehicle_id); toast('Vehicle set to In Shop.', 'success') }
    }
    if (editing) toast('Log updated.', 'success')
    setModal(false); setForm(EMPTY); setEditing(null); setPrevStatus(null); fetchAll()
  }

  async function handleCloseMaintenance(log) {
    const vehicle = vehicles.find(v => v.id === log.vehicle_id)
    await supabase.from('maintenance_logs').update({ status: 'completed' }).eq('id', log.id)
    if (vehicle?.status !== 'retired') await supabase.from('vehicles').update({ status: 'available' }).eq('id', log.vehicle_id)
    toast('Maintenance closed — vehicle restored.', 'success'); fetchAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this log?')) return
    await supabase.from('maintenance_logs').delete().eq('id', id)
    toast('Log deleted.', 'info'); fetchAll()
  }

  function openEdit(row) {
    setForm({ vehicle_id: row.vehicle_id, description: row.description, cost: row.cost ?? '', service_date: row.service_date ?? '', next_service_date: row.next_service_date ?? '', status: row.status })
    setPrevStatus(row.status); setEditing(row.id); setModal(true)
  }

  const filtered = filterStatus ? logs.filter(l => l.status === filterStatus) : logs
  const activeLogs = logs.filter(l => l.status === 'active')

  return (
    <AppLayout>
      <PageHeader
        title="Maintenance"
        subtitle={`${logs.length} records · ${activeLogs.length} active`}
        action={<button onClick={() => { setForm(EMPTY); setEditing(null); setPrevStatus(null); setModal(true) }} className="btn-primary"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M7 1v12M1 7h12"/></svg>Add Log</button>}
      />

      {activeLogs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: 'var(--amber-muted)', border: '1px solid var(--amber-border)', borderRadius: '8px', marginBottom: '14px' }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="var(--amber)" strokeWidth="1.5" style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '1px' }}><path d="M7 1L1 12h12L7 1z"/><path d="M7 5v3M7 10h.01"/></svg>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--amber)' }}>{activeLogs.length} vehicle{activeLogs.length > 1 ? 's' : ''} in maintenance</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{activeLogs.map(l => l.vehicles?.registration_number).join(', ')}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[['', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)} style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s', background: filterStatus === val ? 'var(--brand-muted)' : 'transparent', borderColor: filterStatus === val ? 'var(--brand-border)' : 'var(--border-subtle)', color: filterStatus === val ? 'var(--brand)' : 'var(--text-tertiary)' }}>
            {label} ({val === '' ? logs.length : logs.filter(l => l.status === val).length})
          </button>
        ))}
      </div>

      {loading ? <Skeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon="🔧" title="No maintenance logs" description="Add a maintenance record to get started." action={<button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary">Add Log</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {filtered.map(log => <MaintenanceCard key={log.id} log={log} onEdit={openEdit} onDelete={handleDelete} onClose={handleCloseMaintenance} />)}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Log' : 'Add Maintenance Log'} onClose={() => { setModal(false); setForm(EMPTY); setEditing(null) }}>
          <form onSubmit={handleSave} style={{ display: 'contents' }}>
            <div><label className="label-small">Vehicle *</label><select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base" required disabled={!!editing}><option value="">Select vehicle…</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number ?? v.plate_number} ({v.status?.replace('_',' ')})</option>)}</select></div>
            <div><label className="label-small">Description *</label><input placeholder="Oil Change, Brake Inspection…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-base" required /></div>
            <div><label className="label-small">Cost ($)</label><input type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input-base" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Service Date *</label><input type="date" value={form.service_date} onChange={e => setForm({...form, service_date: e.target.value})} className="input-base" required /></div>
              <div><label className="label-small">Next Service</label><input type="date" value={form.next_service_date} onChange={e => setForm({...form, next_service_date: e.target.value})} className="input-base" /></div>
            </div>
            <div><label className="label-small">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-base"><option value="active">Active — vehicle goes In Shop</option><option value="completed">Completed — vehicle reverts to Available</option></select></div>
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '38px' }}>{editing ? 'Save Changes' : 'Add Log'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
