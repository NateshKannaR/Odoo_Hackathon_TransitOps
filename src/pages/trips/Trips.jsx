import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EMPTY_FORM = { vehicle_id: '', driver_id: '', source: '', destination: '', cargo_weight: '', planned_distance: '', scheduled_at: '' }
const EMPTY_COMPLETE = { actual_distance: '', fuel_consumed: '', revenue: '' }
const STATUS_ORDER = ['draft','dispatched','completed','cancelled']
const STATUS_COLOR = { draft: 'var(--text-tertiary)', dispatched: 'var(--blue)', completed: 'var(--green)', cancelled: 'var(--red)' }

function TripCard({ trip, onDispatch, onComplete, onCancel }) {
  const color = STATUS_COLOR[trip.status] ?? 'var(--text-tertiary)'
  return (
    <div className="card card-interactive animate-slide-up" style={{ padding: '16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{trip.vehicles?.registration_number ?? '—'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.drivers?.full_name ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{trip.source}</span>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '10px', height: '10px', flexShrink: 0, color: 'var(--text-tertiary)' }}><path d="M2 6h8M7 3l3 3-3 3"/></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{trip.destination}</span>
          </div>
        </div>
        <Badge value={trip.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '10px' }}>
        {[
          { label: 'Cargo', value: trip.cargo_weight ? `${trip.cargo_weight} kg` : '—' },
          { label: 'Planned', value: trip.planned_distance ? `${trip.planned_distance} km` : '—' },
          { label: 'Date', value: trip.scheduled_at ? new Date(trip.scheduled_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: '5px', padding: '6px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {trip.status === 'completed' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '10px' }}>
          {[
            { label: 'Actual km', value: trip.actual_distance ?? '—' },
            { label: 'Fuel (L)', value: trip.fuel_consumed ?? '—' },
            { label: 'Revenue', value: trip.revenue ? `$${Number(trip.revenue).toFixed(0)}` : '—' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--green-muted)', border: '1px solid var(--green-border)', borderRadius: '5px', padding: '6px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--green)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {(trip.status === 'draft' || trip.status === 'dispatched') && (
        <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          {trip.status === 'draft' && (
            <button onClick={() => onDispatch(trip)} className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px', color: 'var(--blue)', borderColor: 'var(--blue-border)', background: 'var(--blue-muted)' }}>Dispatch</button>
          )}
          {trip.status === 'dispatched' && (
            <button onClick={() => onComplete(trip)} className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px', color: 'var(--green)', borderColor: 'var(--green-border)', background: 'var(--green-muted)' }}>Complete</button>
          )}
          <button onClick={() => onCancel(trip)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>Cancel</button>
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
  const [form, setForm] = useState(EMPTY_FORM)
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE)
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
    setTrips(t.data ?? []); setVehicles(v.data ?? []); setDrivers(d.data ?? [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true)
    const vehicle = vehicles.find(v => v.id === form.vehicle_id)
    if (vehicle?.max_load_capacity && Number(form.cargo_weight) > Number(vehicle.max_load_capacity)) {
      toast(`Cargo exceeds ${vehicle.registration_number}'s capacity of ${vehicle.max_load_capacity}kg.`, 'error'); setSaving(false); return
    }
    const { data: vCheck } = await supabase.from('vehicles').select('status,registration_number,max_load_capacity').eq('id', form.vehicle_id).single()
    if (!vCheck || vCheck.status !== 'available') { toast(`Vehicle ${vCheck?.registration_number} is no longer available.`, 'error'); setSaving(false); fetchAll(); return }
    const { data: dCheck } = await supabase.from('drivers').select('status,full_name,license_expiry_date').eq('id', form.driver_id).single()
    if (!dCheck || dCheck.status !== 'available') { toast(`Driver ${dCheck?.full_name} is no longer available.`, 'error'); setSaving(false); fetchAll(); return }
    if (dCheck.license_expiry_date && new Date(dCheck.license_expiry_date) < new Date()) { toast(`Driver ${dCheck.full_name}'s license has expired.`, 'error'); setSaving(false); return }
    const { error } = await supabase.from('trips').insert({ ...form, cargo_weight: form.cargo_weight || null, planned_distance: form.planned_distance || null, status: 'draft' })
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    toast('Trip created.', 'success'); setModal(false); setForm(EMPTY_FORM); setSaving(false); fetchAll()
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
    toast('Trip dispatched.', 'success'); fetchAll()
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
    toast('Trip completed.', 'success'); setCompleteModal(null); setCompleteForm(EMPTY_COMPLETE); fetchAll()
  }

  async function handleCancel(trip) {
    if (!confirm('Cancel this trip?')) return
    const updates = [supabase.from('trips').update({ status: 'cancelled' }).eq('id', trip.id)]
    if (trip.status === 'dispatched') {
      updates.push(supabase.from('vehicles').update({ status: 'available' }).eq('id', trip.vehicle_id))
      updates.push(supabase.from('drivers').update({ status: 'available' }).eq('id', trip.driver_id))
    }
    await Promise.all(updates); toast('Trip cancelled.', 'info'); fetchAll()
  }

  const filtered = filterStatus ? trips.filter(t => t.status === filterStatus) : trips
  const counts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: trips.filter(t => t.status === s).length }), {})

  return (
    <AppLayout>
      <PageHeader
        title="Trips"
        subtitle={`${trips.length} total`}
        action={
          <button onClick={() => { setForm(EMPTY_FORM); setModal(true) }} className="btn-primary">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M7 1v12M1 7h12"/></svg>
            New Trip
          </button>
        }
      />

      {/* Status tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        <button onClick={() => setFilterStatus('')} style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s', background: !filterStatus ? 'var(--brand-muted)' : 'transparent', borderColor: !filterStatus ? 'var(--brand-border)' : 'var(--border-subtle)', color: !filterStatus ? 'var(--brand)' : 'var(--text-tertiary)' }}>
          All ({trips.length})
        </button>
        {STATUS_ORDER.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s', textTransform: 'capitalize', background: filterStatus === s ? 'var(--brand-muted)' : 'transparent', borderColor: filterStatus === s ? 'var(--brand-border)' : 'var(--border-subtle)', color: filterStatus === s ? 'var(--brand)' : 'var(--text-tertiary)' }}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? <Skeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon="🗺️" title="No trips found"
          description={filterStatus ? 'No trips with this status.' : 'Create your first trip to get started.'}
          action={!filterStatus && <button onClick={() => { setForm(EMPTY_FORM); setModal(true) }} className="btn-primary">New Trip</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} onDispatch={handleDispatch} onComplete={t => { setCompleteModal(t); setCompleteForm(EMPTY_COMPLETE) }} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Trip" onClose={() => setModal(false)}>
          <form onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div>
              <label className="label-small">Vehicle *</label>
              <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base" required>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model} (max {v.max_load_capacity ?? '?'}kg)</option>)}
              </select>
              {vehicles.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--amber)', marginTop: '4px' }}>No available vehicles.</p>}
            </div>
            <div>
              <label className="label-small">Driver *</label>
              <select value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} className="input-base" required>
                <option value="">Select driver…</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              {drivers.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--amber)', marginTop: '4px' }}>No available drivers with valid licenses.</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Origin *</label><input placeholder="Warehouse A" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="input-base" required /></div>
              <div><label className="label-small">Destination *</label><input placeholder="Port B" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="input-base" required /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Cargo (kg)</label><input type="number" step="0.01" placeholder="450" value={form.cargo_weight} onChange={e => setForm({...form, cargo_weight: e.target.value})} className="input-base" /></div>
              <div><label className="label-small">Distance (km)</label><input type="number" step="0.01" placeholder="120" value={form.planned_distance} onChange={e => setForm({...form, planned_distance: e.target.value})} className="input-base" /></div>
            </div>
            <div><label className="label-small">Scheduled *</label><input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} className="input-base" required /></div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', height: '38px' }}>{saving ? 'Creating…' : 'Create Trip'}</button>
          </form>
        </Modal>
      )}

      {completeModal && (
        <Modal title="Complete Trip" onClose={() => setCompleteModal(null)}>
          <div style={{ padding: '10px 12px', background: 'var(--surface-3)', borderRadius: '7px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>{completeModal.vehicles?.registration_number}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{completeModal.source} → {completeModal.destination}</p>
          </div>
          <form onSubmit={handleComplete} style={{ display: 'contents' }}>
            <div><label className="label-small">Actual Distance (km) *</label><input type="number" step="0.01" placeholder="0" value={completeForm.actual_distance} onChange={e => setCompleteForm({...completeForm, actual_distance: e.target.value})} className="input-base" required /></div>
            <div><label className="label-small">Fuel Consumed (L) *</label><input type="number" step="0.01" placeholder="0" value={completeForm.fuel_consumed} onChange={e => setCompleteForm({...completeForm, fuel_consumed: e.target.value})} className="input-base" required /></div>
            <div><label className="label-small">Revenue ($) *</label><input type="number" step="0.01" placeholder="0.00" value={completeForm.revenue} onChange={e => setCompleteForm({...completeForm, revenue: e.target.value})} className="input-base" required /></div>
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '38px', background: 'var(--green)', borderColor: 'transparent' }}>Mark Completed</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
