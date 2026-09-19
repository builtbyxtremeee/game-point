import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // Optional: Add simple authorization headers check if not relying on Vercel's built-in cron auth
  // But Vercel sets a specific header for cron jobs, typically we check that in middleware or here.
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient()
  
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setUTCDate(threeDaysFromNow.getUTCDate() + 3)
  // assuming due_date is stored as YYYY-MM-DD
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0]

  let notPaidNotifsInserted = 0
  let remindersInserted = 0
  const errors: string[] = []

  try {
    // --- 1. Fee Not Paid Daily Notifications ---
    // Get all fees where status = 'not_paid'
    const { data: notPaidFees, error: notPaidError } = await supabase
      .from('fees')
      .select('id, student_id, amount')
      .eq('status', 'not_paid')

    if (notPaidError) throw notPaidError

    if (notPaidFees && notPaidFees.length > 0) {
      // Get all 'fee_not_paid' logs from today to avoid duplicates
      const { data: recentLogs, error: logsError } = await supabase
        .from('notifications_log')
        .select('student_id')
        .eq('type', 'fee_not_paid')
        .gte('created_at', today.toISOString()) // assuming created_at exists
        
      if (logsError) {
        // Fallback if created_at is an issue, but standard Supabase tables have created_at
        console.warn('Could not fetch recent logs', logsError)
      }

      const studentsAlreadyNotified = new Set((recentLogs || []).map(l => l.student_id))

      const notificationsToInsert = notPaidFees
        .filter(fee => !studentsAlreadyNotified.has(fee.student_id))
        .map(fee => ({
          student_id: fee.student_id,
          type: 'fee_not_paid',
          message: `Your fee of ₹${fee.amount} is marked as not paid. Please clear your dues.`,
          status: 'pending' // Initial status before AiSensy picks it up
        }))

      if (notificationsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('notifications_log')
          .insert(notificationsToInsert)
          
        if (insertError) throw insertError
        notPaidNotifsInserted = notificationsToInsert.length
      }
    }

    // --- 2. Fee Reminder (3 Days Before Due) ---
    // Get all fees where due_date = threeDaysStr and status != 'paid' and reminder_sent_at is null
    const { data: upcomingFees, error: upcomingError } = await supabase
      .from('fees')
      .select('id, student_id, amount, due_date')
      .eq('due_date', threeDaysStr)
      .neq('status', 'paid')
      .is('reminder_sent_at', null)
      
    if (upcomingError) throw upcomingError

    if (upcomingFees && upcomingFees.length > 0) {
      const remindersToInsert = upcomingFees.map(fee => ({
        student_id: fee.student_id,
        type: 'fee_reminder',
        message: `Reminder: Your fee of ₹${fee.amount} is due on ${fee.due_date}.`,
        status: 'pending'
      }))
      
      const { error: insertReminderError } = await supabase
        .from('notifications_log')
        .insert(remindersToInsert)
        
      if (insertReminderError) throw insertReminderError
      
      remindersInserted = remindersToInsert.length
      
      // Update reminder_sent_at on fees table
      const feeIdsToUpdate = upcomingFees.map(f => f.id)
      const { error: updateFeesError } = await supabase
        .from('fees')
        .update({ reminder_sent_at: new Date().toISOString() })
        .in('id', feeIdsToUpdate)
        
      if (updateFeesError) throw updateFeesError
    }

  } catch (err: any) {
    console.error('Error in generate-fee-notifications:', err)
    errors.push(err.message)
    return NextResponse.json({ success: false, errors }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    notPaidNotifsInserted,
    remindersInserted,
  })
}
