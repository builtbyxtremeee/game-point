import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, CheckCircle, XCircle, AlertTriangle, IndianRupee, Clock, User as UserIcon } from 'lucide-react'
import type { User, TimeSlot, LeaveDay, AttendanceRecord, Fee } from '@/lib/types'

export default async function StudentDashboard() {
  const supabase = await createClient()
  
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authData.user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  const user = userData as User

  let timeSlot: TimeSlot | null = null
  if (user.time_slot_id) {
    const { data: tsData } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', user.time_slot_id)
      .single()
    timeSlot = tsData as TimeSlot | null
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  
  const pad = (n: number) => n.toString().padStart(2, '0')
  const startOfMonth = `${year}-${pad(month + 1)}-01`
  const endOfMonthDay = new Date(year, month + 1, 0).getDate()
  const endOfMonth = `${year}-${pad(month + 1)}-${pad(endOfMonthDay)}`
  
  // Fetch Attendance Records for current month
  const { data: attendanceData } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', user.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  const attendanceRecords = (attendanceData || []) as AttendanceRecord[]

  // Fetch Leave Days for current month
  let leaveDaysData: LeaveDay[] = []
  if (user.batch_id || user.time_slot_id) {
    let query = supabase
      .from('leave_days')
      .select('*')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
    
    const orQueryParts = ['scope.eq.court_wide']
    if (user.batch_id) {
      orQueryParts.push(`and(scope.eq.batch,batch_id.eq.${user.batch_id})`)
    }
    if (user.time_slot_id) {
      orQueryParts.push(`and(scope.eq.time_slot,time_slot_id.eq.${user.time_slot_id})`)
    }
    query = query.or(orQueryParts.join(','))
    
    const { data: leaves } = await query
    leaveDaysData = (leaves || []) as LeaveDay[]
  } else {
    const { data: leaves } = await supabase
      .from('leave_days')
      .select('*')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .eq('scope', 'court_wide')
    leaveDaysData = (leaves || []) as LeaveDay[]
  }

  // Calculate classes held up to today (or end of month if in past, but let's just do up to today for current month)
  let totalClassesHeld = 0
  let leaveDaysCount = 0

  if (timeSlot && timeSlot.days_of_week) {
    const daysOfWeek = timeSlot.days_of_week 
    const limitDate = now.getDate()
    for (let day = 1; day <= limitDate; day++) {
      const dateObj = new Date(year, month, day)
      const weekDay = dateObj.getDay() // 0-6
      if (daysOfWeek.includes(weekDay)) {
        const dateString = `${year}-${pad(month + 1)}-${pad(day)}`
        const isLeave = leaveDaysData.some(ld => ld.date === dateString)
        if (isLeave) {
          leaveDaysCount++
        } else {
          totalClassesHeld++
        }
      }
    }
  }

  // Calculate attended and missed from attendanceRecords
  let daysAttended = 0
  let daysMissed = 0
  
  attendanceRecords.forEach(record => {
    if (record.status === 'present') daysAttended++
    if (record.status === 'absent') daysMissed++
  })

  // Since sometimes coaches don't mark attendance, daysAttended + daysMissed might not equal totalClassesHeld.
  // But attendancePercentage is based on totalClassesHeld (attended / total held).
  let attendancePercentage = 0
  if (totalClassesHeld > 0) {
    attendancePercentage = Math.round((daysAttended / totalClassesHeld) * 100)
  }

  // Fetch Fee Status
  const { data: feeData } = await supabase
    .from('fees')
    .select('*')
    .eq('student_id', user.id)
    .order('due_date', { ascending: false })
    .limit(1)
    .single()

  const feeStatus = feeData as Fee | null

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-slate-500 dark:text-slate-400">Here is your dashboard for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Classes Held Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold mb-1">{totalClassesHeld}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Classes Held</p>
        </div>

        {/* Days Attended Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-4xl font-bold mb-1">{daysAttended}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Days Attended</p>
        </div>

        {/* Days Missed Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-4xl font-bold mb-1">{daysMissed}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Days Missed</p>
        </div>

        {/* Leave Days Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-4xl font-bold mb-1">{leaveDaysCount}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Leave Days</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Percentage */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" /> Attendance Rate
          </h3>
          <div className="relative pt-1 flex items-center justify-center mb-4">
            {/* Circular Progress */}
            <div className="w-32 h-32 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-slate-100 dark:text-slate-700" strokeWidth="3"></circle>
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-indigo-500" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - attendancePercentage} strokeLinecap="round"></circle>
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-slate-700 dark:text-slate-200">
                {attendancePercentage}%
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {attendancePercentage >= 75 ? 'Great job keeping up with your classes!' : 'Try to attend more classes to improve your rate.'}
          </p>
        </div>

        {/* Fee Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-500" /> Fee Status
          </h3>
          {feeStatus ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  feeStatus.status === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                    : feeStatus.status === 'not_paid'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>
                  {feeStatus.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400">Amount</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹{feeStatus.amount}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-500 dark:text-slate-400">Due Date</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{new Date(feeStatus.due_date).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <IndianRupee className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No fee records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
