'use client'

import { useState, useActionState, useTransition } from 'react'
import { createLeaveDayAction, deleteLeaveDayAction } from '../../actions'
import { Trash2, Loader2, Plus, Calendar, AlertCircle, Check } from 'lucide-react'

type Leave = {
  id: string
  date: string
  scope: string
  batch_id: string | null
  time_slot_id: string | null
  batch_name: string | null
  slot_label: string | null
  reason: string
  creator_name: string
}
type Batch = { id: string; name: string }
type Slot = { id: string; label: string; batch_id: string }

interface Props {
  leaves: Leave[]
  batches: Batch[]
  slots: Slot[]
}

const initialState = { error: undefined, success: undefined }

export function LeavesPanel({ leaves, batches, slots }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [scope, setScope] = useState('court_wide')
  const [batchId, setBatchId] = useState('')
  
  const [state, formAction, isPending] = useActionState(createLeaveDayAction, initialState)
  const [pendingDel, startDel] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const availableSlots = slots.filter(s => s.batch_id === batchId)

  const handleDelete = (id: string) => {
    if (!confirm('Remove this leave day?')) return
    setDeletingId(id)
    startDel(async () => {
      await deleteLeaveDayAction(id)
      setDeletingId(null)
    })
  }

  // Handle success feedback by hiding form
  if (state?.success && showForm) {
    setShowForm(false)
  }

  return (
    <div>
      {/* Form Card */}
      {showForm ? (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div className="card-title">Add Leave Day</div>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className="card-body">
            <form action={formAction} className="form-grid">
              
              <div className="field-group form-full">
                <label className="field-label">Scope <span className="field-required">*</span></label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="scope" value="court_wide" checked={scope === 'court_wide'} onChange={e => setScope(e.target.value)} />
                    Court-Wide
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="scope" value="batch" checked={scope === 'batch'} onChange={e => setScope(e.target.value)} />
                    Specific Batch
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="scope" value="time_slot" checked={scope === 'time_slot'} onChange={e => setScope(e.target.value)} />
                    Specific Time Slot
                  </label>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="date" className="field-label">Date <span className="field-required">*</span></label>
                <input type="date" id="date" name="date" className="field-input" required />
              </div>

              {(scope === 'batch' || scope === 'time_slot') && (
                <div className="field-group">
                  <label htmlFor="batch_id" className="field-label">Select Batch <span className="field-required">*</span></label>
                  <select id="batch_id" name="batch_id" className="field-select" required value={batchId} onChange={e => setBatchId(e.target.value)}>
                    <option value="">-- Choose Batch --</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {scope === 'time_slot' && (
                <div className="field-group form-full">
                  <label htmlFor="time_slot_id" className="field-label">Select Time Slot <span className="field-required">*</span></label>
                  <select id="time_slot_id" name="time_slot_id" className="field-select" required>
                    <option value="">-- Choose Slot --</option>
                    {availableSlots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              )}

              <div className="field-group form-full">
                <label htmlFor="reason" className="field-label">Reason <span className="field-required">*</span></label>
                <input type="text" id="reason" name="reason" className="field-input" required placeholder="e.g. Public Holiday, Maintenance" />
              </div>

              {state?.error && (
                <div className="form-full alert alert--error">
                  <AlertCircle size={16} /> <span>{state.error}</span>
                </div>
              )}

              <div className="form-actions form-full">
                <button type="submit" className="btn btn--primary" disabled={isPending}>
                  {isPending ? <><Loader2 size={16} className="spin" /> Adding…</> : 'Add Leave Day'}
                </button>
              </div>

            </form>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add Leave Day
          </button>
        </div>
      )}

      {/* List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Upcoming & Past Leaves</div>
        </div>
        <div className="table-wrap">
          <table className="data-table" aria-label="Leaves list">
            <thead>
              <tr>
                <th>Date</th>
                <th>Scope</th>
                <th>Details</th>
                <th>Reason</th>
                <th>Added By</th>
                <th style={{ width: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} className="muted" />
                    {new Date(l.date).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`scope-badge scope-badge--${l.scope}`}>
                      {l.scope.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="muted">
                    {l.scope === 'court_wide' && 'All batches'}
                    {l.scope === 'batch' && l.batch_name}
                    {l.scope === 'time_slot' && `${l.batch_name} (${l.slot_label})`}
                  </td>
                  <td>{l.reason}</td>
                  <td className="muted">{l.creator_name}</td>
                  <td>
                    <button 
                      className="btn btn--ghost btn--icon-sm"
                      style={{ color: 'var(--a-danger)' }}
                      onClick={() => handleDelete(l.id)}
                      disabled={pendingDel && deletingId === l.id}
                      title="Remove leave day"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <span className="empty-state-icon">🌴</span>
                      <p>No leave days recorded.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
