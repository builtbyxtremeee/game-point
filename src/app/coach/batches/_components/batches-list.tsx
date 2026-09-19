'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { deleteBatchAction, deleteSlotAction } from '../../actions'
import { Pencil, Trash2, Plus, Clock } from 'lucide-react'

type Slot = { id: string; batch_id: string; label: string; days_of_week: number[] }
type Batch = { id: string; name: string; coach_id: string; coach_name: string; slots: Slot[] }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function BatchesList({ batches }: { batches: Batch[] }) {
  const [pending, startTrans] = useTransition()
  const [deletingId, setDel] = useState<string | null>(null)

  function handleDeleteBatch(id: string) {
    if (!confirm('Delete this batch? All associated slots and students will be affected.')) return
    setDel(id)
    startTrans(async () => {
      await deleteBatchAction(id)
      setDel(null)
    })
  }

  function handleDeleteSlot(slotId: string, batchId: string) {
    if (!confirm('Delete this time slot?')) return
    setDel(slotId)
    startTrans(async () => {
      await deleteSlotAction(slotId, batchId)
      setDel(null)
    })
  }

  if (batches.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📋</span>
        <p>No batches found. Create your first batch to get started.</p>
      </div>
    )
  }

  return (
    <div>
      {batches.map(batch => (
        <div key={batch.id} className="batch-row">
          <div>
            <div className="batch-name">{batch.name}</div>
            
            <div className="batch-slots">
              {batch.slots.map(slot => (
                <div key={slot.id} className="slot-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock size={14} style={{ color: 'var(--a-primary-lt)' }} />
                    <span className="slot-label">{slot.label}</span>
                    <div className="slot-days">
                      {slot.days_of_week.sort().map(d => (
                        <span key={d} className="day-pill">{DAYS[d]}</span>
                      ))}
                    </div>
                  </div>
                  <div className="slot-actions">
                    <Link href={`/coach/batches/${batch.id}/slots/${slot.id}/edit`} className="btn btn--ghost btn--icon-sm" title="Edit slot">
                      <Pencil size={13} />
                    </Link>
                    <button 
                      className="btn btn--ghost btn--icon-sm" 
                      style={{ color: 'var(--a-danger)' }}
                      title="Delete slot"
                      onClick={() => handleDeleteSlot(slot.id, batch.id)}
                      disabled={pending && deletingId === slot.id}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {batch.slots.length === 0 && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--a-text-muted)', padding: '0.5rem 0' }}>No time slots defined.</div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Link href={`/coach/batches/${batch.id}/slots/new`} className="btn btn--secondary btn--sm">
              <Plus size={13} /> Add Slot
            </Link>
            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
              <Link href={`/coach/batches/${batch.id}/edit`} className="btn btn--ghost btn--icon-sm" title="Edit Batch">
                <Pencil size={14} />
              </Link>
              <button 
                className="btn btn--ghost btn--icon-sm" 
                style={{ color: 'var(--a-danger)' }}
                title="Delete Batch"
                onClick={() => handleDeleteBatch(batch.id)}
                disabled={pending && deletingId === batch.id}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
