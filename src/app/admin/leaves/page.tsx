import { createClient } from '@/lib/supabase/server'
import { LeavesPanel } from './_components/leaves-panel'

export const metadata = { title: 'Leave Days — Admin | GamePoint' }

export default async function LeavesPage() {
  const supabase = await createClient()

  const [
    { data: leaves },
    { data: batches },
    { data: slots },
    { data: users }
  ] = await Promise.all([
    supabase.from('leave_days').select('*').order('date', { ascending: false }),
    supabase.from('batches').select('id, name'),
    supabase.from('time_slots').select('id, label, batch_id'),
    supabase.from('users').select('id, name').in('role', ['admin', 'coach'])
  ])

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
          <span>Admin</span>
          <span className="sep">/</span>
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

        <LeavesPanel 
          leaves={enrichedLeaves} 
          batches={batches ?? []} 
          slots={slots ?? []} 
        />
      </div>
    </>
  )
}
