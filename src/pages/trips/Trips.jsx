import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const emptyForm = { vehicle_id: '', driver_id: '', source: '', destination: '', cargo_weight: '', planned_distance: '', scheduled_at: '' }
const emptyComplete = { actual_distance: '', fuel_consumed: '', revenue: '' }

const STATUS_ORDER = ['draft', 'dispatched', 'completed', 'cancelled']
const STATUS_COLORS = { draft: '#64748b', dispatched: '#3b82f6', completed: '#10b981', cancelled: '#f43f5e' }

function TripCard({ trip, onDispatch, onComplete, onCancel }) {
  const color = STATUS_COLORS[trip.status] ?? '#64748b'
  return (
    <div className="card card-hover p-5 animate-fade-in-up relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-sm truncate">{trip.vehicles?.registration_number ?? '—'}</span>
            <span style={{ color: '#334155' }}>·</span>
            <span className="text-xs truncate" style={{ color: '#64748b' }}>{trip.drivers?.full_name ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
            <span className="truncate">{trip.source}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0" style={{ color: '#475569' }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span className="truncate">{trip.destination}</span>
          </div>
        </div>
        <Badge value={trip.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Cargo', value: trip.cargo_weight ? `${trip.cargo_weight} kg` : '—' },
          { label: 'Planned km', value: trip.planned_distance ? `${trip.planned_distance} km` : '—' },
          { label: 'Scheduled', value: trip.scheduled_at ? new Date(trip.scheduled_at).toLocaleDateString() : '—' },
        ].map(item => (
          <div key={item.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>{item.label}</p>
            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {trip.status === 'completed' && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Actual km', value: trip.actual_distance ? `${trip.actual_distance}` : '—' },
            { label: 'Fuel (L)', value: trip.fuel_consumed ? `${trip.fuel_consumed}` : '—' },
            { label: 'Revenue', value: trip.revenue ? `$${Number(trip.revenue).toFixed(0)}` : '—' },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>{item.label}</p>
              <p className="text-xs font-medium" style={{ color: '#34d399' }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {(trip.status === 'draft' || trip.status === 'dispatched') && (
        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {trip.status === 'draft' && (
            <button onClick={() => onDispatch(trip)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
            >🚀 Dispatch</button>
          )}
          {trip.status === 'dispatched' && (
            <button onClick={() => onComplete(trip)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
            >✓ Complete</button>
          )}
          <button onClick={() => onCancel(trip)} className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
          >Cancel</button>
        </div>
      )}
    </div>
  )
}

export default function Trips() {
  const toast = useToast()
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [completeModal, setCompleteModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [completeForm, setCompleteForm] = useState(emptyComplete)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [t, v, d] = await Promise.all([
      supabase.from('trips').select('*, vehicles(id,registration_number,name_model,max_load_capacity,status), drivers(id,full_name,status)').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('id,registration_number,name_model,max_load_capacity').eq('status', 'available'),
      supabase.from('drivers').select('id,full_name,license_expiry_date').eq('status', 'available').gt('license_expiry_date', new Date().toISOString().slice(0, 10)),
    ])
    setTrips(t.data ?? [])
    setVehicles(v.data ?? [])
    setDrivers(d.data ?? [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    const vehicle = vehicles.find(v => v.id === form.vehicle_id)
    if (vehicle?.max_load_capacity && Number(form.cargo_weight) > Number(vehicle.max_load_capacity)) {
      toast(`Cargo ${form.cargo_weight}kg exceeds ${vehicle.registration_number}'s capacity of ${vehicle.max_load_capacity}kg.`, 'error')
      setSaving(false); return
    }
    const { data: vCheck } = await supabase.from('vehicles').select('status,registration_number,max_load_capacity').eq('id', form.vehicle_id).single()
    if (!vCheck || vCheck.status !== 'available') {
      toast(`Vehicle ${vCheck?.registration_number} is no longer available.`, 'error')
      setSaving(false); fetchAll(); return
    }
    if (vCheck.max_load_capacity && Number(form.cargo_weight) > Number(vCheck.max_load_capacity)) {
      toast(`Cargo exceeds vehicle capacity of ${vCheck.max_load_capacity}kg.`, 'error')
      setSaving(false); return
    }
    const { data: dCheck } = await supabase.from('drivers').select('status,full_name,license_expiry_date').eq('id', form.driver_id).single()
    if (!dCheck || dCheck.status !== 'available') {
      toast(`Driver ${dCheck?.full_name} is no longer available.`, 'error')
      setSaving(false); fetchAll(); return
    }
    if (dCheck.license_expiry_date && new Date(dCheck.license_expiry_date) < new Date()) {
      toast(`Driver ${dCheck.full_name}'s license has expired.`, 'error')
      setSaving(false); return
    }
    const { error } = await supabase.from('trips').insert({ ...form, cargo_weight: form.cargo_weight || null, planned_distance: form.planned_distance || null, status: 'draft' })
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Trip created as Draft.', 'success')
    setModal(false); setForm(emptyForm); setSaving(false)
    fetchAll()
  }

  async function handleDispatch(trip) {
    const { data: vCheck } = await supabase.from('vehicles').select('status,registration_number').eq('id', trip.vehicle_id).single()
    if (vCheck?.status !== 'available') { toast(`Cannot dispatch: ${vCheck?.registration_number} is ${vCheck?.status?.replace('_',' ')}.`, 'error'); return }
    const { data: dCheck } = await supabase.from('drivers').select('status,full_name,license_expiry_date').eq('id', trip.driver_id).single()
    if (dCheck?.status !== 'available') { toast(`Cannot dispatch: ${dCheck?.full_name} is ${dCheck?.status?.replace('_',' ')}.`, 'error'); return }
    if (dCheck?.license_expiry_date && new Date(dCheck.license_expiry_date) < new Date()) { toast(`Cannot dispatch: ${dCheck.full_name}'s license has expired.`, 'error'); return }
    await Promise.all([
      supabase.from('trips').update({ status: 'dispatched', dispatched_at: new Date().toISOString() }).eq('id', trip.id),
      supabase.from('vehicles').update({ status: 'on_trip' }).eq('id', trip.vehicle_id),
      supabase.from('drivers').update({ status: 'on_trip' }).eq('id', trip.driver_id),
    ])
    toast(`Trip dispatched — ${trip.vehicles?.registration_number} is now On Trip.`, 'success')
    fetchAll()
  }

  async function handleComplete(e) {
    e.preventDefault()
    const trip = completeModal
    await Promise.all([
      supabase.from('trips').update({ status: 'completed', completed_at: new Date().toISOString(), actual_distance: completeForm.actual_distance || null, fuel_consumed: completeForm.fuel_consumed || null, revenue: completeForm.revenue || null }).eq('id', trip.id),
      supabase.from('vehicles').update({ status: 'available' }).eq('id', trip.vehicle_id),
      supabase.from('drivers').update({ status: 'available' }).eq('id', trip.driver_id),
    ])
    if (completeForm.revenue) {
      const { data: veh } = await supabase.from('vehicles').select('revenue_total').eq('id', trip.vehicle_id).single()
      await supabase.from('vehicles').update({ revenue_total: Number(veh?.revenue_total ?? 0) + Number(completeForm.revenue) }).eq('id', trip.vehicle_id)
    }
    toast('Trip completed. Vehicle and driver are now Available.', 'success')
    setCompleteModal(null); setCompleteForm(emptyComplete)
    fetchAll()
  }

  async function handleCancel(trip) {
    if (!confirm('Cancel this trip?')) return
    const updates = [supabase.from('trips').update({ status: 'cancelled' }).eq('id', trip.id)]
    if (trip.status === 'dispatched') {
      updates.push(supabase.from('vehicles').update({ status: 'available' }).eq('id', trip.vehicle_id))
      updates.push(supabase.from('drivers').update({ status: 'available' }).eq('id', trip.driver_id))
    }
    await Promise.all(updates)
    toast('Trip cancelled.', 'info')
    fetchAll()
  }

  const filtered = filterStatus ? trips.filter(t => t.status === filterStatus) : trips
  const counts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: trips.filter(t => t.status === s).length }), {})

  return (
    <AppLayout>
      <PageHeader
        title="Trip Management"
        subtitle={`${trips.length} total trips`}
        action={
          <button onClick={() => { setForm(emptyForm); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            New Trip
          </button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterStatus('')} className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: !filterStatus ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: !filterStatus ? '#60a5fa' : '#64748b', border: `1px solid ${!filterStatus ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
          All ({trips.length})
        </button>
        {STATUS_ORDER.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize" style={{ background: filterStatus === s ? `${STATUS_COLORS[s]}20` : 'rgba(255,255,255,0.04)', color: filterStatus === s ? STATUS_COLORS[s] : '#64748b', border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] + '40' : 'rgba(255,255,255,0.07)'}` }}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? <Skeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon="🗺️" title="No trips found"
          description={filterStatus ? 'No trips with this status.' : 'Create your first trip to get started.'}
          action={!filterStatus && <button onClick={() => { setForm(emptyForm); setModal(true) }} className="btn-primary">+ New Trip</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} onDispatch={handleDispatch} onComplete={(t) => { setCompleteModal(t); setCompleteForm(emptyComplete) }} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {/* New Trip Modal */}
      {modal && (
        <Modal title="Create New Trip" onClose={() => setModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label-small">Vehicle (available only) *</label>
              <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base" required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model} (max {v.max_load_capacity ?? '?'}kg)</option>)}
              </select>
              {vehicles.length === 0 && <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>⚠️ No available vehicles right now.</p>}
            </div>
            <div>
              <label className="label-small">Driver (available, valid license) *</label>
              <select value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} className="input-base" required>
                <option value="">Select driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              {drivers.length === 0 && <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>⚠️ No available drivers with valid licenses.</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Source / Origin *</label>
                <input placeholder="e.g. Warehouse A" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="input-base" required />
              </div>
              <div>
                <label className="label-small">Destination *</label>
                <input placeholder="e.g. Port B" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="input-base" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Cargo Weight (kg)</label>
                <input type="number" step="0.01" placeholder="450" value={form.cargo_weight} onChange={e => setForm({...form, cargo_weight: e.target.value})} className="input-base" />
              </div>
              <div>
                <label className="label-small">Planned Distance (km)</label>
                <input type="number" step="0.01" placeholder="120" value={form.planned_distance} onChange={e => setForm({...form, planned_distance: e.target.value})} className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-small">Scheduled Date & Time *</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} className="input-base" required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Creating...' : 'Create Trip'}
            </button>
          </form>
        </Modal>
      )}

      {/* Complete Trip Modal */}
      {completeModal && (
        <Modal title="Complete Trip" onClose={() => setCompleteModal(null)}>
          <div className="p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm font-semibold text-white">{completeModal.vehicles?.registration_number}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{completeModal.source} → {completeModal.destination}</p>
          </div>
          <form onSubmit={handleComplete} className="space-y-3">
            <div>
              <label className="label-small">Actual Distance (km) *</label>
              <input type="number" step="0.01" placeholder="0" value={completeForm.actual_distance} onChange={e => setCompleteForm({...completeForm, actual_distance: e.target.value})} className="input-base" required />
            </div>
            <div>
              <label className="label-small">Fuel Consumed (liters) *</label>
              <input type="number" step="0.01" placeholder="0" value={completeForm.fuel_consumed} onChange={e => setCompleteForm({...completeForm, fuel_consumed: e.target.value})} className="input-base" required />
            </div>
            <div>
              <label className="label-small">Revenue Earned ($) *</label>
              <input type="number" step="0.01" placeholder="0.00" value={completeForm.revenue} onChange={e => setCompleteForm({...completeForm, revenue: e.target.value})} className="input-base" required />
            </div>
            <button type="submit" className="btn-primary w-full" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              ✓ Mark as Completed
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
