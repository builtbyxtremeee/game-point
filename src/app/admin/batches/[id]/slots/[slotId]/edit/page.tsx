import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { SlotForm } from '../../_components/slot-form'

export const metadata = { title: 'Edit Time Slot — Admin | GamePoint' }

export default async function EditSlotPage({ params }: { params: Promise<{ id: string; slotId: string }> }) {
  const { id: batchId, slotId } = await params
  const supabase = await createClient()
  
  const { data: slot } = await supabase.from('time_slots').select('*').eq('id', slotId).single()
  
  if (!slot) notFound()

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <Link href="/admin/batches" style={{ color: 'inherit', textDecoration: 'none' }}>Batches</Link>
          <span className="sep">/</span>
          <span className="current">Edit Time Slot</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Edit Time Slot</h1>
            <p className="page-subtitle">Update schedule for the batch.</p>
          </div>
          <Link href="/admin/batches" className="btn btn--secondary">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>

        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header">
            <div className="card-title">Slot Details</div>
          </div>
          <div className="card-body">
            <SlotForm batchId={batchId} initialData={slot} />
          </div>
        </div>
      </div>
    </>
  )
}
