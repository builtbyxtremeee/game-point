import { createClient } from '@/lib/supabase/server'
import { LeavesPanel } from './_components/leaves-panel'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Leave Days | GamePoint' }

export default async function CoachLeavesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase.from('users').select('id, name').eq('auth_id', user.id).single()
  if (!coachUser) redirect('/login')

  // Fetch only batches owned by this coach
  const { data: batches } = await supabase.from('batches').select('id, name').eq('coach_id', coachUser.id)
  const batchIds = batches?.map(b => b.id) || []

  // Fetch slots for those batches
  let slots: any[] = []
  if (batchIds.length > 0) {
    const { data } = await supabase.from('time_slots').select('id, label, batch_id').in('batch_id', batchIds)
    slots = data || []
  }

  // Fetch leaves: court_wide OR belonging to coach's batches
  let leavesQuery = supabase.from('leave_days').select('*').order('date', { ascending: false })
  
  if (batchIds.length > 0) {
    leavesQuery = leavesQuery.or(`scope.eq.court_wide,batch_id.in.(${batchIds.join(',')})`)
  } else {
    leavesQuery = leavesQuery.eq('scope', 'court_wide')
  }

  const { data: leaves } = await leavesQuery
  
  // Need users mapping for creator names
  const { data: users } = await supabase.from('users').select('id, name').in('role', ['admin', 'coach'])

  const batchMap = new Map((batches ?? []).map(b => [b.id, b.name]))
  const slotMap = new Map((slots ?? []).map(s => [s.id, s.label]))
  const userMap = new Map((users ?? []).map(u => [u.id, u.name]))

  const enrichedLeaves = (leaves ?? []).map(l => ({
    ...l,
    batch_name: l.batch_id ? batchMap.get(l.batch_id) : null,
    slot_label: l.time_slot_id ? slotMap.get(l.time_slot_id) : null,
    creator_name: userMap.get(l.created_by) ?? 'Unknown'
  }))

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span className="current">Leave Days</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Leave Days</h1>
            <p className="page-subtitle">Manage court-wide holidays or batch-specific leave days.</p>
          </div>
        </div>
        <LeavesPanel leaves={enrichedLeaves} batches={batches ?? []} slots={slots ?? []} />
      </div>
    </>
  )
}
