'use client'

import { useActionState } from 'react'
import { createBatchAction, updateBatchAction } from '../../actions'
import { Loader2 } from 'lucide-react'

type Batch = { id: string; name: string }

interface BatchFormProps {
  initialData?: Batch
}

const initialState = { error: undefined }

export function BatchForm({ initialData }: BatchFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateBatchAction : createBatchAction
  const [state, formAction, isPending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="form-grid">
      {isEdit && <input type="hidden" name="batch_id" value={initialData.id} />}

      <div className="field-group form-full">
        <label htmlFor="name" className="field-label">Batch Name *</label>
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

      {state?.error && (
        <div className="form-full alert alert--error">
          <span>{state.error}</span>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Batch'}
        </button>
      </div>
    </form>
  )
}
