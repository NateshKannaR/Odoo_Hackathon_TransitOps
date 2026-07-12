import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const empty = { registration_number: '', name_model: '', type: '', region: '', max_load_capacity: '', acquisition_cost: '', odometer: '', status: 'available' }
const TYPES = ['Bus', 'Van', 'Truck', 'Minibus', 'SUV', 'Pickup']
const STATUSES = ['available', 'on_trip', 'in_shop', 'retired']

const STATUS_ICONS = { available: '🟢', on_trip: '🔵', in_shop: '🟡', retired: '🔴' }

function VehicleCard({ v, onEdit, onDelete }) {
  return (
    <div className="card card-hover p-5 animate-fade-in-up relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5" style={{ background: '#3b82f6', filter: 'blur(20px)', transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-white text-sm">{v.registration_number}</p>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{v.name_model}</p>
        </div>
        <Badge value={v.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Type', value: v.type || '—' },
          { label: 'Region', value: v.region || '—' },
          { label: 'Max Load', value: v.max_load_capacity ? `${v.max_load_capacity} kg` : '—' },
          { label: 'Odometer', value: v.odometer ? `${v.odometer} km` : '—' },
        ].map(item => (
          <div key={item.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>{item.label}</p>
            <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{item.value}</p>
          </div>
        ))}
      </div>
      {v.acquisition_cost && (
        <p className="text-xs mb-3" style={{ color: '#475569' }}>
          Acquisition: <span style={{ color: '#94a3b8' }}>${Number(v.acquisition_cost).toLocaleString()}</span>
        </p>
      )}
      {v.document_url && (
        <a href={v.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs mb-3 transition-colors" style={{ color: '#60a5fa' }}
          onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
          onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          {v.document_name ?? 'View Document'}
        </a>
      )}
      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => onEdit(v)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
        >Edit</button>
        <button onClick={() => onDelete(v.id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
        >Delete</button>
      </div>
    </div>
  )
}

export default function Vehicles() {
  const toast = useToast()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
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
    setModal(false); setForm(empty); setEditing(null); setDocFile(null)
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
        title="Vehicle Registry"
        subtitle={`${vehicles.length} total vehicles`}
        action={
          <button onClick={() => { setForm(empty); setEditing(null); setDocFile(null); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            Add Vehicle
          </button>
        }
      />

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filterStatus === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: filterStatus === s ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.07)',
              color: filterStatus === s ? '#60a5fa' : '#64748b',
            }}
          >
            {STATUS_ICONS[s]} {s.replace('_', ' ')} <span className="opacity-60">({statusCounts[s]})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles..." className="input-base pl-9" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: '130px' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        {(search || filterType || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus('') }} className="text-xs px-3 py-2 rounded-lg transition-all" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
            Clear filters
          </button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {['grid','list'].map(v => (
            <button key={v} onClick={() => setView(v)} className="p-2 rounded-lg transition-all" style={{ background: view === v ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: view === v ? '#60a5fa' : '#475569', border: '1px solid ' + (view === v ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)') }}>
              {v === 'grid'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {loading ? <Skeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon="🚌" title="No vehicles found"
          description={search || filterType || filterStatus ? 'Try adjusting your filters.' : 'Add your first vehicle to get started.'}
          action={!search && !filterType && !filterStatus && <button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary">+ Add Vehicle</button>}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map(v => <VehicleCard key={v.id} v={v} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Reg. No.','Model','Type','Region','Max Load','Odometer','Acq. Cost','Status','Doc','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td className="font-bold text-white">{v.registration_number}</td>
                  <td>{v.name_model}</td>
                  <td>{v.type || '—'}</td>
                  <td>{v.region || '—'}</td>
                  <td>{v.max_load_capacity ? `${v.max_load_capacity} kg` : '—'}</td>
                  <td>{v.odometer ? `${v.odometer} km` : '—'}</td>
                  <td>{v.acquisition_cost ? `$${Number(v.acquisition_cost).toLocaleString()}` : '—'}</td>
                  <td><Badge value={v.status} /></td>
                  <td>{v.document_url ? <a href={v.document_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: '#60a5fa' }}>📄 View</a> : '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(v)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>Edit</button>
                      <button onClick={() => handleDelete(v.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-xs" style={{ color: '#334155', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => { setModal(false); setForm(empty); setEditing(null) }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label-small">Registration Number *</label>
              <input placeholder="e.g. VAN-05" value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})} className="input-base uppercase" disabled={!!editing} required />
            </div>
            <div>
              <label className="label-small">Name / Model *</label>
              <input placeholder="e.g. Toyota HiAce" value={form.name_model} onChange={e => setForm({...form, name_model: e.target.value})} className="input-base" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-base" required>
                  <option value="">Select type</option>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label-small">Region</label>
                <input placeholder="e.g. North" value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Max Load (kg) *</label>
                <input type="number" placeholder="500" value={form.max_load_capacity} onChange={e => setForm({...form, max_load_capacity: e.target.value})} className="input-base" required />
              </div>
              <div>
                <label className="label-small">Odometer (km)</label>
                <input type="number" placeholder="0" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-small">Acquisition Cost ($)</label>
              <input type="number" placeholder="0.00" value={form.acquisition_cost} onChange={e => setForm({...form, acquisition_cost: e.target.value})} className="input-base" />
            </div>
            <div>
              <label className="label-small">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-base">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label-small">Vehicle Document (PDF/image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files[0])}
                className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium cursor-pointer"
                style={{ color: '#64748b' }}
              />
              {docFile && <p className="text-xs mt-1" style={{ color: '#34d399' }}>📎 {docFile.name}</p>}
            </div>
            <button type="submit" disabled={uploading} className="btn-primary w-full">
              {uploading ? 'Uploading...' : editing ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
