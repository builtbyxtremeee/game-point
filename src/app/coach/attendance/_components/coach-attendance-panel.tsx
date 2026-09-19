'use client'

import { useState, useTransition, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { markCoachAttendanceAction } from '../../actions'
import { Loader2, Check } from 'lucide-react'

type Batch = { id: string; name: string }
type Slot = { id: string; label: string; batch_id: string }
type Student = { id: string; name: string; status: string }

interface Props {
  batches: Batch[]
  slots: Slot[]
  selectedBatch?: string
  selectedSlot?: string
  selectedDate?: string
  students: Student[]
}

const initialState = { error: undefined, success: undefined }

export function CoachAttendancePanel({
  batches, slots, selectedBatch = '', selectedSlot = '', selectedDate = '', students
}: Props) {
  const router = useRouter()
  const [pendingNav, startNav] = useTransition()

  // Local state for toggles (initialized from DB)
  const [statusMap, setStatusMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    students.forEach(s => map[s.id] = s.status)
    return map
  })

  const [state, formAction, isPending] = useActionState(markCoachAttendanceAction, initialState)

  const availableSlots = slots.filter(s => s.batch_id === selectedBatch)

  function updateQuery(k: string, v: string) {
    const params = new URLSearchParams()
    if (k === 'batch') params.set('batch', v)
    else if (selectedBatch) params.set('batch', selectedBatch)
    
    if (k === 'slot') params.set('slot', v)
    else if (k !== 'batch' && selectedSlot) params.set('slot', selectedSlot)
    
    if (k === 'date') params.set('date', v)
    else if (selectedDate) params.set('date', selectedDate)

    startNav(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const toggleStudent = (id: string, st: 'present'|'absent') => {
    setStatusMap(prev => ({ ...prev, [id]: st }))
  }

  const markAll = (st: 'present'|'absent') => {
    const next: Record<string, string> = {}
    students.forEach(s => next[s.id] = st)
    setStatusMap(next)
  }

  return (
    <div className="card">
      <div className="attendance-controls">
        <div className="att-field">
          <label className="att-field-label">Batch</label>
          <select 
            className="field-select" 
            value={selectedBatch} 
            onChange={e => updateQuery('batch', e.target.value)}
            disabled={pendingNav}
          >
            <option value="">-- Select Batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="att-field">
          <label className="att-field-label">Time Slot</label>
          <select 
            className="field-select" 
            value={selectedSlot} 
            onChange={e => updateQuery('slot', e.target.value)}
            disabled={!selectedBatch || pendingNav}
          >
            <option value="">-- Select Slot --</option>
            {availableSlots.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="att-field">
          <label className="att-field-label">Date</label>
          <input 
            type="date" 
            className="field-input" 
            value={selectedDate}
            onChange={e => updateQuery('date', e.target.value)}
            disabled={pendingNav}
          />
        </div>
      </div>

      {selectedBatch && selectedSlot && selectedDate ? (
        <form action={formAction}>
          <input type="hidden" name="batch_id" value={selectedBatch} />
          <input type="hidden" name="slot_id" value={selectedSlot} />
          <input type="hidden" name="date" value={selectedDate} />

          {/* Hidden inputs to pass state to Server Action */}
          {students.map(s => (
            <input key={s.id} type="hidden" name={`status_${s.id}`} value={statusMap[s.id] || 'absent'} />
          ))}

          {state?.error && (
            <div style={{ padding: '1rem 1.5rem' }}>
              <div className="alert alert--error">{state.error}</div>
            </div>
          )}
          {state?.success && (
            <div style={{ padding: '1rem 1.5rem' }}>
              <div className="alert alert--success"><Check size={16} /> {state.success}</div>
            </div>
          )}

          <div className="card-header" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => markAll('present')}>All Present</button>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => markAll('absent')}>All Absent</button>
            </div>
          </div>

          <div className="attendance-list">
            {students.length > 0 ? students.map(s => (
              <div key={s.id} className="attendance-row">
                <div className="att-student-name">{s.name}</div>
                <div className="att-toggle">
                  <button 
                    type="button" 
                    className={`toggle-btn toggle-btn--present ${statusMap[s.id] === 'present' ? 'on' : ''}`}
                    onClick={() => toggleStudent(s.id, 'present')}
                  >
                    Present
                  </button>
                  <button 
                    type="button" 
                    className={`toggle-btn toggle-btn--absent ${statusMap[s.id] === 'absent' ? 'on' : ''}`}
                    onClick={() => toggleStudent(s.id, 'absent')}
                  >
                    Absent
                  </button>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <p>No students assigned to this batch and time slot.</p>
              </div>
            )}
          </div>

          {students.length > 0 && (
            <div className="card-footer">
              <button type="submit" className="btn btn--primary" disabled={isPending}>
                {isPending ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Attendance'}
              </button>
            </div>
          )}
        </form>
      ) : (
        <div className="empty-state" style={{ padding: '4rem 1rem' }}>
          <span className="empty-state-icon" style={{ opacity: 0.3 }}>👆</span>
          <p>Please select a batch, slot, and date to mark attendance.</p>
        </div>
      )}
    </div>
  )
}
