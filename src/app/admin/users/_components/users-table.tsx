'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteUserAction } from '../../actions'
import { Search, Pencil, Trash2 } from 'lucide-react'

interface UserRow {
  id: string
  auth_id: string
  name: string
  phone: string
  role: string
  batch_id: string | null
  time_slot_id: string | null
  batch_name: string
  slot_label: string
  join_date: string
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState('all')
  const [pending, startTrans]   = useTransition()
  const [deletingId, setDel]    = useState<string | null>(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  function handleDelete(userId: string, authId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setDel(userId)
    startTrans(async () => {
      await deleteUserAction(userId, authId)
      setDel(null)
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="card-header">
        <div className="filters-bar">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="search"
              className="search-input"
              placeholder="Search by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="user-search"
            />
          </div>
          <select
            className="filter-select"
            value={roleFilter}
            onChange={e => setRole(e.target.value)}
            id="user-role-filter"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="coach">Coach</option>
            <option value="student">Student</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--a-text-muted)', flexShrink: 0 }}>
          {filtered.length} of {users.length}
        </span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table" aria-label="Users">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Batch</th>
              <th>Time Slot</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td className="muted">{u.phone}</td>
                <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                <td className="muted">{u.batch_name}</td>
                <td className="muted">{u.slot_label}</td>
                <td className="muted">
                  {new Date(u.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <div className="actions-cell">
                    <Link
                      href={`/admin/users/${u.id}/edit`}
                      className="btn btn--ghost btn--icon-sm"
                      title="Edit user"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      className="btn btn--ghost btn--icon-sm"
                      style={{ color: 'var(--a-danger)' }}
                      title="Delete user"
                      onClick={() => handleDelete(u.id, u.auth_id)}
                      disabled={pending && deletingId === u.id}
                      aria-label={`Delete ${u.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span className="empty-state-icon">🔍</span>
                    <p>No users match your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
