import { createClient } from '@/lib/supabase/server'
import { AttendancePanel } from './_components/attendance-panel'

export const metadata = { title: 'Attendance — Admin | GamePoint' }

export default async function AttendancePage({
  searchParams
}: {
  searchParams: Promise<{ batch?: string; slot?: string; date?: string }>
}) {
  const { batch, slot, date } = await searchParams
  const supabase = await createClient()

  const [
    { data: batches },
    { data: slots }
  ] = await Promise.all([
    supabase.from('batches').select('id, name'),
    supabase.from('time_slots').select('id, label, batch_id')
  ])

  let students: any[] = []
  let existingRecords: any[] = []

  if (batch && slot && date) {
    const [
      { data: stData },
      { data: attData }
    ] = await Promise.all([
      supabase.from('users').select('id, name').eq('role', 'student').eq('batch_id', batch),
      supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('batch_id', batch)
        .eq('time_slot_id', slot)
        .eq('date', date)
    ])
    students = stData ?? []
    existingRecords = attData ?? []
  }

  const attendanceMap = new Map(existingRecords.map(r => [r.student_id, r.status]))
  const enrichedStudents = students.map(s => ({
    ...s,
    status: attendanceMap.get(s.id) || 'absent'
  }))

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <span className="current">Attendance</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Mark Attendance</h1>
            <p className="page-subtitle">Select a batch, slot, and date to record attendance.</p>
          </div>
        </div>

        <AttendancePanel 
          batches={batches ?? []} 
          slots={slots ?? []}
          selectedBatch={batch}
          selectedSlot={slot}
          selectedDate={date}
          students={enrichedStudents}
        />
      </div>
    </>
  )
}
