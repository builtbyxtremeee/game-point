import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Users, 
  CalendarDays, 
  Clock, 
  CreditCard,
  ClipboardCheck
} from 'lucide-react'

export const metadata = { title: 'Coach Dashboard | GamePoint' }

export default async function CoachDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coachUser } = await supabase
    .from('users')
    .select('id, name')
    .eq('auth_id', user.id)
    .single()

  if (!coachUser) redirect('/login')

  // Get today's attendance summary for coach's batches
  const today = new Date().toISOString().slice(0, 10)
  
  // 1. Get coach's batches
  const { data: batches } = await supabase
    .from('batches')
    .select('id')
    .eq('coach_id', coachUser.id)
    
  const batchIds = batches?.map(b => b.id) || []
  
  let attendanceCount = 0
  let totalExpected = 0
  
  if (batchIds.length > 0) {
    // 2. Count total students in these batches
    const { count: studentsCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('batch_id', batchIds)
      .eq('role', 'student')
      
    totalExpected = studentsCount || 0
    
    // 3. Count present attendance today
    const { count: presentCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .in('batch_id', batchIds)
      .eq('date', today)
      .eq('status', 'present')
      
    attendanceCount = presentCount || 0
  }

  const quickLinks = [
    { name: 'Mark Attendance', href: '/coach/attendance', icon: ClipboardCheck, desc: 'Record daily attendance' },
    { name: 'My Students', href: '/coach/students', icon: Users, desc: 'Manage your students' },
    { name: 'My Batches', href: '/coach/batches', icon: CalendarDays, desc: 'Manage batches & slots' },
    { name: 'Leave Days', href: '/coach/leaves', icon: Clock, desc: 'Mark leaves & notify' },
    { name: 'Fee Status', href: '/coach/fees', icon: CreditCard, desc: 'Check student fees' },
  ]

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span className="current">Dashboard</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome, {coachUser.name}</h1>
            <p className="page-subtitle">Here's what's happening today.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Today's Attendance</h3>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {attendanceCount} / {totalExpected}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Students present today</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {quickLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="card" 
              style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
            >
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-alt)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                <link.icon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{link.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
