export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'present' | 'absent';
  remarks: string;
  imageUrl?: string;
  markedByHrId: string;
  markedByHrName: string;
  markedByHrEmail: string;
}

// Hardcoded users for POC
const users: MockUser[] = [
  {
    id: '1', name: 'Admin User', email: 'admin@demo.com', password: 'admin123',
    role: 'admin', createdAt: new Date().toISOString(),
  },
  {
    id: '2', name: 'HR Priya', email: 'hr1@demo.com', password: 'hr123',
    role: 'employee', createdAt: new Date().toISOString(),
  },
  {
    id: '3', name: 'HR Rohan', email: 'hr2@demo.com', password: 'hr123',
    role: 'employee', createdAt: new Date().toISOString(),
  },
];

const attendance: AttendanceRecord[] = [];

// ── Users ──────────────────────────────────────────────────────────────────

export function findUserByEmail(email: string): MockUser | undefined {
  return users.find((u) => u.email === email.toLowerCase());
}

export function createUser(name: string, email: string, password: string): MockUser {
  const user: MockUser = {
    id: String(Date.now()),
    name,
    email: email.toLowerCase(),
    password,
    role: 'employee',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function getAllUsers(): MockUser[] {
  return users;
}

export function getHrUsers(): MockUser[] {
  return users.filter((u) => u.role === 'employee');
}

// ── Attendance ─────────────────────────────────────────────────────────────

export function createAttendance(data: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
  const record: AttendanceRecord = { id: String(Date.now() + Math.random()), ...data };
  attendance.push(record);
  return record;
}

export function getAttendanceByHr(hrId: string): AttendanceRecord[] {
  return [...attendance]
    .filter((r) => r.markedByHrId === hrId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

export function getAllAttendance(filters?: {
  date?: string;
  hrId?: string;
  status?: string;
  search?: string;
}): AttendanceRecord[] {
  let results = [...attendance];
  if (filters?.date) results = results.filter((r) => r.date === filters.date);
  if (filters?.hrId) results = results.filter((r) => r.markedByHrId === filters.hrId);
  if (filters?.status) results = results.filter((r) => r.status === filters.status);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter((r) => r.employeeName.toLowerCase().includes(s));
  }
  return results.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

export function countAttendance(date: string, status: 'present' | 'absent'): number {
  return attendance.filter((r) => r.date === date && r.status === status).length;
}
