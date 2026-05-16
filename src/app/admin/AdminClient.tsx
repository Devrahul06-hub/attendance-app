'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users, CheckCircle2, XCircle, FileSpreadsheet, Download,
  Search, ImageIcon, Filter,
} from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface HrUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  createdAt: string;
}
interface Record {
  _id: string;
  employeeName: string;
  phone?: string;
  date: string;
  inTime?: string;
  outTime?: string;
  status: 'present' | 'absent' | 'half-day';
  remarks?: string;
  inPhoto?: string;
  outPhoto?: string;
  markedByHrId: string;
  markedByHrName: string;
  markedByHrEmail: string;
}
interface EmpRecord {
  _id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  district?: string;
  taluka?: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  addedByHrId: string;
  addedByHrName: string;
}

interface Stats {
  totalUsers: number;
  presentToday: number;
  absentToday: number;
  totalRecords: number;
  todayDate: string;
}

export function AdminClient() {
  const [tab, setTab] = useState<'records' | 'users' | 'employees'>('records');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<HrUser[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [employees, setEmployees] = useState<EmpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Attendance filters
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [filterHrId, setFilterHrId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'half-day'>('all');
  const [search, setSearch] = useState('');

  // Employee list filters
  const [empFilterHrId, setEmpFilterHrId] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  async function fetchAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterHrId) params.set('hrId', filterHrId);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (search) params.set('search', search);

      const [statsRes, usersRes, recordsRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch(`/api/admin/records?${params.toString()}`).then((r) => r.json()),
      ]);

      setStats(statsRes);
      setUsers(usersRes.users || []);
      setRecords(recordsRes.records || []);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  function applyFilters() { fetchAll(); }
  function resetFilters() {
    setFilterDate(''); setFilterHrId(''); setFilterStatus('all'); setSearch('');
    setTimeout(fetchAll, 0);
  }

  async function fetchEmployees(hrId?: string) {
    setEmpLoading(true);
    try {
      const params = new URLSearchParams();
      if (hrId) params.set('hrId', hrId);
      const res = await fetch(`/api/employees?${params.toString()}`).then((r) => r.json());
      setEmployees(res.employees || []);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setEmpLoading(false);
    }
  }

  function applyEmpFilter() { fetchEmployees(empFilterHrId); }
  function resetEmpFilter() {
    setEmpFilterHrId(''); setEmpSearch('');
    setTimeout(() => fetchEmployees(), 0);
  }

  async function exportExcel(hrId?: string) {
    setExporting(true);
    const toastId = toast.loading('Preparing Excel file…');
    try {
      const params = new URLSearchParams();
      if (hrId) params.set('hrId', hrId);
      if (filterDate) params.set('date', filterDate);

      const res = await fetch(`/api/admin/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Excel file downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed. Try again.', { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-600">
        <Spinner size={32} />
      </div>
    );
  }

  const hrUsers = users.filter((u) => u.role === 'employee');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor attendance records and filter by HR.
          </p>
        </div>
        <button onClick={() => exportExcel()} className="btn-success" disabled={exporting}>
          {exporting ? <Spinner size={16} /> : <FileSpreadsheet size={16} />}
          {exporting ? 'Preparing…' : 'Export all to Excel'}
        </button>
      </div>


      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <TabButton active={tab === 'records'} onClick={() => setTab('records')}>
          Attendance Records ({records.length})
        </TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          HR Users ({hrUsers.length})
        </TabButton>
        <TabButton active={tab === 'employees'} onClick={() => { setTab('employees'); if (!employees.length) fetchEmployees(); }}>
          Employee List ({employees.length})
        </TabButton>
      </div>

      {/* Records tab */}
      {tab === 'records' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="label text-xs">Date</label>
                <input
                  type="date" className="input py-2 text-sm"
                  value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Status</label>
                <select
                  className="input py-2 text-sm"
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="half-day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Search Employee</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9 py-2 text-sm"
                    placeholder="Employee name..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs">Filter by HR</label>
                <select
                  className="input py-2 text-sm"
                  value={filterHrId} onChange={(e) => setFilterHrId(e.target.value)}
                >
                  <option value="">All HR</option>
                  {hrUsers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={applyFilters} className="btn-primary py-2 text-sm flex-1">Apply</button>
                <button onClick={resetFilters} className="btn-secondary py-2 text-sm">Reset</button>
              </div>
            </div>
          </div>

          {/* Records table */}
          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><Spinner size={32} /></div>
            ) : records.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm">No records match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left">Employee</th>
                      <th className="px-5 py-3 text-left">Phone</th>
                      <th className="px-5 py-3 text-left">Marked by (HR)</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">IN Time</th>
                      <th className="px-5 py-3 text-left">OUT Time</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Remarks</th>
                      <th className="px-5 py-3 text-left">IN Photo</th>
                      <th className="px-5 py-3 text-left">OUT Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {records.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium">{r.employeeName}</td>
                        <td className="px-5 py-3 text-gray-600">{r.phone || <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium">{r.markedByHrName}</div>
                          <div className="text-xs text-gray-500">{r.markedByHrEmail}</div>
                        </td>
                        <td className="px-5 py-3 font-medium whitespace-nowrap">{r.date}</td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{r.inTime || <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{r.outTime || <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3">
                          <span className={
                            r.status === 'present' ? 'badge-present' :
                            r.status === 'absent' ? 'badge-absent' : 'badge-halfday'
                          }>
                            {r.status === 'half-day' ? 'Half Day' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                          {r.remarks || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {r.inPhoto ? (
                            <a href={r.inPhoto} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1">
                              <ImageIcon size={14} /> View
                            </a>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {r.outPhoto ? (
                            <a href={r.outPhoto} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1">
                              <ImageIcon size={14} /> View
                            </a>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Employee List tab */}
      {tab === 'employees' && (
        <>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">Filter by HR</label>
                <select
                  className="input py-2 text-sm"
                  value={empFilterHrId} onChange={(e) => setEmpFilterHrId(e.target.value)}
                >
                  <option value="">All HR</option>
                  {hrUsers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Search Employee</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9 py-2 text-sm"
                    placeholder="Name, phone or ID..."
                    value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={applyEmpFilter} className="btn-primary py-2 text-sm flex-1">Apply</button>
                <button onClick={resetEmpFilter} className="btn-secondary py-2 text-sm">Reset</button>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            {empLoading ? (
              <div className="py-20 flex justify-center"><Spinner size={32} /></div>
            ) : (() => {
              const filtered = employees.filter((e) =>
                !empSearch ||
                e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                (e.phone || '').includes(empSearch) ||
                (e.employeeId || '').toLowerCase().includes(empSearch.toLowerCase())
              );
              return filtered.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm">No employees found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-left">Sr No</th>
                        <th className="px-5 py-3 text-left">Emp ID</th>
                        <th className="px-5 py-3 text-left">Name</th>
                        <th className="px-5 py-3 text-left">Designation</th>
                        <th className="px-5 py-3 text-left">District</th>
                        <th className="px-5 py-3 text-left">Taluka</th>
                        <th className="px-5 py-3 text-left">Phone</th>
                        <th className="px-5 py-3 text-left">Email</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Added by (HR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filtered.map((e, i) => (
                        <tr key={e._id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                          <td className="px-5 py-3 font-medium text-blue-600">{e.employeeId || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3 font-medium">{e.name}</td>
                          <td className="px-5 py-3 text-gray-600">{e.designation || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3 text-gray-600">{e.district || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3 text-gray-600">{e.taluka || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3 text-gray-600">{e.phone}</td>
                          <td className="px-5 py-3 text-gray-600">{e.email || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              e.status === 'active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {e.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{e.addedByHrName || <span className="text-gray-300">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* HR Users tab */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          {hrUsers.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No HR users yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {hrUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium">{u.name}</td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => exportExcel(u._id)} className="btn-secondary py-1.5 text-xs" disabled={exporting}>
                          {exporting ? <Spinner size={14} /> : <Download size={14} />} Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number; color: 'brand' | 'emerald' | 'red' | 'violet' }) {
  const map = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${map[color]}`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
        active ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}
