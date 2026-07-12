import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const empty = { full_name: '', license_number: '', license_category: '', license_expiry_date: '', phone: '', safety_score: '', status: 'available' }
const STATUSES = ['available', 'on_trip', 'off_duty', 'suspended']

const isExpired = (date) => date && new Date(date) < new Date()
const daysUntilExpiry = (date) => {
  if (!date) return null
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
}

function SafetyBar({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0))
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{pct}</span>
    </div>
  )
}

function DriverCard({ d, onEdit, onDelete }) {
  const days = daysUntilExpiry(d.license_expiry_date)
  const expired = isExpired(d.license_expiry_date)
  const expiringSoon = days !== null && days >= 0 && days <= 30

  return (
    <div className="card card-hover p-5 animate-fade-in-up relative overflow-hidden">
      {(expired || expiringSoon) && (
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: expired ? '#f43f5e' : '#f59e0b' }} />
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            {d.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{d.full_name}</p>
            <p className="text-xs" style={{ color: '#475569' }}>{d.license_number}</p>
          </div>
        </div>
        <Badge value={d.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>Category</p>
          <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{d.license_category || '—'}</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>Contact</p>
          <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{d.phone || '—'}</p>
        </div>
      </div>

      {/* License expiry */}
      <div className="rounded-lg p-2 mb-3" style={{ background: expired ? 'rgba(244,63,94,0.08)' : expiringSoon ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${expired ? 'rgba(244,63,94,0.2)' : expiringSoon ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>License Expiry</p>
        <p className="text-xs font-medium" style={{ color: expired ? '#fb7185' : expiringSoon ? '#fbbf24' : '#94a3b8' }}>
          {d.license_expiry_date || '—'}
          {expired && ' · EXPIRED'}
          {!expired && expiringSoon && ` · ${days}d left`}
        </p>
      </div>

      {/* Safety score */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#334155' }}>Safety Score</p>
        <SafetyBar score={d.safety_score} />
      </div>

      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => onEdit(d)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
        >Edit</button>
        <button onClick={() => onDelete(d.id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
        >Delete</button>
      </div>
    </div>
  )
}

export default function Drivers() {
  const toast = useToast()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { fetchDrivers() }, [])

  async function fetchDrivers() {
    setLoading(true)
    const { data, error } = await supabase.from('drivers').select('*').order('created_at', { ascending: false })
    if (error) toast(error.message, 'error')
    setDrivers(data ?? [])
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!editing) {
      const { data: existing } = await supabase.from('drivers').select('id').eq('license_number', form.license_number.trim()).maybeSingle()
      if (existing) { toast('License number already registered.', 'error'); return }
    }
    const { error } = editing
      ? await supabase.from('drivers').update(form).eq('id', editing)
      : await supabase.from('drivers').insert(form)
    if (error) { toast(error.message, 'error'); return }
    toast(editing ? 'Driver updated.' : 'Driver added.', 'success')
    setModal(false); setForm(empty); setEditing(null)
    fetchDrivers()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this driver?')) return
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    toast('Driver deleted.', 'success')
    fetchDrivers()
  }

  function openEdit(d) {
    setForm({ full_name: d.full_name, license_number: d.license_number, license_category: d.license_category ?? '', license_expiry_date: d.license_expiry_date ?? '', phone: d.phone ?? '', safety_score: d.safety_score ?? '', status: d.status })
    setEditing(d.id); setModal(true)
  }

  const filtered = useMemo(() => {
    let data = [...drivers]
    if (search) data = data.filter(d => `${d.full_name} ${d.license_number} ${d.phone}`.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus) data = data.filter(d => d.status === filterStatus)
    return data
  }, [drivers, search, filterStatus])

  const expiringSoon = drivers.filter(d => { const days = daysUntilExpiry(d.license_expiry_date); return days !== null && days >= 0 && days <= 30 })
  const expired = drivers.filter(d => isExpired(d.license_expiry_date))

  return (
    <AppLayout>
      <PageHeader
        title="Driver Management"
        subtitle={`${drivers.length} registered drivers`}
        action={
          <button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            Add Driver
          </button>
        }
      />

      {/* Alerts */}
      {expired.length > 0 && (
        <div className="mb-4 p-4 rounded-xl flex items-start gap-3 animate-fade-in" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <span className="text-lg">⛔</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fb7185' }}>Expired Licenses ({expired.length})</p>
            <p className="text-xs mt-0.5" style={{ color: '#f43f5e' }}>{expired.map(d => d.full_name).join(', ')} — cannot be assigned to trips</p>
          </div>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="mb-4 p-4 rounded-xl flex items-start gap-3 animate-fade-in" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>Licenses Expiring Soon ({expiringSoon.length})</p>
            <p className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>{expiringSoon.map(d => `${d.full_name} (${daysUntilExpiry(d.license_expiry_date)}d)`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="relative flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drivers..." className="input-base pl-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {(search || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterStatus('') }} className="text-xs px-3 py-2 rounded-lg" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}>
            Clear
          </button>
        )}
      </div>

      {loading ? <Skeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon="👤" title="No drivers found"
          description={search || filterStatus ? 'Try adjusting your filters.' : 'Add your first driver to get started.'}
          action={!search && !filterStatus && <button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary">+ Add Driver</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map(d => <DriverCard key={d.id} d={d} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Driver' : 'Add Driver'} onClose={() => { setModal(false); setForm(empty); setEditing(null) }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label-small">Full Name *</label>
              <input placeholder="e.g. Alex Johnson" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="input-base" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">License Number *</label>
                <input placeholder="e.g. DL-12345" value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} className="input-base" disabled={!!editing} required />
              </div>
              <div>
                <label className="label-small">Category</label>
                <input placeholder="e.g. B, C, D" value={form.license_category} onChange={e => setForm({...form, license_category: e.target.value})} className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">License Expiry *</label>
                <input type="date" value={form.license_expiry_date} onChange={e => setForm({...form, license_expiry_date: e.target.value})} className="input-base" required />
              </div>
              <div>
                <label className="label-small">Contact Number</label>
                <input placeholder="+1 234 567 8900" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Safety Score (0–100)</label>
                <input type="number" min="0" max="100" placeholder="85" value={form.safety_score} onChange={e => setForm({...form, safety_score: e.target.value})} className="input-base" />
              </div>
              <div>
                <label className="label-small">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-base">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">{editing ? 'Update Driver' : 'Add Driver'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
