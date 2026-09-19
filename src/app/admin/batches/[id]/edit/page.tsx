import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../../_components/batch-form'

export const metadata = { title: 'Edit Batch — Admin | GamePoint' }

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const [
    { data: batch },
    { data: coaches }
  ] = await Promise.all([
    supabase.from('batches').select('*').eq('id', id).single(),
    supabase.from('users').select('id, name').eq('role', 'coach')
  ])

  if (!batch) notFound()

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <Link href="/admin/batches" style={{ color: 'inherit', textDecoration: 'none' }}>Batches</Link>
          <span className="sep">/</span>
          <span className="current">Edit Batch</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Edit Batch</h1>
            <p className="page-subtitle">Update batch details.</p>
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
            <BatchForm initialData={batch} coaches={coaches ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
