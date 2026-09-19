'use client'

import { useState, useTransition } from 'react'
import { updateFeeStatusAction } from '../../actions'
import { Search } from 'lucide-react'

type Fee = {
  id: string
  student_id: string
  student_name: string
  student_phone: string
  amount: number
  due_date: string
  status: string
  last_marked_date: string | null
}

export function FeesTable({ fees }: { fees: Fee[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('all')
  
  const [pending, startTrans] = useTransition()
  const [actingId, setActingId] = useState<string | null>(null)

  const filtered = fees.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || f.student_name.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleStatusChange = (id: string, newStatus: 'paid' | 'not_paid' | 'pending') => {
    setActingId(id)
    startTrans(async () => {
      await updateFeeStatusAction(id, newStatus)
      setActingId(null)
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
              placeholder="Search student…" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="not_paid">Not Paid</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table" aria-label="Fees">
          <thead>
            <tr>
              <th>Student</th>
              <th>Fee Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{f.student_name}</div>
                  <div className="muted">{f.student_phone}</div>
                </td>
                <td>
                  <div className="fee-amount">₹{f.amount.toLocaleString('en-IN')}</div>
                </td>
                <td className="muted">{new Date(f.due_date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge badge--${f.status}`}>
                    {f.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="muted">
                  {f.last_marked_date ? new Date(f.last_marked_date).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div className="actions-cell">
                    <select
                      className="field-select"
                      style={{ padding: '0.35rem 2rem 0.35rem 0.75rem', fontSize: '0.75rem' }}
                      value={f.status}
                      onChange={e => handleStatusChange(f.id, e.target.value as any)}
                      disabled={pending && actingId === f.id}
                    >
                      <option value="pending">Mark Pending</option>
                      <option value="paid">Mark Paid</option>
                      <option value="not_paid">Mark Not Paid</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <span className="empty-state-icon">💳</span>
                    <p>No fee records found.</p>
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
