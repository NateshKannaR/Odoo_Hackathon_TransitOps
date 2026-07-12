import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EMPTY = { registration_number: '', name_model: '', type: '', region: '', max_load_capacity: '', acquisition_cost: '', odometer: '', status: 'available' }
const TYPES = ['Bus','Van','Truck','Minibus','SUV','Pickup']
const STATUSES = ['available','on_trip','in_shop','retired']

function VehicleCard({ v, onEdit, onDelete }) {
  return (
    <div className="card card-interactive animate-slide-up" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{v.registration_number}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{v.name_model}</p>
        </div>
        <Badge value={v.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
        {[
          { label: 'Type',     value: v.type || '—' },
          { label: 'Region',   value: v.region || '—' },
          { label: 'Max Load', value: v.max_load_capacity ? `${v.max_load_capacity} kg` : '—' },
          { label: 'Odometer', value: v.odometer ? `${v.odometer} km` : '—' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: '6px', padding: '7px 9px' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {v.acquisition_cost && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
          Acquisition: <span style={{ color: 'var(--text-secondary)' }}>${Number(v.acquisition_cost).toLocaleString()}</span>
        </p>
      )}

      {v.document_url && (
        <a href={v.document_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--brand)', textDecoration: 'none', marginBottom: '10px' }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '12px', height: '12px' }}><path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L8 1z"/><path d="M8 1v5h5"/></svg>
          {v.document_name ?? 'Document'}
        </a>
      )}

      <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={() => onEdit(v)} className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px' }}>Edit</button>
        <button onClick={() => onDelete(v.id)} className="btn-danger" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px' }}>Delete</button>
      </div>
    </div>
  )
}

export default function Vehicles() {
  const toast = useToast()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [docFile, setDocFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [view, setView] = useState('grid')

  useEffect(() => { fetchVehicles() }, [])

  async function fetchVehicles() {
    setLoading(true)
    const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
    if (error) toast(error.message, 'error')
    setVehicles(data ?? [])
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!editing) {
      const { data: existing } = await supabase.from('vehicles').select('id').eq('registration_number', form.registration_number.trim().toUpperCase()).maybeSingle()
      if (existing) { toast('Registration number already exists.', 'error'); return }
    }
    let payload = { ...form, registration_number: form.registration_number.trim().toUpperCase() }
    if (docFile) {
      setUploading(true)
      const ext = docFile.name.split('.').pop()
      const path = `${payload.registration_number}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('vehicle-docs').upload(path, docFile, { upsert: true })
      if (upErr) { toast(`Upload failed: ${upErr.message}`, 'error'); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('vehicle-docs').getPublicUrl(path)
      payload.document_url = urlData.publicUrl
      payload.document_name = docFile.name
      setUploading(false)
    }
    const { error } = editing
      ? await supabase.from('vehicles').update(payload).eq('id', editing)
      : await supabase.from('vehicles').insert(payload)
    if (error) { toast(error.message, 'error'); return }
    toast(editing ? 'Vehicle updated.' : 'Vehicle added.', 'success')
    setModal(false); setForm(EMPTY); setEditing(null); setDocFile(null)
    fetchVehicles()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this vehicle?')) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    toast('Vehicle deleted.', 'success')
    fetchVehicles()
  }

  function openEdit(v) {
    setForm({ registration_number: v.registration_number, name_model: v.name_model, type: v.type ?? '', region: v.region ?? '', max_load_capacity: v.max_load_capacity ?? '', acquisition_cost: v.acquisition_cost ?? '', odometer: v.odometer ?? '', status: v.status })
    setEditing(v.id); setDocFile(null); setModal(true)
  }

  const filtered = useMemo(() => {
    let data = [...vehicles]
    if (search) data = data.filter(v => `${v.registration_number} ${v.name_model} ${v.region}`.toLowerCase().includes(search.toLowerCase()))
    if (filterType) data = data.filter(v => v.type === filterType)
    if (filterStatus) data = data.filter(v => v.status === filterStatus)
    return data
  }, [vehicles, search, filterType, filterStatus])

  const statusCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: vehicles.filter(v => v.status === s).length }), {})

  return (
    <AppLayout>
      <PageHeader
        title="Vehicles"
        subtitle={`${vehicles.length} registered`}
        action={
          <button onClick={() => { setForm(EMPTY); setEditing(null); setDocFile(null); setModal(true) }} className="btn-primary">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M7 1v12M1 7h12"/></svg>
            Add Vehicle
          </button>
        }
      />

      {/* Status pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        <button
          onClick={() => setFilterStatus('')}
          style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s',
            background: !filterStatus ? 'var(--brand-muted)' : 'transparent',
            borderColor: !filterStatus ? 'var(--brand-border)' : 'var(--border-subtle)',
            color: !filterStatus ? 'var(--brand)' : 'var(--text-tertiary)',
          }}
        >All ({vehicles.length})</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer', border: '1px solid', transition: 'all 0.1s', textTransform: 'capitalize',
              background: filterStatus === s ? 'var(--brand-muted)' : 'transparent',
              borderColor: filterStatus === s ? 'var(--brand-border)' : 'var(--border-subtle)',
              color: filterStatus === s ? 'var(--brand)' : 'var(--text-tertiary)',
            }}
          >{s.replace('_', ' ')} ({statusCounts[s]})</button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '10px 12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: 'var(--text-tertiary)' }}><circle cx="6" cy="6" r="4"/><path d="m13 13-3.5-3.5"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles…" className="input-base" style={{ paddingLeft: '28px', height: '32px', fontSize: '0.8125rem' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: '120px', height: '32px', fontSize: '0.8125rem' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        {(search || filterType || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus('') }} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--red)' }}>Clear</button>
        )}
        <div style={{ display: 'flex', gap: '2px', marginLeft: 'auto' }}>
          {['grid','list'].map(v => (
            <button key={v} onClick={() => setView(v)} className="btn-ghost" style={{ padding: '5px 8px', color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)', background: view === v ? 'var(--surface-3)' : 'transparent' }}>
              {v === 'grid'
                ? <svg viewBox="0 0 14 14" fill="currentColor" style={{ width: '12px', height: '12px' }}><path d="M1 1h5v5H1V1zm7 0h5v5H8V1zM1 8h5v5H1V8zm7 0h5v5H8V8z" opacity=".8"/></svg>
                : <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: '12px', height: '12px' }}><path d="M5 3h8M5 7h8M5 11h8M2 3h.01M2 7h.01M2 11h.01"/></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {loading ? <Skeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon="🚌" title="No vehicles found"
          description={search || filterType || filterStatus ? 'Try adjusting your filters.' : 'Add your first vehicle to get started.'}
          action={!search && !filterType && !filterStatus && <button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary">Add Vehicle</button>}
        />
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {filtered.map(v => <VehicleCard key={v.id} v={v} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr>{['Reg. No.','Model','Type','Region','Max Load','Odometer','Acq. Cost','Status','Doc',''].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.registration_number}</td>
                    <td>{v.name_model}</td>
                    <td>{v.type || '—'}</td>
                    <td>{v.region || '—'}</td>
                    <td>{v.max_load_capacity ? `${v.max_load_capacity} kg` : '—'}</td>
                    <td>{v.odometer ? `${v.odometer} km` : '—'}</td>
                    <td>{v.acquisition_cost ? `$${Number(v.acquisition_cost).toLocaleString()}` : '—'}</td>
                    <td><Badge value={v.status} /></td>
                    <td>{v.document_url ? <a href={v.document_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)', fontSize: '0.75rem' }}>View</a> : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(v)} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Edit</button>
                        <button onClick={() => handleDelete(v.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => { setModal(false); setForm(EMPTY); setEditing(null) }}>
          <form onSubmit={handleSave} style={{ display: 'contents' }}>
            <div><label className="label-small">Registration Number *</label><input placeholder="e.g. VAN-05" value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})} className="input-base uppercase" disabled={!!editing} required /></div>
            <div><label className="label-small">Name / Model *</label><input placeholder="e.g. Toyota HiAce" value={form.name_model} onChange={e => setForm({...form, name_model: e.target.value})} className="input-base" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Type *</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-base" required><option value="">Select…</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="label-small">Region</label><input placeholder="e.g. North" value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="input-base" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Max Load (kg) *</label><input type="number" placeholder="500" value={form.max_load_capacity} onChange={e => setForm({...form, max_load_capacity: e.target.value})} className="input-base" required /></div>
              <div><label className="label-small">Odometer (km)</label><input type="number" placeholder="0" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} className="input-base" /></div>
            </div>
            <div><label className="label-small">Acquisition Cost ($)</label><input type="number" placeholder="0.00" value={form.acquisition_cost} onChange={e => setForm({...form, acquisition_cost: e.target.value})} className="input-base" /></div>
            <div><label className="label-small">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-base">{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
            <div>
              <label className="label-small">Document (PDF / image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files[0])} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', width: '100%' }} />
              {docFile && <p style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '4px' }}>{docFile.name}</p>}
            </div>
            <button type="submit" disabled={uploading} className="btn-primary" style={{ width: '100%', height: '38px' }}>
              {uploading ? 'Uploading…' : editing ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
