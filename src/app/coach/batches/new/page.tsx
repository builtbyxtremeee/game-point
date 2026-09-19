import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../_components/batch-form'

export const metadata = { title: 'Add Batch | GamePoint' }

export default function NewBatchPage() {
  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <Link href="/coach/batches" style={{ color: 'inherit', textDecoration: 'none' }}>My Batches</Link>
          <span className="sep">/</span>
          <span className="current">Add New</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div><h1 className="page-title">Add Batch</h1></div>
          <Link href="/coach/batches" className="btn btn--secondary"><ArrowLeft size={15} /> Back</Link>
        </div>
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-body"><BatchForm /></div>
        </div>
      </div>
    </>
  )
}
