'use client'

import { useActionState } from 'react'
import { createSlotAction, updateSlotAction } from '../../../../actions'
import { Loader2 } from 'lucide-react'

type Slot = { id: string; label: string; days_of_week: number[] }

interface SlotFormProps {
  batchId: string
  initialData?: Slot
}

const initialState = { error: undefined }

const DAYS = [
  { val: 0, label: 'Sunday' },
  { val: 1, label: 'Monday' },
  { val: 2, label: 'Tuesday' },
  { val: 3, label: 'Wednesday' },
  { val: 4, label: 'Thursday' },
  { val: 5, label: 'Friday' },
  { val: 6, label: 'Saturday' },
]

export function SlotForm({ batchId, initialData }: SlotFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateSlotAction : createSlotAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="form-grid">
      <input type="hidden" name="batch_id" value={batchId} />
      {isEdit && <input type="hidden" name="slot_id" value={initialData.id} />}

      <div className="field-group form-full">
        <label htmlFor="label" className="field-label">Time Slot Label <span className="field-required">*</span></label>
        <input 
          type="text" 
          id="label" 
          name="label" 
          className="field-input" 
          required 
          defaultValue={initialData?.label}
          placeholder="e.g. 6:00 AM - 7:30 AM"
        />
      </div>

      <div className="field-group form-full">
        <label className="field-label">Days of Week <span className="field-required">*</span></label>
        <div className="days-grid">
          {DAYS.map(day => (
            <label key={day.val} className="day-check-label">
              <input 
                type="checkbox" 
                name="days_of_week" 
                value={day.val} 
                defaultChecked={initialData?.days_of_week.includes(day.val)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <div className="form-full alert alert--error">
          <span>{state.error}</span>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Time Slot'}
        </button>
      </div>
    </form>
  )
}
