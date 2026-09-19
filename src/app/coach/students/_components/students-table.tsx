'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteStudentAction } from '../../actions'
import { Search, Pencil, Trash2 } from 'lucide-react'

interface UserRow {
  id: string
  auth_id: string
  name: string
  phone: string
  batch_id: string | null
  time_slot_id: string | null
  batch_name: string
  slot_label: string
  join_date: string
}

export function StudentsTable({ students }: { students: UserRow[] }) {
  const [search, setSearch]     = useState('')
  const [pending, startTrans]   = useTransition()
  const [deletingId, setDel]    = useState<string | null>(null)

  const filtered = students.filter(u => {
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.phone.includes(q)
  })

  function handleDelete(userId: string, authId: string) {
    if (!confirm('Delete this student? This cannot be undone.')) return
    setDel(userId)
    startTrans(async () => {
      await deleteStudentAction(userId, authId)
      setDel(null)
    })
  }

  return (
    <>
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
            />
          </div>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--a-text-muted)', flexShrink: 0 }}>
          {filtered.length} of {students.length}
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
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
                <td className="muted">{u.batch_name}</td>
                <td className="muted">{u.slot_label}</td>
                <td className="muted">
                  {new Date(u.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <div className="actions-cell">
                    <Link href={`/coach/students/${u.id}/edit`} className="btn btn--ghost btn--icon-sm" title="Edit">
                      <Pencil size={14} />
                    </Link>
                    <button
                      className="btn btn--ghost btn--icon-sm"
                      style={{ color: 'var(--a-danger)' }}
                      onClick={() => handleDelete(u.id, u.auth_id)}
                      disabled={pending && deletingId === u.id}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <span className="empty-state-icon">🔍</span>
                    <p>No students found.</p>
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
