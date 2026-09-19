'use client'

import { useActionState } from 'react'
import { createSlotAction, updateSlotAction } from '../../../../actions'
import { Loader2 } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Slot = { id: string; label: string; days_of_week: number[] }

interface SlotFormProps {
  batchId: string
  initialData?: Slot
}

const initialState = { error: undefined }

export function SlotForm({ batchId, initialData }: SlotFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateSlotAction : createSlotAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="form-grid">
      <input type="hidden" name="batch_id" value={batchId} />
      {isEdit && <input type="hidden" name="slot_id" value={initialData.id} />}

      <div className="field-group form-full">
        <label htmlFor="label" className="field-label">Slot Label *</label>
        <input type="text" id="label" name="label" className="field-input" required defaultValue={initialData?.label} placeholder="e.g. 6:00 PM - 7:00 PM" />
      </div>

      <div className="field-group form-full">
        <label className="field-label" style={{ marginBottom: '0.75rem' }}>Days of the Week *</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {DAYS.map((day, idx) => {
            const isChecked = initialData?.days_of_week?.includes(idx) ?? false
            return (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--a-bg-alt)' }}>
                <input type="checkbox" name="days_of_week" value={idx.toString()} defaultChecked={isChecked} style={{ margin: 0, accentColor: 'var(--a-primary)' }} />
                <span style={{ fontSize: '0.875rem' }}>{day}</span>
              </label>
            )
          })}
        </div>
      </div>

      {state?.error && (
        <div className="form-full alert alert--error">
          <span>{state.error}</span>
        </div>
      )}

      <div className="form-actions form-full" style={{ marginTop: '0.5rem' }}>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Time Slot'}
        </button>
      </div>
    </form>
  )
}
