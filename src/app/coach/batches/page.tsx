import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { BatchesList } from './_components/batches-list'
import { redirect } from 'next/navigation'

export const metadata = { title: 'My Batches & Slots | GamePoint' }

export default async function CoachBatchesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase.from('users').select('id, name').eq('auth_id', user.id).single()
  if (!coachUser) redirect('/login')

  const [
    { data: batches },
    { data: slots }
  ] = await Promise.all([
    supabase.from('batches').select('id, name, coach_id').eq('coach_id', coachUser.id).order('created_at', { ascending: false }),
    supabase.from('time_slots').select('*').order('created_at', { ascending: true })
  ])

  const enrichedBatches = (batches ?? []).map(b => ({
    ...b,
    coach_name: coachUser.name,
    slots: (slots ?? []).filter(s => s.batch_id === b.id)
  }))

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span className="current">My Batches & Slots</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Batches & Time Slots</h1>
            <p className="page-subtitle">Manage your coaching batches and their weekly schedule slots.</p>
          </div>
          <Link href="/coach/batches/new" className="btn btn--primary">
            <Plus size={15} /> Add Batch
          </Link>
        </div>
        <div className="card">
          <BatchesList batches={enrichedBatches} />
        </div>
      </div>
    </>
  )
}
