import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EMPTY = { full_name: '', license_number: '', license_category: '', license_expiry_date: '', phone: '', safety_score: '', status: 'available' }
const STATUSES = ['available','on_trip','off_duty','suspended']

const isExpired = d => d && new Date(d) < new Date()
const daysUntil = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

function SafetyBar({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0))
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '3px', background: 'var(--surface-4)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: '600', color, width: '24px', textAlign: 'right' }}>{pct}</span>
    </div>
  )
}

function DriverCard({ d, onEdit, onDelete }) {
  const days = daysUntil(d.license_expiry_date)
  const expired = isExpired(d.license_expiry_date)
  const expiringSoon = days !== null && days >= 0 && days <= 30

  return (
    <div className="card card-interactive animate-slide-up" style={{ padding: '16px', borderTop: `2px solid ${expired ? 'var(--red)' : expiringSoon ? 'var(--amber)' : 'transparent'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-muted)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--brand)', flexShrink: 0 }}>
            {d.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{d.full_name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>{d.license_number}</p>
          </div>
        </div>
        <Badge value={d.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: '6px', padding: '7px 9px' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Category</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.license_category || '—'}</p>
        </div>
        <div style={{ background: 'var(--surface-2)', borderRadius: '6px', padding: '7px 9px' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Phone</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.phone || '—'}</p>
        </div>
      </div>

      <div style={{ background: expired ? 'var(--red-muted)' : expiringSoon ? 'var(--amber-muted)' : 'var(--surface-2)', border: `1px solid ${expired ? 'var(--red-border)' : expiringSoon ? 'var(--amber-border)' : 'transparent'}`, borderRadius: '6px', padding: '7px 9px', marginBottom: '10px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>License Expiry</p>
        <p style={{ fontSize: '0.75rem', color: expired ? 'var(--red)' : expiringSoon ? 'var(--amber)' : 'var(--text-secondary)' }}>
          {d.license_expiry_date || '—'}
          {expired && ' · Expired'}
          {!expired && expiringSoon && ` · ${days}d left`}
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Safety Score</p>
        <SafetyBar score={d.safety_score} />
      </div>

      <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={() => onEdit(d)} className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px' }}>Edit</button>
        <button onClick={() => onDelete(d.id)} className="btn-danger" style={{ flex: 1, fontSize: '0.75rem', padding: '5px 8px' }}>Delete</button>
      </div>
    </div>
  )
}

export default function Drivers() {
  const toast = useToast()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
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
    setModal(false); setForm(EMPTY); setEditing(null)
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

  const expiringSoon = drivers.filter(d => { const days = daysUntil(d.license_expiry_date); return days !== null && days >= 0 && days <= 30 })
  const expired = drivers.filter(d => isExpired(d.license_expiry_date))

  return (
    <AppLayout>
      <PageHeader
        title="Drivers"
        subtitle={`${drivers.length} registered`}
        action={
          <button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M7 1v12M1 7h12"/></svg>
            Add Driver
          </button>
        }
      />

      {/* Alerts */}
      {expired.length > 0 && (
        <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: 'var(--red-muted)', border: '1px solid var(--red-border)', borderRadius: '8px', marginBottom: '12px' }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.5" style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '1px' }}><circle cx="7" cy="7" r="6"/><path d="M7 4.5v3M7 9.5h.01"/></svg>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--red)' }}>Expired licenses ({expired.length})</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{expired.map(d => d.full_name).join(', ')}</p>
          </div>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: 'var(--amber-muted)', border: '1px solid var(--amber-border)', borderRadius: '8px', marginBottom: '12px' }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="var(--amber)" strokeWidth="1.5" style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '1px' }}><path d="M7 1L1 12h12L7 1z"/><path d="M7 5v3M7 10h.01"/></svg>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--amber)' }}>Licenses expiring soon ({expiringSoon.length})</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{expiringSoon.map(d => `${d.full_name} (${daysUntil(d.license_expiry_date)}d)`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="card" style={{ padding: '10px 12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: 'var(--text-tertiary)' }}><circle cx="6" cy="6" r="4"/><path d="m13 13-3.5-3.5"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drivers…" className="input-base" style={{ paddingLeft: '28px', height: '32px', fontSize: '0.8125rem' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: '130px', height: '32px', fontSize: '0.8125rem' }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {(search || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterStatus('') }} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--red)' }}>Clear</button>
        )}
      </div>

      {loading ? <Skeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon="👤" title="No drivers found"
          description={search || filterStatus ? 'Try adjusting your filters.' : 'Add your first driver to get started.'}
          action={!search && !filterStatus && <button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary">Add Driver</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {filtered.map(d => <DriverCard key={d.id} d={d} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Driver' : 'Add Driver'} onClose={() => { setModal(false); setForm(EMPTY); setEditing(null) }}>
          <form onSubmit={handleSave} style={{ display: 'contents' }}>
            <div><label className="label-small">Full Name *</label><input placeholder="Alex Johnson" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="input-base" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">License Number *</label><input placeholder="DL-12345" value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} className="input-base" disabled={!!editing} required /></div>
              <div><label className="label-small">Category</label><input placeholder="B, C, D" value={form.license_category} onChange={e => setForm({...form, license_category: e.target.value})} className="input-base" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">License Expiry *</label><input type="date" value={form.license_expiry_date} onChange={e => setForm({...form, license_expiry_date: e.target.value})} className="input-base" required /></div>
              <div><label className="label-small">Phone</label><input placeholder="+1 234 567 8900" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-base" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Safety Score (0–100)</label><input type="number" min="0" max="100" placeholder="85" value={form.safety_score} onChange={e => setForm({...form, safety_score: e.target.value})} className="input-base" /></div>
              <div><label className="label-small">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-base">{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '38px' }}>{editing ? 'Save Changes' : 'Add Driver'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
