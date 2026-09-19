import { createClient } from '@/lib/supabase/server'
import { FeesTable } from './_components/fees-table'

export const metadata = { title: 'Fee Status — Admin | GamePoint' }

export default async function FeesPage() {
  const supabase = await createClient()

  const [
    { data: fees },
    { data: students }
  ] = await Promise.all([
    supabase.from('fees').select('*').order('due_date', { ascending: true }),
    supabase.from('users').select('id, name, phone').eq('role', 'student')
  ])

  const studentMap = new Map((students ?? []).map(s => [s.id, { name: s.name, phone: s.phone }]))

  const enrichedFees = (fees ?? []).map(f => {
    const st = studentMap.get(f.student_id)
    return {
      ...f,
      student_name: st?.name ?? 'Unknown',
      student_phone: st?.phone ?? '—'
    }
  })

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <span className="current">Fee Status</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Fee Status</h1>
            <p className="page-subtitle">Track payments and manage due dates.</p>
          </div>
        </div>

        <div className="card">
          <FeesTable fees={enrichedFees} />
        </div>
      </div>
    </>
  )
}
