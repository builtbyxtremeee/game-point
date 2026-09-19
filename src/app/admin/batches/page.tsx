import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { BatchesList } from './_components/batches-list'

export const metadata = { title: 'Batches & Slots — Admin | GamePoint' }

export default async function BatchesPage() {
  const supabase = await createClient()

  const [
    { data: batches },
    { data: slots },
    { data: coaches }
  ] = await Promise.all([
    supabase.from('batches').select('id, name, coach_id').order('created_at', { ascending: false }),
    supabase.from('time_slots').select('*').order('created_at', { ascending: true }),
    supabase.from('users').select('id, name').eq('role', 'coach')
  ])

  // Build coach map for display
  const coachMap = new Map((coaches ?? []).map(c => [c.id, c.name]))

  const enrichedBatches = (batches ?? []).map(b => ({
    ...b,
    coach_name: coachMap.get(b.coach_id) ?? 'Unknown Coach',
    slots: (slots ?? []).filter(s => s.batch_id === b.id)
  }))

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <span className="current">Batches & Slots</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Batches & Time Slots</h1>
            <p className="page-subtitle">Manage coaching batches and their weekly schedule slots.</p>
          </div>
          <Link href="/admin/batches/new" className="btn btn--primary">
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
