'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  return data?.id ?? null
}

export async function toggleFeeStatusAction(
  feeId: string,
  studentId: string,
  newStatus: 'paid' | 'not_paid'
): Promise<{ error?: string; success?: string }> {
  const adminClient = createAdminClient()
  const coachId = await currentUserId()
  
  if (!coachId) {
    return { error: 'Not authenticated' }
  }

  // Update the fee record
  const { error: updateError } = await adminClient
    .from('fees')
    .update({
      status: newStatus,
      marked_by: coachId,
      last_marked_date: new Date().toISOString()
    })
    .eq('id', feeId)

  if (updateError) {
    return { error: updateError.message }
  }

  // If status is set to not_paid, log a notification.
  // Note: In production, this should be triggered by a daily scheduled job 
  // that repeats the reminder every day the status stays not_paid, 
  // not just on this toggle action.
  if (newStatus === 'not_paid') {
    await adminClient.from('notifications_log').insert([{
      type: 'fee_not_paid',
      student_id: studentId,
      message: 'Your fees are currently pending. Please pay them as soon as possible.',
      created_at: new Date().toISOString(),
      sent_by: coachId,
      status: 'pending',
      sent_at: new Date().toISOString()
    }])
  }

  revalidatePath('/coach/fees')
  return { success: 'Fee status updated successfully.' }
}
