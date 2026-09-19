import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  Layers,
  ClipboardList,
  CreditCard,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch all counts in parallel
  const [
    { count: studentCount },
    { count: coachCount },
    { count: batchCount },
    { count: pendingFeeCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'coach'),
    supabase.from('batches').select('*', { count: 'exact', head: true }),
    supabase.from('fees').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    {
      label:   'Total Students',
      value:   studentCount ?? 0,
      icon:    Users,
      variant: 'primary' as const,
      href:    '/admin/users',
    },
    {
      label:   'Active Coaches',
      value:   coachCount ?? 0,
      icon:    TrendingUp,
      variant: 'success' as const,
      href:    '/admin/users',
    },
    {
      label:   'Batches',
      value:   batchCount ?? 0,
      icon:    Layers,
      variant: 'warning' as const,
      href:    '/admin/batches',
    },
    {
      label:   'Pending Fees',
      value:   pendingFeeCount ?? 0,
      icon:    AlertCircle,
      variant: 'danger' as const,
      href:    '/admin/fees',
    },
  ]

  // Recent users (last 5)
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, name, phone, role, join_date')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <>
      {/* Topbar */}
      <div className="admin-topbar">
        <div className="topbar-breadcrumb">
          <span className="current">Dashboard</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Welcome back — here's the academy at a glance.</p>
          </div>
          <Link href="/admin/users/new" className="btn btn--primary">
            <Users size={15} />
            Add User
          </Link>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          {stats.map(({ label, value, icon: Icon, variant, href }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div className={`stat-card stat-card--${variant}`}>
                <div className={`stat-icon stat-icon--${variant}`}>
                  <Icon size={20} />
                </div>
                <div className="stat-body">
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick-links row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
          {[
            { label: 'Mark Attendance', desc: 'Record today\'s attendance for any batch', href: '/admin/attendance', icon: ClipboardList, color: '#6366f1' },
            { label: 'Manage Leaves',   desc: 'Add or view court-wide & batch leave days', href: '/admin/leaves',     icon: AlertCircle,   color: '#a855f7' },
            { label: 'Fee Status',      desc: 'Review and update student fee records',       href: '/admin/fees',       icon: CreditCard,    color: '#10b981' },
          ].map(({ label, desc, href, icon: Icon, color }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1.25rem', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={15} style={{ color: 'var(--a-text-muted)' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--a-text)' }}>{label}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--a-text-2)', marginTop: '0.25rem' }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent users */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Users</div>
              <div className="card-subtitle">Last 5 accounts added to the system</div>
            </div>
            <Link href="/admin/users" className="btn btn--secondary btn--sm">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table" aria-label="Recent users">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers?.length ? recentUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td className="muted">{u.phone}</td>
                    <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                    <td className="muted">{new Date(u.join_date).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <span className="empty-state-icon">👤</span>
                        <p>No users yet — <Link href="/admin/users/new" style={{ color: 'var(--a-primary-lt)' }}>add the first one</Link></p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
