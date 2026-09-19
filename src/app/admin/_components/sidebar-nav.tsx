'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { signOutAction } from '../actions'
import {
  LayoutDashboard,
  Users,
  Layers,
  ClipboardList,
  CalendarOff,
  CreditCard,
  LogOut,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/admin',            label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/admin/users',      label: 'Users',         icon: Users },
  { href: '/admin/batches',    label: 'Batches & Slots', icon: Layers },
  { href: '/admin/attendance', label: 'Attendance',    icon: ClipboardList },
  { href: '/admin/leaves',     label: 'Leave Days',    icon: CalendarOff },
  { href: '/admin/fees',       label: 'Fee Status',    icon: CreditCard },
]

interface SidebarNavProps {
  userName: string
}

export function SidebarNav({ userName }: SidebarNavProps) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <svg className="sidebar-logo-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="18" stroke="url(#sg)" strokeWidth="2.5" />
          <path d="M14 20 L20 13 L26 20 L20 27 Z" fill="url(#sg)" />
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span className="sidebar-brand-name">Game<span>Point</span></span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Admin navigation">
        <div className="nav-section">
          <span className="nav-section-label">Navigation</span>
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${isActive(href, exact) ? ' active' : ''}`}
              aria-current={isActive(href, exact) ? 'page' : undefined}
            >
              <Icon size={16} className="nav-link-icon" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer: user + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar" aria-hidden="true">{initials || 'A'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>
        <form action={() => startTransition(() => signOutAction())}>
          <button
            type="submit"
            className="sidebar-logout-btn"
            disabled={pending}
            aria-label="Sign out"
          >
            <LogOut size={14} />
            {pending ? 'Signing out…' : 'Sign Out'}
          </button>
        </form>
      </div>
    </>
  )
}
