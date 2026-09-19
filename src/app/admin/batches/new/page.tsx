import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../_components/batch-form'

export const metadata = { title: 'Add Batch — Admin | GamePoint' }

export default async function NewBatchPage() {
  const supabase = await createClient()
  const { data: coaches } = await supabase.from('users').select('id, name').eq('role', 'coach')

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <Link href="/admin/batches" style={{ color: 'inherit', textDecoration: 'none' }}>Batches</Link>
          <span className="sep">/</span>
          <span className="current">Add New</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add Batch</h1>
            <p className="page-subtitle">Create a new coaching batch.</p>
          </div>
          <Link href="/admin/batches" className="btn btn--secondary">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>

        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header">
            <div className="card-title">Batch Details</div>
          </div>
          <div className="card-body">
            <BatchForm coaches={coaches ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
