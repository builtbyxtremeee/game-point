'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Returns the internal user row id of the currently-authenticated user. */
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

export type AttendanceState = { error?: string; success?: string }

export async function markCoachAttendanceAction(
  _prev: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  const batchId = (formData.get('batch_id') as string)?.trim()
  const slotId  = (formData.get('slot_id') as string)?.trim()
  const date    = (formData.get('date') as string)?.trim()

  if (!batchId || !slotId || !date) {
    return { error: 'Batch, time slot, and date are required.' }
  }

  const coachId = await currentUserId()
  if (!coachId) return { error: 'Not authenticated.' }

  // Fetch students in this batch and time slot
  const supabase = await createClient()
  const { data: students, error: studErr } = await supabase
    .from('users')
    .select('id')
    .eq('batch_id', batchId)
    .eq('time_slot_id', slotId)
    .eq('role', 'student')

  if (studErr) return { error: studErr.message }
  if (!students?.length) return { error: 'No students found in this batch and slot.' }

  const adminClient = createAdminClient()

  // Find existing records to determine edited_by
  const { data: existingRecords } = await adminClient
    .from('attendance_records')
    .select('student_id, id')
    .eq('date', date)
    .in('student_id', students.map(s => s.id))
  
  const existingSet = new Set(existingRecords?.map(r => r.student_id) || [])

  const recordsToUpsert = students.map(s => {
    const status = (formData.get(`status_${s.id}`) as string) || 'absent'
    const isExisting = existingSet.has(s.id)
    return {
      student_id: s.id,
      batch_id: batchId,
      time_slot_id: slotId,
      date,
      status,
      ...(isExisting ? {
        edited_by: coachId,
        edited_at: new Date().toISOString()
      } : {
        marked_by: coachId
      })
    }
  })

  // Upsert attendance_records
  const { error: upsertErr } = await adminClient
    .from('attendance_records')
    .upsert(recordsToUpsert, { onConflict: 'student_id,date' })

  if (upsertErr) return { error: upsertErr.message }

  // Insert notifications for those marked absent
  const newlyAbsent = recordsToUpsert.filter(r => r.status === 'absent' && !existingSet.has(r.student_id))
  
  if (newlyAbsent.length > 0) {
    const notifications = newlyAbsent.map(r => ({
      type: 'absence_auto',
      student_id: r.student_id,
      message: `You have been marked absent for ${date}.`,
      created_at: new Date().toISOString()
    }))

    await adminClient.from('notifications_log').insert(notifications)
  }

  revalidatePath('/coach/attendance')
  return { success: `Attendance saved for ${recordsToUpsert.length} student(s).` }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@gamepoint.local`
}

// ─── users (students) ──────────────────────────────────────────────────────────

export type UserFormState = { error?: string }

export async function createStudentAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const name       = (formData.get('name')        as string)?.trim()
  const phone      = (formData.get('phone')       as string)?.trim()
  const password   = (formData.get('password')    as string) ?? ''
  const batchId    = (formData.get('batch_id')    as string) || null
  const slotId     = (formData.get('time_slot_id') as string) || null
  const joinDate   = (formData.get('join_date')   as string) || new Date().toISOString().slice(0, 10)

  if (!name || !phone || !password || !batchId) {
    return { error: 'Name, phone, password, and batch are required.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const coachId = await currentUserId()
  if (!coachId) return { error: 'Not authenticated.' }

  // Verify that the batch belongs to this coach
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id !== coachId) {
    return { error: 'Unauthorized: You can only add students to your own batches.' }
  }

  const admin = createAdminClient()

  // 1. Create Supabase auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email:         phoneToEmail(phone),
    password,
    email_confirm: true,
  })
  if (authErr || !authData.user) {
    return { error: authErr?.message ?? 'Failed to create auth account.' }
  }

  // 2. Insert users row
  const { error: insertErr } = await admin.from('users').insert({
    auth_id:      authData.user.id,
    name,
    phone,
    role:         'student',
    batch_id:     batchId,
    time_slot_id: slotId,
    join_date:    joinDate,
  })

  if (insertErr) {
    // Rollback auth user on DB failure
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: insertErr.message }
  }

  revalidatePath('/coach/students')
  return {}
}

export async function updateStudentAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const userId    = (formData.get('user_id')      as string)?.trim()
  const authId    = (formData.get('auth_id')      as string)?.trim()
  const name      = (formData.get('name')         as string)?.trim()
  const batchId   = (formData.get('batch_id')     as string) || null
  const slotId    = (formData.get('time_slot_id') as string) || null
  const newPass   = (formData.get('new_password') as string)?.trim()

  if (!userId || !name || !batchId) {
    return { error: 'Required fields are missing.' }
  }

  const coachId = await currentUserId()
  if (!coachId) return { error: 'Not authenticated.' }

  // Verify batch belongs to coach
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id !== coachId) {
    return { error: 'Unauthorized: You can only assign students to your own batches.' }
  }

  const admin = createAdminClient()

  const { error: updateErr } = await admin
    .from('users')
    .update({ name, batch_id: batchId, time_slot_id: slotId })
    .eq('id', userId)

  if (updateErr) return { error: updateErr.message }

  // Optionally reset password
  if (newPass && newPass.length >= 6 && authId) {
    await admin.auth.admin.updateUserById(authId, { password: newPass })
  }

  revalidatePath('/coach/students')
  return {}
}

export async function deleteStudentAction(userId: string, authId: string) {
  const admin = createAdminClient()
  await admin.from('users').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(authId)
  revalidatePath('/coach/students')
}

// ─── batches ─────────────────────────────────────────────────────────────────

export type BatchFormState = { error?: string }

export async function createBatchAction(
  _prev: BatchFormState,
  formData: FormData,
): Promise<BatchFormState> {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Batch name is required.' }

  const coachId = await currentUserId()
  if (!coachId) return { error: 'Not authenticated.' }

  const { error } = await createAdminClient().from('batches').insert({ name, coach_id: coachId })
  if (error) return { error: error.message }

  revalidatePath('/coach/batches')
  return {}
}

export async function updateBatchAction(
  _prev: BatchFormState,
  formData: FormData,
): Promise<BatchFormState> {
  const batchId = (formData.get('batch_id') as string)?.trim()
  const name    = (formData.get('name')     as string)?.trim()

  if (!batchId || !name) return { error: 'All fields are required.' }

  const coachId = await currentUserId()
  if (!coachId) return { error: 'Not authenticated.' }

  // Verify batch belongs to this coach
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id !== coachId) {
    return { error: 'Unauthorized: You can only edit your own batches.' }
  }

  const { error } = await createAdminClient()
    .from('batches')
    .update({ name })
    .eq('id', batchId)

  if (error) return { error: error.message }

  revalidatePath('/coach/batches')
  return {}
}

export async function deleteBatchAction(batchId: string) {
  // Wait, shouldn't we verify ownership? Yes, but admin client bypasses RLS.
  // In a real app we'd want to check, but for this exercise we can assume UI won't allow it, or we check it.
  const coachId = await currentUserId()
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id === coachId) {
    await createAdminClient().from('batches').delete().eq('id', batchId)
    revalidatePath('/coach/batches')
  }
}

// ─── time slots ──────────────────────────────────────────────────────────────

export type SlotFormState = { error?: string }

export async function createSlotAction(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const batchId = (formData.get('batch_id') as string)?.trim()
  const label   = (formData.get('label')    as string)?.trim()
  const days    = formData.getAll('days_of_week').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6)

  if (!batchId || !label) return { error: 'Label is required.' }
  if (days.length === 0)  return { error: 'Select at least one day.' }

  const coachId = await currentUserId()
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id !== coachId) return { error: 'Unauthorized' }

  const { error } = await createAdminClient()
    .from('time_slots')
    .insert({ batch_id: batchId, label, days_of_week: days })

  if (error) return { error: error.message }

  revalidatePath('/coach/batches')
  return {}
}

export async function updateSlotAction(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const slotId  = (formData.get('slot_id') as string)?.trim()
  const batchId = (formData.get('batch_id') as string)?.trim() // Needs to be passed from the form
  const label   = (formData.get('label')   as string)?.trim()
  const days    = formData.getAll('days_of_week').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6)

  if (!slotId || !label || !batchId) return { error: 'All fields are required.' }
  if (days.length === 0) return { error: 'Select at least one day.' }

  const coachId = await currentUserId()
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id !== coachId) return { error: 'Unauthorized' }

  const { error } = await createAdminClient()
    .from('time_slots')
    .update({ label, days_of_week: days })
    .eq('id', slotId)

  if (error) return { error: error.message }

  revalidatePath('/coach/batches')
  return {}
}

export async function deleteSlotAction(slotId: string, batchId: string) {
  const coachId = await currentUserId()
  const supabase = await createClient()
  const { data: batch } = await supabase.from('batches').select('coach_id').eq('id', batchId).single()
  if (batch?.coach_id === coachId) {
    await createAdminClient().from('time_slots').delete().eq('id', slotId)
    revalidatePath('/coach/batches')
  }
}

// ─── leave days ──────────────────────────────────────────────────────────────

export type LeaveFormState = { error?: string; success?: string }

export async function createLeaveDayAction(
  _prev: LeaveFormState,
  formData: FormData,
): Promise<LeaveFormState> {
  const date    = (formData.get('date')         as string)?.trim()
  const scope   = (formData.get('scope')        as string)?.trim()
  const batchId = (formData.get('batch_id')     as string) || null
  const slotId  = (formData.get('time_slot_id') as string) || null
  const reason  = (formData.get('reason')       as string)?.trim()

  if (!date || !scope || !reason) return { error: 'Date, scope, and reason are required.' }

  const createdBy = await currentUserId()
  if (!createdBy) return { error: 'Not authenticated.' }

  const adminClient = createAdminClient()

  const { error } = await adminClient.from('leave_days').insert({
    date,
    scope,
    batch_id:     scope !== 'court_wide' ? batchId : null,
    time_slot_id: scope === 'time_slot' ? slotId : null,
    reason,
    created_by: createdBy,
  })

  if (error) return { error: error.message }

  // Fetch affected students
  let query = adminClient.from('users').select('id').eq('role', 'student')
  if (scope === 'batch' && batchId) {
    query = query.eq('batch_id', batchId)
  } else if (scope === 'time_slot' && batchId && slotId) {
    query = query.eq('batch_id', batchId).eq('time_slot_id', slotId)
  }
  // For court_wide, we don't filter.

  const { data: students } = await query

  if (students && students.length > 0) {
    const notifications = students.map(s => ({
      student_id: s.id,
      type: 'leave_day',
      message: `Leave Day on ${date}: ${reason}`,
      sent_by: createdBy,
      status: 'pending',
      sent_at: new Date().toISOString()
    }))

    await adminClient.from('notifications_log').insert(notifications)
  }

  revalidatePath('/coach/leaves')
  return { success: 'Leave day added.' }
}

export async function deleteLeaveDayAction(leaveId: string) {
  await createAdminClient().from('leave_days').delete().eq('id', leaveId)
  revalidatePath('/coach/leaves')
}
