'use client'

import { useActionState } from 'react'
import { createBatchAction, updateBatchAction } from '../../actions'
import { Loader2 } from 'lucide-react'

type Coach = { id: string; name: string }
type Batch = { id: string; name: string; coach_id: string }

interface BatchFormProps {
  initialData?: Batch
  coaches: Coach[]
}

const initialState = { error: undefined }

export function BatchForm({ initialData, coaches }: BatchFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateBatchAction : createBatchAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="form-grid">
      {isEdit && <input type="hidden" name="batch_id" value={initialData.id} />}

      <div className="field-group form-full">
        <label htmlFor="name" className="field-label">Batch Name <span className="field-required">*</span></label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          className="field-input" 
          required 
          defaultValue={initialData?.name}
          placeholder="e.g. Morning Pro"
        />
      </div>

      <div className="field-group form-full">
        <label htmlFor="coach_id" className="field-label">Assigned Coach <span className="field-required">*</span></label>
        <select 
          id="coach_id" 
          name="coach_id" 
          className="field-select" 
          required
          defaultValue={initialData?.coach_id ?? ''}
        >
          <option value="">-- Select Coach --</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {state?.error && (
        <div className="form-full alert alert--error">
          <span>{state.error}</span>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Batch'}
        </button>
      </div>
    </form>
  )
}
