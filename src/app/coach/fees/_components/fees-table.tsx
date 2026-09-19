'use client'

import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { toggleFeeStatusAction } from '../actions'

interface FeeRow {
  id: string
  student_id: string
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'not_paid'
  student_name: string
  student_phone: string
  batch_name: string
  slot_label: string
}

export function FeesTable({ initialFees }: { initialFees: FeeRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pending, startTrans] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = initialFees.filter(f => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      f.student_name.toLowerCase().includes(q) ||
      f.student_phone.includes(q)
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  function handleToggleStatus(feeId: string, studentId: string, currentStatus: string) {
    const newStatus = currentStatus === 'paid' ? 'not_paid' : 'paid'
    setUpdatingId(feeId)
    startTrans(async () => {
      await toggleFeeStatusAction(feeId, studentId, newStatus)
      setUpdatingId(null)
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
              placeholder="Search by student name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="fee-search"
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            id="fee-status-filter"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="not_paid">Not Paid</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--a-text-muted)', flexShrink: 0 }}>
          {filtered.length} of {initialFees.length}
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table" aria-label="Fees">
          <thead>
            <tr>
              <th>Student</th>
              <th>Phone</th>
              <th>Batch / Slot</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.student_name}</td>
                <td className="muted">{f.student_phone}</td>
                <td className="muted">{f.batch_name} - {f.slot_label}</td>
                <td style={{ fontWeight: 500 }}>₹{f.amount}</td>
                <td className="muted">
                  {new Date(f.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <span className={`badge badge--${f.status === 'paid' ? 'admin' : f.status === 'not_paid' ? 'student' : 'coach'}`}>
                    {f.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn ${f.status === 'paid' ? 'btn--outline' : 'btn--primary'} btn--sm`}
                    onClick={() => handleToggleStatus(f.id, f.student_id, f.status)}
                    disabled={pending && updatingId === f.id}
                  >
                    {pending && updatingId === f.id
                      ? 'Updating...'
                      : f.status === 'paid'
                      ? 'Mark Not Paid'
                      : 'Mark Paid'}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span className="empty-state-icon">💰</span>
                    <p>No fees match your filters.</p>
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
