import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { UserForm } from './_components/user-form'

export const metadata = { title: 'Add User — Admin | GamePoint' }

export default async function NewUserPage() {
  const supabase = await createClient()
  
  const [
    { data: batches },
    { data: slots }
  ] = await Promise.all([
    supabase.from('batches').select('id, name'),
    supabase.from('time_slots').select('id, label, batch_id')
  ])

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <Link href="/admin/users" style={{ color: 'inherit', textDecoration: 'none' }}>Users</Link>
          <span className="sep">/</span>
          <span className="current">Add New</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add User</h1>
            <p className="page-subtitle">Create a new coach or student account.</p>
          </div>
          <Link href="/admin/users" className="btn btn--secondary">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>

        <div className="card" style={{ maxWidth: 800 }}>
          <div className="card-header">
            <div className="card-title">User Details</div>
          </div>
          <div className="card-body">
            <UserForm 
              batches={batches ?? []} 
              slots={slots ?? []} 
            />
          </div>
        </div>
      </div>
    </>
  )
}
