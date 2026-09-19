import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { StudentForm } from '../../_components/student-form'
import { redirect, notFound } from 'next/navigation'

export const metadata = { title: 'Edit Student | GamePoint' }

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
  if (!coachUser) redirect('/login')

  const [ { data: student }, { data: batches }, { data: slots } ] = await Promise.all([
    supabase.from('users').select('*').eq('id', id).single(),
    supabase.from('batches').select('id, name').eq('coach_id', coachUser.id),
    supabase.from('time_slots').select('id, label, batch_id')
  ])

  if (!student) notFound()

  // Ensure this student belongs to one of the coach's batches
  const batchIds = batches?.map(b => b.id) || []
  if (!student.batch_id || !batchIds.includes(student.batch_id)) {
    return (
      <div className="admin-content">
        <div className="alert alert--error">Unauthorized: This student is not in any of your batches.</div>
        <Link href="/coach/students" className="btn btn--secondary" style={{ marginTop: '1rem' }}>Back</Link>
      </div>
    )
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <Link href="/coach/students" style={{ color: 'inherit', textDecoration: 'none' }}>My Students</Link>
          <span className="sep">/</span>
          <span className="current">Edit</span>
        </div>
      </div>
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Edit Student</h1>
          </div>
          <Link href="/coach/students" className="btn btn--secondary">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
        <div className="card" style={{ maxWidth: 800 }}>
          <div className="card-body">
            <StudentForm initialData={student} batches={batches ?? []} slots={slots ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
