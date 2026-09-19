import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { SlotForm } from '../../_components/slot-form'
import { notFound, redirect } from 'next/navigation'

export const metadata = { title: 'Edit Time Slot | GamePoint' }

export default async function EditSlotPage({ params }: { params: Promise<{ id: string, slotId: string }> }) {
  const { id: batchId, slotId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  if (!coachUser) redirect('/login')

  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id !== coachUser.id) return <div className="admin-content">Unauthorized</div>

  const { data: slot } = await supabase.from('time_slots').select('*').eq('id', slotId).single()
  if (!slot) notFound()

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <Link href="/coach/batches" style={{ color: 'inherit', textDecoration: 'none' }}>My Batches</Link>
          <span className="sep">/</span><span className="current">Edit Time Slot</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div><h1 className="page-title">Edit Time Slot</h1></div>
          <Link href="/coach/batches" className="btn btn--secondary"><ArrowLeft size={15} /> Back</Link>
        </div>
        <div className="card" style={{ maxWidth: 500 }}>
          <div className="card-body"><SlotForm batchId={batchId} initialData={slot} /></div>
        </div>
      </div>
    </>
  )
}
