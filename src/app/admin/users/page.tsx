import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus }         from 'lucide-react'
import { UsersTable }   from './_components/users-table'

export const metadata = { title: 'Users — Admin | GamePoint' }

export default async function UsersPage() {
  const supabase = await createClient()

  // Fetch all data in parallel
  const [
    { data: users },
    { data: batches },
    { data: slots },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, auth_id, name, phone, role, batch_id, time_slot_id, join_date, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('batches').select('id, name'),
    supabase.from('time_slots').select('id, label'),
  ])

  // Build lookup maps
  const batchMap = new Map((batches ?? []).map(b => [b.id, b.name]))
  const slotMap  = new Map((slots   ?? []).map(s => [s.id, s.label]))

  const enriched = (users ?? []).map(u => ({
    ...u,
    batch_name: u.batch_id     ? (batchMap.get(u.batch_id)     ?? '—') : '—',
    slot_label: u.time_slot_id ? (slotMap.get(u.time_slot_id)  ?? '—') : '—',
  }))

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <span className="current">Users</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">Manage all coach and student accounts.</p>
          </div>
          <Link href="/admin/users/new" className="btn btn--primary" id="add-user-btn">
            <Plus size={15} /> Add User
          </Link>
        </div>

        <div className="card">
          <UsersTable users={enriched} />
        </div>
      </div>
    </>
  )
}
