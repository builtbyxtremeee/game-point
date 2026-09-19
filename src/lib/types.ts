export interface User {
  id: string;
  auth_id: string;
  name: string;
  phone: string;
  role: 'admin' | 'coach' | 'student';
  batch_id: string | null;
  time_slot_id: string | null;
  join_date: string;
  created_by: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  name: string;
  coach_id: string;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  batch_id: string;
  label: string;
  days_of_week: number[];
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  batch_id: string;
  time_slot_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_by: string;
  edited_at: string | null;
  edited_by: string | null;
  created_at: string;
}

export interface LeaveDay {
  id: string;
  date: string;
  scope: 'court_wide' | 'batch' | 'time_slot';
  batch_id: string | null;
  time_slot_id: string | null;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'not_paid';
  marked_by: string | null;
  last_marked_date: string | null;
  reminder_sent_at: string | null;
  last_reminder_sent_at: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  student_id: string;
  type: string;
  message: string;
  sent_by: string;
  status: 'sent' | 'failed';
  whatsapp_sent?: boolean | null;
  sent_at: string;
}

