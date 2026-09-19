import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SlotForm } from '../_components/slot-form'

export const metadata = { title: 'Add Time Slot — Admin | GamePoint' }

export default async function NewSlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: batchId } = await params

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <Link href="/admin/batches" style={{ color: 'inherit', textDecoration: 'none' }}>Batches</Link>
          <span className="sep">/</span>
          <span className="current">Add Time Slot</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add Time Slot</h1>
            <p className="page-subtitle">Schedule a new time slot for the batch.</p>
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
            <SlotForm batchId={batchId} />
          </div>
        </div>
      </div>
    </>
  )
}
