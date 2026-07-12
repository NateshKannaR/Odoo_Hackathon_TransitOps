import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EMPTY = { category: '', amount: '', description: '', expense_date: '', vehicle_id: '', trip_id: '' }
const CATEGORIES = ['toll','misc','insurance','salary','repair','other']
const CAT_COLOR = { toll: 'var(--cyan)', misc: 'var(--text-secondary)', insurance: 'var(--violet)', salary: 'var(--amber)', repair: 'var(--red)', other: 'var(--text-secondary)' }

export default function Expenses() {
  const toast = useToast()
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [vehicleCosts, setVehicleCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [e, v, t, fl, ml, ex] = await Promise.all([
      supabase.from('expenses').select('*, vehicles(registration_number,plate_number), trips(origin,destination)').order('expense_date', { ascending: false }),
      supabase.from('vehicles').select('id,registration_number,plate_number'),
      supabase.from('trips').select('id,origin,destination').in('status', ['dispatched','completed']).order('created_at', { ascending: false }),
      supabase.from('fuel_logs').select('vehicle_id,total_cost'),
      supabase.from('maintenance_logs').select('vehicle_id,cost'),
      supabase.from('expenses').select('vehicle_id,amount'),
    ])
    setExpenses(e.data ?? []); setVehicles(v.data ?? []); setTrips(t.data ?? [])
    const costMap = {}
    ;(v.data ?? []).forEach(veh => { costMap[veh.id] = { id: veh.id, plate: veh.registration_number ?? veh.plate_number, fuel: 0, maintenance: 0, expenses: 0 } })
    ;(fl.data ?? []).forEach(r => { if (costMap[r.vehicle_id]) costMap[r.vehicle_id].fuel += Number(r.total_cost ?? 0) })
    ;(ml.data ?? []).forEach(r => { if (costMap[r.vehicle_id]) costMap[r.vehicle_id].maintenance += Number(r.cost ?? 0) })
    ;(ex.data ?? []).forEach(r => { if (r.vehicle_id && costMap[r.vehicle_id]) costMap[r.vehicle_id].expenses += Number(r.amount ?? 0) })
    setVehicleCosts(Object.values(costMap).map(c => ({ ...c, total: c.fuel + c.maintenance + c.expenses })).filter(c => c.total > 0).sort((a,b) => b.total - a.total))
    setLoading(false)
  }

  async function handleSave(ev) {
    ev.preventDefault()
    const payload = { ...form, vehicle_id: form.vehicle_id || null, trip_id: form.trip_id || null }
    const { error } = editing
      ? await supabase.from('expenses').update(payload).eq('id', editing)
      : await supabase.from('expenses').insert(payload)
    if (error) { toast(error.message, 'error'); return }
    toast(editing ? 'Expense updated.' : 'Expense added.', 'success')
    setModal(false); setForm(EMPTY); setEditing(null); fetchAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    toast('Expense deleted.', 'info'); fetchAll()
  }

  function openEdit(row) {
    setForm({ category: row.category, amount: row.amount, description: row.description ?? '', expense_date: row.expense_date ?? '', vehicle_id: row.vehicle_id ?? '', trip_id: row.trip_id ?? '' })
    setEditing(row.id); setModal(true)
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
  const byCategory = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: expenses.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount ?? 0), 0) }), {})
  const getVehicleName = exp => exp.vehicles?.registration_number ?? exp.vehicles?.plate_number ?? '—'
  const getTripLabel = exp => exp.trips ? `${exp.trips.origin ?? ''} → ${exp.trips.destination ?? ''}` : '—'

  return (
    <AppLayout>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} records · $${total.toFixed(2)} total`}
        action={<button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M7 1v12M1 7h12"/></svg>Add Expense</button>}
      />

      {/* Category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {CATEGORIES.map((cat, i) => (
          <div key={cat} className={`card animate-slide-up delay-${i+1}`} style={{ padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: '500', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{cat}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: CAT_COLOR[cat], letterSpacing: '-0.02em' }}>${byCategory[cat].toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Per-vehicle cost */}
      {vehicleCosts.length > 0 && (
        <div className="card animate-slide-up" style={{ padding: '16px 18px', marginBottom: '20px' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '14px' }}>Cost per Vehicle</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vehicleCosts.map(c => {
              const maxTotal = vehicleCosts[0].total
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-primary)' }}>{c.plate}</span>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--blue)' }}>F ${c.fuel.toFixed(0)}</span>
                      <span style={{ color: 'var(--amber)' }}>M ${c.maintenance.toFixed(0)}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>E ${c.expenses.toFixed(0)}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>${c.total.toFixed(0)}</span>
                    </div>
                  </div>
                  <div style={{ height: '3px', background: 'var(--surface-4)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(c.fuel / maxTotal) * 100}%`, background: 'var(--blue)' }} />
                    <div style={{ width: `${(c.maintenance / maxTotal) * 100}%`, background: 'var(--amber)' }} />
                    <div style={{ width: `${(c.expenses / maxTotal) * 100}%`, background: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? <Skeleton rows={6} /> : expenses.length === 0 ? (
        <EmptyState icon="💰" title="No expenses" description="Start tracking operational expenses." action={<button onClick={() => { setForm(EMPTY); setEditing(null); setModal(true) }} className="btn-primary">Add Expense</button>} />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr>{['Category','Description','Vehicle','Trip','Amount','Date',''].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td><span style={{ fontSize: '0.7rem', fontWeight: '600', color: CAT_COLOR[exp.category] ?? 'var(--text-secondary)', textTransform: 'capitalize' }}>{exp.category}</span></td>
                    <td>{exp.description || '—'}</td>
                    <td>{getVehicleName(exp)}</td>
                    <td style={{ maxWidth: '140px' }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTripLabel(exp)}</span></td>
                    <td style={{ fontWeight: 500, color: 'var(--amber)' }}>${Number(exp.amount).toFixed(2)}</td>
                    <td>{exp.expense_date || '—'}</td>
                    <td><div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(exp)} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Edit</button>
                      <button onClick={() => handleDelete(exp.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>
            {expenses.length} records · Total: <span style={{ color: 'var(--amber)', fontWeight: 500 }}>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => { setModal(false); setForm(EMPTY); setEditing(null) }}>
          <form onSubmit={handleSave} style={{ display: 'contents' }}>
            <div><label className="label-small">Category *</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-base" required><option value="">Select…</option>{CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}</select></div>
            <div><label className="label-small">Description</label><input placeholder="Brief description…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-base" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="label-small">Amount ($) *</label><input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-base" required /></div>
              <div><label className="label-small">Date *</label><input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} className="input-base" required /></div>
            </div>
            <div><label className="label-small">Vehicle</label><select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base"><option value="">Select vehicle…</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number ?? v.plate_number}</option>)}</select></div>
            <div><label className="label-small">Trip</label><select value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})} className="input-base"><option value="">Select trip…</option>{trips.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination}</option>)}</select></div>
            <button type="submit" className="btn-primary" style={{ width: '100%', height: '38px' }}>{editing ? 'Save Changes' : 'Add Expense'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
