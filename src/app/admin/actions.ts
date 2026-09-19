'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── helpers ────────────────────────────────────────────────────────────────

function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@gamepoint.local`
}

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

// ─── sign-out ────────────────────────────────────────────────────────────────

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── users ───────────────────────────────────────────────────────────────────

export type UserFormState = { error?: string }

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const name       = (formData.get('name')        as string)?.trim()
  const phone      = (formData.get('phone')       as string)?.trim()
  const role       = (formData.get('role')        as string)?.trim()
  const password   = (formData.get('password')    as string) ?? ''
  const batchId    = (formData.get('batch_id')    as string) || null
  const slotId     = (formData.get('time_slot_id') as string) || null
  const joinDate   = (formData.get('join_date')   as string) || new Date().toISOString().slice(0, 10)

  if (!name || !phone || !role || !password) {
    return { error: 'Name, phone, role, and password are required.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
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
    role,
    batch_id:     batchId,
    time_slot_id: slotId,
    join_date:    joinDate,
  })

  if (insertErr) {
    // Rollback auth user on DB failure
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: insertErr.message }
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function updateUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const userId    = (formData.get('user_id')      as string)?.trim()
  const authId    = (formData.get('auth_id')      as string)?.trim()
  const name      = (formData.get('name')         as string)?.trim()
  const role      = (formData.get('role')         as string)?.trim()
  const batchId   = (formData.get('batch_id')     as string) || null
  const slotId    = (formData.get('time_slot_id') as string) || null
  const newPass   = (formData.get('new_password') as string)?.trim()

  if (!userId || !name || !role) {
    return { error: 'Required fields are missing.' }
  }

  const admin = createAdminClient()

  const { error: updateErr } = await admin
    .from('users')
    .update({ name, role, batch_id: batchId, time_slot_id: slotId })
    .eq('id', userId)

  if (updateErr) return { error: updateErr.message }

  // Optionally reset password
  if (newPass && newPass.length >= 6 && authId) {
    await admin.auth.admin.updateUserById(authId, { password: newPass })
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

/** Bound server action — call with deleteUserAction.bind(null, userId, authId) */
export async function deleteUserAction(userId: string, authId: string) {
  const admin = createAdminClient()
  await admin.from('users').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(authId)
  revalidatePath('/admin/users')
}

// ─── batches ─────────────────────────────────────────────────────────────────

export type BatchFormState = { error?: string }

export async function createBatchAction(
  _prev: BatchFormState,
  formData: FormData,
): Promise<BatchFormState> {
  const name    = (formData.get('name')     as string)?.trim()
  const coachId = (formData.get('coach_id') as string)?.trim()

  if (!name || !coachId) return { error: 'Batch name and coach are required.' }

  const { error } = await createAdminClient().from('batches').insert({ name, coach_id: coachId })
  if (error) return { error: error.message }

  revalidatePath('/admin/batches')
  redirect('/admin/batches')
}

export async function updateBatchAction(
  _prev: BatchFormState,
  formData: FormData,
): Promise<BatchFormState> {
  const batchId = (formData.get('batch_id') as string)?.trim()
  const name    = (formData.get('name')     as string)?.trim()
  const coachId = (formData.get('coach_id') as string)?.trim()

  if (!batchId || !name || !coachId) return { error: 'All fields are required.' }

  const { error } = await createAdminClient()
    .from('batches')
    .update({ name, coach_id: coachId })
    .eq('id', batchId)

  if (error) return { error: error.message }

  revalidatePath('/admin/batches')
  redirect('/admin/batches')
}

export async function deleteBatchAction(batchId: string) {
  await createAdminClient().from('batches').delete().eq('id', batchId)
  revalidatePath('/admin/batches')
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

  const { error } = await createAdminClient()
    .from('time_slots')
    .insert({ batch_id: batchId, label, days_of_week: days })

  if (error) return { error: error.message }

  revalidatePath('/admin/batches')
  redirect('/admin/batches')
}

export async function updateSlotAction(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const slotId  = (formData.get('slot_id') as string)?.trim()
  const label   = (formData.get('label')   as string)?.trim()
  const days    = formData.getAll('days_of_week').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6)

  if (!slotId || !label) return { error: 'All fields are required.' }
  if (days.length === 0) return { error: 'Select at least one day.' }

  const { error } = await createAdminClient()
    .from('time_slots')
    .update({ label, days_of_week: days })
    .eq('id', slotId)

  if (error) return { error: error.message }

  revalidatePath('/admin/batches')
  redirect('/admin/batches')
}

export async function deleteSlotAction(slotId: string) {
  await createAdminClient().from('time_slots').delete().eq('id', slotId)
  revalidatePath('/admin/batches')
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

  // 1. Fetch affected students
  let query = adminClient.from('users').select('id').eq('role', 'student')
  if (scope === 'batch' && batchId) {
    query = query.eq('batch_id', batchId)
  } else if (scope === 'time_slot' && batchId && slotId) {
    query = query.eq('batch_id', batchId).eq('time_slot_id', slotId)
  }

  const { data: students } = await query

  // 2. Insert notifications
  if (students && students.length > 0) {
    const notifications = students.map(s => ({
      student_id: s.id,
      type: 'leave_day',
      message: `Leave Day on ${date}: ${reason}`,
      sent_by: createdBy,
      status: 'pending', // Placeholder status
      sent_at: new Date().toISOString()
    }))

    await adminClient.from('notifications_log').insert(notifications)
  }

  revalidatePath('/admin/leaves')
  return { success: 'Leave day added.' }
}

export async function deleteLeaveDayAction(leaveId: string) {
  await createAdminClient().from('leave_days').delete().eq('id', leaveId)
  revalidatePath('/admin/leaves')
}

// ─── fees ────────────────────────────────────────────────────────────────────

export async function updateFeeStatusAction(
  feeId: string,
  status: 'paid' | 'not_paid' | 'pending',
) {
  const markedBy = await currentUserId()
  await createAdminClient()
    .from('fees')
    .update({
      status,
      marked_by:       markedBy,
      last_marked_date: new Date().toISOString().slice(0, 10),
    })
    .eq('id', feeId)

  revalidatePath('/admin/fees')
}

// ─── attendance ──────────────────────────────────────────────────────────────

export type AttendanceState = { error?: string; success?: string }

export async function markAttendanceAction(
  _prev: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  const batchId = (formData.get('batch_id')    as string)?.trim()
  const slotId  = (formData.get('slot_id')     as string)?.trim()
  const date    = (formData.get('date')        as string)?.trim()

  if (!batchId || !slotId || !date) {
    return { error: 'Batch, time slot, and date are required.' }
  }

  const markedBy = await currentUserId()
  if (!markedBy) return { error: 'Not authenticated.' }

  // Fetch students in batch
  const supabase = await createClient()
  const { data: students, error: studErr } = await supabase
    .from('users')
    .select('id')
    .eq('batch_id', batchId)
    .eq('role', 'student')

  if (studErr) return { error: studErr.message }
  if (!students?.length) return { error: 'No students found in this batch.' }

  const records = students.map(s => ({
    student_id:   s.id,
    batch_id:     batchId,
    time_slot_id: slotId,
    date,
    status:       (formData.get(`status_${s.id}`) as string) || 'absent',
    marked_by:    markedBy,
  }))

  const { error } = await createAdminClient()
    .from('attendance_records')
    .upsert(records, { onConflict: 'student_id,date,time_slot_id' })

  if (error) return { error: error.message }

  revalidatePath('/admin/attendance')
  return { success: `Attendance saved for ${records.length} student(s).` }
}
