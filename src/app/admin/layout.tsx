import './admin.css'
import type { ReactNode } from 'react'
import type { Metadata }  from 'next'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { SidebarNav }     from './_components/sidebar-nav'

export const metadata: Metadata = {
  title: 'Admin Dashboard — GamePoint',
  description: 'Full administrative control over users, batches, attendance, fees, and leave days.',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  return (
    <div className="admin-root">
      {/* Ambient background orbs */}
      <div className="admin-orbs" aria-hidden="true">
        <div className="admin-orb admin-orb-1" />
        <div className="admin-orb admin-orb-2" />
      </div>

      {/* Sidebar */}
      <aside className="admin-sidebar" aria-label="Sidebar">
        <SidebarNav userName={profile.name} />
      </aside>

      {/* Main */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
