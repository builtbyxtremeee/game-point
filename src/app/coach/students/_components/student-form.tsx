'use client'

import { useState, useActionState } from 'react'
import { createStudentAction, updateStudentAction } from '../../actions'
import { Loader2 } from 'lucide-react'

type Batch = { id: string; name: string }
type Slot = { id: string; label: string; batch_id: string }
type UserRow = {
  id: string
  auth_id: string
  name: string
  phone: string
  batch_id: string | null
  time_slot_id: string | null
}

interface StudentFormProps {
  initialData?: UserRow
  batches: Batch[]
  slots: Slot[]
}

const initialState = { error: undefined }

export function StudentForm({ initialData, batches, slots }: StudentFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateStudentAction : createStudentAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  const [batchId, setBatchId] = useState(initialData?.batch_id ?? '')
  const availableSlots = slots.filter(s => s.batch_id === batchId)

  return (
    <form action={formAction} className="form-grid">
      {isEdit && (
        <>
          <input type="hidden" name="user_id" value={initialData.id} />
          <input type="hidden" name="auth_id" value={initialData.auth_id} />
        </>
      )}

      <div className="field-group form-full">
        <label htmlFor="name" className="field-label">Full Name *</label>
        <input type="text" id="name" name="name" className="field-input" required defaultValue={initialData?.name} />
      </div>

      <div className="field-group">
        <label htmlFor="phone" className="field-label">Phone Number {!isEdit && '*'}</label>
        <input type="tel" id="phone" name="phone" className="field-input" required={!isEdit} disabled={isEdit} defaultValue={initialData?.phone} />
      </div>

      <div className="field-group">
        <label htmlFor="batch_id" className="field-label">Assigned Batch *</label>
        <select id="batch_id" name="batch_id" className="field-select" required value={batchId} onChange={e => setBatchId(e.target.value)}>
          <option value="">-- Select Batch --</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="time_slot_id" className="field-label">Time Slot</label>
        <select id="time_slot_id" name="time_slot_id" className="field-select" defaultValue={initialData?.time_slot_id ?? ''}>
          <option value="">-- None --</option>
          {availableSlots.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="field-group form-full">
        <label htmlFor="password" className="field-label">
          {isEdit ? 'New Password' : 'Password'} {!isEdit && '*'}
        </label>
        <input 
          type="password" 
          id={isEdit ? 'new_password' : 'password'} 
          name={isEdit ? 'new_password' : 'password'} 
          className="field-input" 
          required={!isEdit}
          placeholder={isEdit ? 'Leave blank to keep current' : 'Minimum 6 characters'}
          minLength={6}
        />
      </div>

      {state?.error && (
        <div className="form-full alert alert--error">
          <span>{state.error}</span>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Student'}
        </button>
      </div>
    </form>
  )
}
