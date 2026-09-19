import { createClient } from '@/lib/supabase/server'
import { FeesTable } from './_components/fees-table'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Manage Fees | Game Point',
}

export default async function CoachFeesPage() {
  const supabase = await createClient()

  // Verify auth
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) redirect('/login')

  // Fetch the current user role to ensure they are admin or coach
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'coach')) {
    redirect('/student') // Or another safe route
  }

  // Fetch all students and their fees
  // We'll join users (role=student) with their latest fee record or all fee records.
  // Assuming a student can have multiple fees, we probably want the current active fee,
  // but let's just fetch all fees and their associated student info for simplicity.
  const { data: feesData, error } = await supabase
    .from('fees')
    .select(`
      id,
      amount,
      due_date,
      status,
      student_id,
      users:student_id (
        id,
        name,
        phone,
        batch_id,
        time_slot_id,
        batches:batch_id ( name ),
        time_slots:time_slot_id ( label )
      )
    `)
    .order('due_date', { ascending: false })

  if (error) {
    console.error('Error fetching fees:', error)
  }

  // Format data for the client
  const formattedFees = (feesData || []).map((fee: any) => ({
    id: fee.id,
    student_id: fee.student_id,
    amount: fee.amount,
    due_date: fee.due_date,
    status: fee.status,
    student_name: fee.users?.name || 'Unknown Student',
    student_phone: fee.users?.phone || '',
    batch_name: fee.users?.batches?.name || 'No Batch',
    slot_label: fee.users?.time_slots?.label || 'No Slot'
  }))

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Fees Management</h1>
          <p className="page-description">
            Track student fee payments and send reminders.
          </p>
        </div>
      </header>

      <div className="card">
        <FeesTable initialFees={formattedFees} />
      </div>
    </div>
  )
}
