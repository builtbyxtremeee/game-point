import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save } from 'lucide-react'
import { UserForm } from '../../new/_components/user-form'

export const metadata = { title: 'Edit User — Admin | GamePoint' }

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const [
    { data: user },
    { data: batches },
    { data: slots }
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', id).single(),
    supabase.from('batches').select('id, name'),
    supabase.from('time_slots').select('id, label, batch_id')
  ])

  if (!user) notFound()

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span>Admin</span>
          <span className="sep">/</span>
          <Link href="/admin/users" style={{ color: 'inherit', textDecoration: 'none' }}>Users</Link>
          <span className="sep">/</span>
          <span className="current">Edit User</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Edit User</h1>
            <p className="page-subtitle">Update account details for {user.name}.</p>
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
              initialData={user}
              batches={batches ?? []} 
              slots={slots ?? []} 
            />
          </div>
        </div>
      </div>
    </>
  )
}
