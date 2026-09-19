import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { StudentForm } from '../_components/student-form'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Add Student | GamePoint' }

export default async function NewStudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  if (!coachUser) redirect('/login')

  const [ { data: batches }, { data: slots } ] = await Promise.all([
    supabase.from('batches').select('id, name').eq('coach_id', coachUser.id),
    supabase.from('time_slots').select('id, label, batch_id')
  ])

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <Link href="/coach/students" style={{ color: 'inherit', textDecoration: 'none' }}>My Students</Link>
          <span className="sep">/</span>
          <span className="current">Add New</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add Student</h1>
          </div>
          <Link href="/coach/students" className="btn btn--secondary">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
        <div className="card" style={{ maxWidth: 800 }}>
          <div className="card-body">
            <StudentForm batches={batches ?? []} slots={slots ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
