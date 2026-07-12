import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const empty = { vehicle_id: '', description: '', cost: '', service_date: '', next_service_date: '', status: 'active' }

function MaintenanceCard({ log, onEdit, onDelete, onClose }) {
  const isActive = log.status === 'active'
  return (
    <div className="card card-hover p-5 animate-fade-in-up relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: isActive ? '#f59e0b' : '#10b981' }} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-white text-sm">{log.vehicles?.registration_number ?? log.vehicles?.plate_number ?? '—'}</p>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{log.description}</p>
        </div>
        <Badge value={log.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Cost', value: log.cost ? `$${Number(log.cost).toFixed(2)}` : '—' },
          { label: 'Service Date', value: log.service_date || '—' },
          { label: 'Next Service', value: log.next_service_date || '—' },
          { label: 'Vehicle Status', value: log.vehicles?.status?.replace('_',' ') || '—' },
        ].map(item => (
          <div key={item.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>{item.label}</p>
            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {isActive && (
          <button onClick={() => onClose(log)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
          >✓ Close Maintenance</button>
        )}
        <button onClick={() => onEdit(log)} className="py-1.5 px-3 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
        >Edit</button>
        <button onClick={() => onDelete(log.id)} className="py-1.5 px-3 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
        >Delete</button>
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
  const [form, setForm] = useState(empty)
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
    setLogs(l.data ?? [])
    setVehicles(v.data ?? [])
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (editing) {
      await supabase.from('maintenance_logs').update(form).eq('id', editing)
      if (prevStatus === 'active' && form.status === 'completed') {
        const vehicle = vehicles.find(v => v.id === form.vehicle_id)
        if (vehicle?.status !== 'retired') {
          await supabase.from('vehicles').update({ status: 'available' }).eq('id', form.vehicle_id)
          toast('Maintenance closed — vehicle restored to Available.', 'success')
        }
      }
    } else {
      await supabase.from('maintenance_logs').insert(form)
      if (form.status === 'active') {
        await supabase.from('vehicles').update({ status: 'in_shop' }).eq('id', form.vehicle_id)
        toast('Maintenance created — vehicle set to In Shop.', 'success')
      }
    }
    if (!editing) {} else toast('Maintenance log updated.', 'success')
    setModal(false); setForm(empty); setEditing(null); setPrevStatus(null)
    fetchAll()
  }

  async function handleCloseMaintenance(log) {
    const vehicle = vehicles.find(v => v.id === log.vehicle_id)
    await supabase.from('maintenance_logs').update({ status: 'completed' }).eq('id', log.id)
    if (vehicle?.status !== 'retired') {
      await supabase.from('vehicles').update({ status: 'available' }).eq('id', log.vehicle_id)
    }
    toast('Maintenance closed — vehicle restored to Available.', 'success')
    fetchAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this maintenance log?')) return
    await supabase.from('maintenance_logs').delete().eq('id', id)
    toast('Log deleted.', 'info')
    fetchAll()
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
        title="Maintenance Logs"
        subtitle={`${logs.length} total records · ${activeLogs.length} active`}
        action={
          <button onClick={() => { setForm(empty); setEditing(null); setPrevStatus(null); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            Add Log
          </button>
        }
      />

      {activeLogs.length > 0 && (
        <div className="mb-5 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span className="text-lg">🔧</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>{activeLogs.length} vehicle{activeLogs.length > 1 ? 's' : ''} currently in maintenance</p>
            <p className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>{activeLogs.map(l => l.vehicles?.registration_number ?? l.vehicles?.plate_number).join(', ')} — hidden from dispatch</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[['', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)} className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: filterStatus === val ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: filterStatus === val ? '#60a5fa' : '#64748b', border: `1px solid ${filterStatus === val ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
            {label} ({val === '' ? logs.length : logs.filter(l => l.status === val).length})
          </button>
        ))}
      </div>

      {loading ? <Skeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon="🔧" title="No maintenance logs" description="Add a maintenance record to get started." action={<button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary">+ Add Log</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(log => <MaintenanceCard key={log.id} log={log} onEdit={openEdit} onDelete={handleDelete} onClose={handleCloseMaintenance} />)}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Maintenance Log' : 'Add Maintenance Log'} onClose={() => { setModal(false); setForm(empty); setEditing(null) }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label-small">Vehicle *</label>
              <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base" required disabled={!!editing}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number ?? v.plate_number} ({v.status?.replace('_',' ')})</option>)}
              </select>
            </div>
            <div>
              <label className="label-small">Description *</label>
              <input placeholder="e.g. Oil Change, Brake Inspection" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-base" required />
            </div>
            <div>
              <label className="label-small">Cost ($)</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="input-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Service Date *</label>
                <input type="date" value={form.service_date} onChange={e => setForm({...form, service_date: e.target.value})} className="input-base" required />
              </div>
              <div>
                <label className="label-small">Next Service Date</label>
                <input type="date" value={form.next_service_date} onChange={e => setForm({...form, next_service_date: e.target.value})} className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-small">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-base">
                <option value="active">Active — vehicle goes In Shop</option>
                <option value="completed">Completed — vehicle reverts to Available</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">{editing ? 'Update Log' : 'Add Maintenance Log'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
