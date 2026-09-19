'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Maps a phone number to a fake internal email address.
 * e.g. "9876543210" -> "9876543210@gamepoint.local"
 */
function phoneToEmail(phone: string): string {
  // Strip all non-digit characters to normalise
  const digits = phone.replace(/\D/g, '')
  return `${digits}@gamepoint.local`
}

export async function loginAction(prevState: { error?: string }, formData: FormData) {
  const phone = (formData.get('phone') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!phone || !password) {
    return { error: 'Phone number and password are required.' }
  }

  const email = phoneToEmail(phone)
  const supabase = await createClient()

  // Sign in using Supabase email auth with the fake internal email
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password })

  if (signInError || !signInData.user) {
    return { error: 'Invalid phone number or password.' }
  }

  const authId = signInData.user.id

  // Look up the user's role from the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', authId)
    .single()

  if (userError || !userData) {
    return { error: 'User profile not found. Please contact an administrator.' }
  }

  const role = userData.role as 'admin' | 'coach' | 'student'

  // Role-based redirect
  if (role === 'admin') redirect('/admin')
  if (role === 'coach') redirect('/coach')
  redirect('/student')
}
