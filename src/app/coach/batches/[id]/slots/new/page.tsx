import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SlotForm } from '../_components/slot-form'

export const metadata = { title: 'Add Time Slot | GamePoint' }

export default async function NewSlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: batchId } = await params
  
  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <Link href="/coach/batches" style={{ color: 'inherit', textDecoration: 'none' }}>My Batches</Link>
          <span className="sep">/</span><span className="current">Add Time Slot</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div><h1 className="page-title">Add Time Slot</h1></div>
          <Link href="/coach/batches" className="btn btn--secondary"><ArrowLeft size={15} /> Back</Link>
        </div>
        <div className="card" style={{ maxWidth: 500 }}>
          <div className="card-body"><SlotForm batchId={batchId} /></div>
        </div>
      </div>
    </>
  )
}
