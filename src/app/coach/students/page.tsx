import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { StudentsTable } from './_components/students-table'
import { redirect } from 'next/navigation'

export const metadata = { title: 'My Students | GamePoint' }

export default async function CoachStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
    
  if (!coachUser) redirect('/login')

  const { data: batches } = await supabase.from('batches').select('id, name').eq('coach_id', coachUser.id)
  const batchIds = batches?.map(b => b.id) || []
  const batchMap = new Map((batches ?? []).map(b => [b.id, b.name]))

  let slotMap = new Map()
  if (batchIds.length > 0) {
    const { data: slots } = await supabase.from('time_slots').select('id, label').in('batch_id', batchIds)
    slotMap = new Map((slots ?? []).map(s => [s.id, s.label]))
  }

  let students: any[] = []
  if (batchIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, auth_id, name, phone, role, batch_id, time_slot_id, join_date, created_at')
      .in('batch_id', batchIds)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
    students = data || []
  }

  const enriched = students.map(u => ({
    ...u,
    batch_name: u.batch_id ? (batchMap.get(u.batch_id) ?? '—') : '—',
    slot_label: u.time_slot_id ? (slotMap.get(u.time_slot_id) ?? '—') : '—',
  }))

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span className="current">My Students</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Students</h1>
            <p className="page-subtitle">Manage students assigned to your batches.</p>
          </div>
          <Link href="/coach/students/new" className="btn btn--primary">
            <Plus size={15} /> Add Student
          </Link>
        </div>
        <div className="card">
          <StudentsTable students={enriched} />
        </div>
      </div>
    </>
  )
}
