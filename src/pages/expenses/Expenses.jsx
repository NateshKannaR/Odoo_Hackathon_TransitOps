import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppLayout from '../../components/layout/AppLayout'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const empty = { category: '', amount: '', description: '', expense_date: '', vehicle_id: '', trip_id: '' }
const CATEGORIES = ['toll', 'misc', 'insurance', 'salary', 'repair', 'other']
const CAT_COLORS = { toll: '#06b6d4', misc: '#64748b', insurance: '#8b5cf6', salary: '#f59e0b', repair: '#f43f5e', other: '#94a3b8' }

export default function Expenses() {
  const toast = useToast()
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [vehicleCosts, setVehicleCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [e, v, t, fl, ml, ex] = await Promise.all([
      supabase.from('expenses').select('*, vehicles(registration_number,plate_number), trips(source,origin,destination)').order('expense_date', { ascending: false }),
      supabase.from('vehicles').select('id,registration_number,plate_number'),
      supabase.from('trips').select('id,source,origin,destination').in('status', ['dispatched','completed']).order('created_at', { ascending: false }),
      supabase.from('fuel_logs').select('vehicle_id,total_cost'),
      supabase.from('maintenance_logs').select('vehicle_id,cost'),
      supabase.from('expenses').select('vehicle_id,amount'),
    ])
    setExpenses(e.data ?? [])
    setVehicles(v.data ?? [])
    setTrips(t.data ?? [])

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
    setModal(false); setForm(empty); setEditing(null)
    fetchAll()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    toast('Expense deleted.', 'info')
    fetchAll()
  }

  function openEdit(row) {
    setForm({ category: row.category, amount: row.amount, description: row.description ?? '', expense_date: row.expense_date ?? '', vehicle_id: row.vehicle_id ?? '', trip_id: row.trip_id ?? '' })
    setEditing(row.id); setModal(true)
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
  const byCategory = CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: expenses.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount ?? 0), 0) }), {})

  const getVehicleName = (exp) => exp.vehicles?.registration_number ?? exp.vehicles?.plate_number ?? '—'
  const getTripLabel = (exp) => {
    if (!exp.trips) return '—'
    return `${exp.trips.source ?? exp.trips.origin ?? ''} → ${exp.trips.destination ?? ''}`
  }

  return (
    <AppLayout>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} records · $${total.toFixed(2)} total`}
        action={
          <button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            Add Expense
          </button>
        }
      />

      {/* Category breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {CATEGORIES.map(cat => (
          <div key={cat} className="card p-3 text-center animate-fade-in-up">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-sm" style={{ background: `${CAT_COLORS[cat]}18`, border: `1px solid ${CAT_COLORS[cat]}30` }}>
              {cat === 'toll' ? '🛣️' : cat === 'insurance' ? '🛡️' : cat === 'salary' ? '👤' : cat === 'repair' ? '🔧' : cat === 'misc' ? '📦' : '💼'}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 capitalize" style={{ color: '#334155' }}>{cat}</p>
            <p className="text-sm font-bold" style={{ color: CAT_COLORS[cat] }}>${byCategory[cat].toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Per-vehicle operational cost */}
      {vehicleCosts.length > 0 && (
        <div className="card p-5 mb-6 animate-fade-in-up">
          <h3 className="text-sm font-bold text-white mb-4">Operational Cost per Vehicle</h3>
          <div className="space-y-3">
            {vehicleCosts.map(c => {
              const maxTotal = vehicleCosts[0].total
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">{c.plate}</span>
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#64748b' }}>
                      <span style={{ color: '#60a5fa' }}>F: ${c.fuel.toFixed(0)}</span>
                      <span style={{ color: '#fbbf24' }}>M: ${c.maintenance.toFixed(0)}</span>
                      <span style={{ color: '#94a3b8' }}>E: ${c.expenses.toFixed(0)}</span>
                      <span className="font-bold text-white">= ${c.total.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full flex">
                      <div style={{ width: `${(c.fuel / maxTotal) * 100}%`, background: '#3b82f6' }} />
                      <div style={{ width: `${(c.maintenance / maxTotal) * 100}%`, background: '#f59e0b' }} />
                      <div style={{ width: `${(c.expenses / maxTotal) * 100}%`, background: '#94a3b8' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? <Skeleton rows={6} /> : expenses.length === 0 ? (
        <EmptyState icon="💰" title="No expenses recorded" description="Start tracking operational expenses." action={<button onClick={() => { setForm(empty); setEditing(null); setModal(true) }} className="btn-primary">+ Add Expense</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Type','Description','Vehicle','Trip','Amount','Date','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold capitalize" style={{ background: `${CAT_COLORS[exp.category] ?? '#94a3b8'}18`, color: CAT_COLORS[exp.category] ?? '#94a3b8', border: `1px solid ${CAT_COLORS[exp.category] ?? '#94a3b8'}30` }}>
                      {exp.category}
                    </span>
                  </td>
                  <td>{exp.description || '—'}</td>
                  <td>{getVehicleName(exp)}</td>
                  <td style={{ maxWidth: '140px' }}><span className="truncate block">{getTripLabel(exp)}</span></td>
                  <td><span className="font-semibold" style={{ color: '#fbbf24' }}>${Number(exp.amount).toFixed(2)}</span></td>
                  <td>{exp.expense_date || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(exp)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>Edit</button>
                      <button onClick={() => handleDelete(exp.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-xs" style={{ color: '#334155', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{expenses.length} record{expenses.length !== 1 ? 's' : ''} · Total: <span style={{ color: '#fbbf24' }}>${total.toFixed(2)}</span></div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => { setModal(false); setForm(empty); setEditing(null) }}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label-small">Category *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-base" required>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-small">Description</label>
              <input placeholder="Brief description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-small">Amount ($) *</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-base" required />
              </div>
              <div>
                <label className="label-small">Date *</label>
                <input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} className="input-base" required />
              </div>
            </div>
            <div>
              <label className="label-small">Link to Vehicle (optional)</label>
              <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} className="input-base">
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number ?? v.plate_number}</option>)}
              </select>
            </div>
            <div>
              <label className="label-small">Link to Trip (optional)</label>
              <select value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})} className="input-base">
                <option value="">Select trip...</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.source ?? t.origin} → {t.destination}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">{editing ? 'Update Expense' : 'Add Expense'}</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
