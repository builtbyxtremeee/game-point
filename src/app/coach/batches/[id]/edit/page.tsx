import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../../_components/batch-form'
import { redirect, notFound } from 'next/navigation'

export const metadata = { title: 'Edit Batch | GamePoint' }

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  if (!coachUser) redirect('/login')

  const { data: batch } = await supabase.from('batches').select('*').eq('id', id).single()

  if (!batch) notFound()
  if (batch.coach_id !== coachUser.id) {
    return <div className="admin-content"><div className="alert alert--error">Unauthorized</div></div>
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <Link href="/coach/batches" style={{ color: 'inherit', textDecoration: 'none' }}>My Batches</Link>
          <span className="sep">/</span><span className="current">Edit</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div><h1 className="page-title">Edit Batch</h1></div>
          <Link href="/coach/batches" className="btn btn--secondary"><ArrowLeft size={15} /> Back</Link>
        </div>
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-body"><BatchForm initialData={batch} /></div>
        </div>
      </div>
    </>
  )
}
