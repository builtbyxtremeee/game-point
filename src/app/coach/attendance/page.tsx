import { createClient } from '@/lib/supabase/server'
import { CoachAttendancePanel } from './_components/coach-attendance-panel'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Attendance | Coach | Game Point',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CoachAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const batchId = typeof params.batch === 'string' ? params.batch : undefined
  const slotId = typeof params.slot === 'string' ? params.slot : undefined
  const date = typeof params.date === 'string' ? params.date : new Date().toISOString().slice(0, 10)

  const supabase = await createClient()

  // Get current coach
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: coachUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!coachUser) redirect('/login')
  const coachId = coachUser.id

  // Fetch batches assigned to this coach
  const { data: batches } = await supabase
    .from('batches')
    .select('id, name')
    .eq('coach_id', coachId)
    .order('name')

  const batchIds = batches?.map(b => b.id) || []

  // Fetch slots for those batches
  let slots: any[] = []
  if (batchIds.length > 0) {
    const { data: s } = await supabase
      .from('time_slots')
      .select('id, label, batch_id')
      .in('batch_id', batchIds)
      .order('label')
    if (s) slots = s
  }

  // Fetch students if batch and slot selected
  let students: any[] = []
  if (batchId && slotId) {
    // Only allow selecting batches assigned to this coach
    if (batchIds.includes(batchId)) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .eq('batch_id', batchId)
        .eq('time_slot_id', slotId)
        .eq('role', 'student')
        .order('name')

      if (users && users.length > 0) {
        // Fetch existing attendance records for the date
        const { data: records } = await supabase
          .from('attendance_records')
          .select('student_id, status')
          .eq('date', date)
          .in('student_id', users.map(u => u.id))

        const recordMap = new Map(records?.map(r => [r.student_id, r.status]))

        students = users.map(u => ({
          id: u.id,
          name: u.name,
          status: recordMap.get(u.id) || 'absent'
        }))
      }
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
      </header>

      <CoachAttendancePanel 
        batches={batches || []}
        slots={slots}
        selectedBatch={batchId}
        selectedSlot={slotId}
        selectedDate={date}
        students={students}
      />
    </div>
  )
}
