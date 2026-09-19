import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function GET(request: Request) {
  // Vercel automatically sends the Authorization: Bearer <CRON_SECRET> header
  // when CRON_SECRET is set in the project's environment variables.
  // This guard ensures the route is only callable by Vercel's cron scheduler.
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch notifications that haven't been sent via WhatsApp yet
  // Uses an OR condition in case whatsapp_sent is null on existing rows
  const { data: notifications, error } = await supabase
    .from('notifications_log')
    .select(`
      id,
      student_id,
      type,
      message,
      users(phone, name)
    `)
    .or('whatsapp_sent.is.null,whatsapp_sent.eq.false')

  if (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ success: true, message: 'No unsent notifications found.' })
  }

  let successCount = 0
  let failCount = 0

  for (const notif of notifications) {
    // Supabase JS might return an array for one-to-many, but user to notifications_log is one-to-many
    // from notifications_log to users it's many-to-one, so users should be an object.
    // However, if the typing gets weird, it might be an array. We will handle both safely.
    const userRecord = Array.isArray(notif.users) ? notif.users[0] : notif.users
    const userPhone = userRecord?.phone
    const userName = userRecord?.name || 'Student'

    if (!userPhone) {
      // Cannot send if phone is missing, update status to failed
      await supabase
        .from('notifications_log')
        .update({ whatsapp_sent: true, status: 'failed' })
        .eq('id', notif.id)

      failCount++
      continue
    }

    // Placeholders for template names and params - update these with final wording
    let templateName = 'placeholder_template'
    let templateParams = [notif.message || '']

    // Attempt to map common types to template placeholders
    if (notif.type === 'leave_day') {
      templateName = 'leave_day_alert'
      templateParams = [userName, notif.message || '']
    } else if (notif.type === 'fee_due') {
      templateName = 'fee_reminder'
      templateParams = [userName]
    } else if (notif.type === 'absent') {
      templateName = 'absence_alert'
      templateParams = [userName]
    }

    // Send the WhatsApp message
    const success = await sendWhatsAppMessage(
      userPhone,
      templateName,
      userName,
      templateParams
    )

    if (success) {
      await supabase
        .from('notifications_log')
        .update({ whatsapp_sent: true, status: 'sent' })
        .eq('id', notif.id)

      successCount++
    } else {
      await supabase
        .from('notifications_log')
        .update({ status: 'failed' }) // Keep whatsapp_sent as false/null to allow retries, or set to true if we don't want to retry. Let's not set whatsapp_sent to true on failure so it can be retried.
        .eq('id', notif.id)

      failCount++
    }
  }

  return NextResponse.json({
    success: true,
    processed: notifications.length,
    successCount,
    failCount
  })
}
