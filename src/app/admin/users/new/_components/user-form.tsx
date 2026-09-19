'use client'

import { useState, useActionState, useEffect } from 'react'
import { createUserAction, updateUserAction } from '../../../actions'
import { Loader2 } from 'lucide-react'

type Batch = { id: string; name: string }
type Slot = { id: string; label: string; batch_id: string }
type UserRow = {
  id: string
  auth_id: string
  name: string
  phone: string
  role: string
  batch_id: string | null
  time_slot_id: string | null
}

interface UserFormProps {
  initialData?: UserRow
  batches: Batch[]
  slots: Slot[]
}

const initialState = { error: undefined }

export function UserForm({ initialData, batches, slots }: UserFormProps) {
  const isEdit = !!initialData
  
  // Use action state
  const action = isEdit ? updateUserAction : createUserAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  // Local state for role and batch to control conditional fields
  const [role, setRole] = useState(initialData?.role ?? 'student')
  const [batchId, setBatchId] = useState(initialData?.batch_id ?? '')
  
  // Filter slots based on selected batch
  const availableSlots = slots.filter(s => s.batch_id === batchId)

  return (
    <form action={formAction} className="form-grid">
      {isEdit && (
        <>
          <input type="hidden" name="user_id" value={initialData.id} />
          <input type="hidden" name="auth_id" value={initialData.auth_id} />
        </>
      )}

      {/* Name */}
      <div className="field-group form-full">
        <label htmlFor="name" className="field-label">Full Name <span className="field-required">*</span></label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          className="field-input" 
          required 
          defaultValue={initialData?.name}
          placeholder="e.g. John Doe"
        />
      </div>

      {/* Phone */}
      <div className="field-group">
        <label htmlFor="phone" className="field-label">Phone Number {(!isEdit) && <span className="field-required">*</span>}</label>
        <input 
          type="tel" 
          id="phone" 
          name="phone" 
          className="field-input" 
          required={!isEdit} 
          disabled={isEdit}
          defaultValue={initialData?.phone}
          placeholder="e.g. 9876543210"
        />
        {isEdit && <span style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>Phone cannot be changed.</span>}
      </div>

      {/* Role */}
      <div className="field-group">
        <label htmlFor="role" className="field-label">Role <span className="field-required">*</span></label>
        <select 
          id="role" 
          name="role" 
          className="field-select" 
          required
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Conditional: Batch (only for coach/student, though admin might need it sometimes, typically student) */}
      {(role === 'student' || role === 'coach') && (
        <div className="field-group">
          <label htmlFor="batch_id" className="field-label">Assigned Batch</label>
          <select 
            id="batch_id" 
            name="batch_id" 
            className="field-select"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
          >
            <option value="">-- None --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Conditional: Time Slot (only if batch is selected) */}
      {(role === 'student' || role === 'coach') && batchId && (
        <div className="field-group">
          <label htmlFor="time_slot_id" className="field-label">Time Slot</label>
          <select 
            id="time_slot_id" 
            name="time_slot_id" 
            className="field-select"
            defaultValue={initialData?.time_slot_id ?? ''}
          >
            <option value="">-- None --</option>
            {availableSlots.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Password */}
      <div className="field-group">
        <label htmlFor="password" className="field-label">
          {isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="field-required">*</span>}
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

      {/* Error Message */}
      {state?.error && (
        <div className="form-full alert alert--error">
          <AlertCircle size={16} />
          <span>{state.error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? (
            <><Loader2 size={16} className="spin" /> Saving…</>
          ) : (
            'Save User'
          )}
        </button>
      </div>
    </form>
  )
}

function AlertCircle({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
}
