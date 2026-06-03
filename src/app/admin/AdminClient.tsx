'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileSpreadsheet, Download, Search, ImageIcon, Filter, Trash2, X } from 'lucide-react';
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
  status: 'not-selected' | 'present' | 'half-day' | 'absent' | 'paid-leave';
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
  assembly?: string;
  phone: string;
  email?: string;
  status: 'training' | 'active' | 'backout';
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
  const [exportingEmps, setExportingEmps] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStart, setExportStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [exportEnd, setExportEnd] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Attendance filters
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [filterHrId, setFilterHrId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not-selected' | 'present' | 'half-day' | 'absent' | 'paid-leave'>('all');
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);
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

  async function deleteEmployee(id: string, name: string) {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    setDeletingEmpId(id);
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      toast.success('Employee deleted');
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingEmpId(null);
    }
  }

  async function exportEmployees() {
    setExportingEmps(true);
    const toastId = toast.loading('Preparing employee list…');
    try {
      const params = new URLSearchParams();
      if (empFilterHrId) params.set('hrId', empFilterHrId);
      const res = await fetch(`/api/admin/export-employees?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Employee list downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed. Try again.', { id: toastId });
    } finally {
      setExportingEmps(false);
    }
  }

  async function exportCombined() {
    if (!exportStart || !exportEnd) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (exportStart > exportEnd) {
      toast.error('Start date must be before end date.');
      return;
    }
    setExporting(true);
    setShowExportModal(false);
    const toastId = toast.loading('Preparing Excel report…');
    try {
      const params = new URLSearchParams({ startDate: exportStart, endDate: exportEnd });
      const res = await fetch(`/api/admin/export-combined?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${exportStart}-to-${exportEnd}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Excel report downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed. Try again.', { id: toastId });
    } finally {
      setExporting(false);
    }
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
        <button onClick={() => setShowExportModal(true)} className="btn-success" disabled={exporting}>
          {exporting ? <Spinner size={16} /> : <FileSpreadsheet size={16} />}
          {exporting ? 'Preparing…' : 'Export all to Excel'}
        </button>
      </div>

      {/* Date range export modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Export Attendance Report</h2>
              <button onClick={() => setShowExportModal(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Select a date range. The download will include 3 sheets: Muster Roll, Daily Report, and Staff Report.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label text-xs">From Date</label>
                <input
                  type="date"
                  className="input py-2 text-sm"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">To Date</label>
                <input
                  type="date"
                  className="input py-2 text-sm"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExportModal(false)} className="btn-secondary flex-1 py-2.5">
                Cancel
              </button>
              <button onClick={exportCombined} className="btn-success flex-1 py-2.5">
                <FileSpreadsheet size={16} />
                Download Excel
              </button>
            </div>
          </div>
        </div>
      )}


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
                  <option value="not-selected">Not Selected</option>
                  <option value="present">Present</option>
                  <option value="half-day">Half Day</option>
                  <option value="absent">Absent</option>
                  <option value="paid-leave">Weekly Off</option>
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
                            r.status === 'absent' ? 'badge-absent' :
                            r.status === 'half-day' ? 'badge-halfday' :
                            r.status === 'paid-leave' ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200' :
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200'
                          }>
                            {r.status === 'half-day' ? 'Half Day' : r.status === 'paid-leave' ? 'Weekly Off' : r.status === 'not-selected' ? 'Not Selected' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
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
                <button onClick={exportEmployees} disabled={exportingEmps} className="btn-success py-2 text-sm">
                  {exportingEmps ? <Spinner size={14} /> : <FileSpreadsheet size={14} />}
                  Export
                </button>
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
                        <th className="px-5 py-3 text-left">Assembly</th>
                        <th className="px-5 py-3 text-left">Phone</th>
                        <th className="px-5 py-3 text-left">Email</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Added by (HR)</th>
                        <th className="px-5 py-3 text-left">Action</th>
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
                          <td className="px-5 py-3 text-gray-600">{e.assembly || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3 text-gray-600">{e.phone}</td>
                          <td className="px-5 py-3 text-gray-600">{e.email || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              e.status === 'active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : e.status === 'training'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {e.status === 'active' ? 'Active' : e.status === 'training' ? 'Training in process' : 'Back-out'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{e.addedByHrName || <span className="text-gray-300">—</span>}</td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => deleteEmployee(e._id, e.name)}
                              disabled={deletingEmpId === e._id}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                              {deletingEmpId === e._id ? <Spinner size={15} /> : <Trash2 size={15} />}
                            </button>
                          </td>
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
