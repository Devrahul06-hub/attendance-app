'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Search, FileSpreadsheet, Filter, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import { EmployeeCalendarModal } from '@/components/EmployeeCalendarModal';
import toast from 'react-hot-toast';

interface Employee {
  _id: string;
  name: string;
  employeeId?: string;
  vendorName?: string;
  designation?: string;
  district?: string;
  assembly?: string;
  phone: string;
  email?: string;
  salary?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
}

interface HrUser {
  _id: string;
  name: string;
  email: string;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AttendanceClient({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrUsers, setHrUsers] = useState<HrUser[]>([]);
  const [filterHrId, setFilterHrId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [calendarEmployee, setCalendarEmployee] = useState<Employee | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function fetchEmployees(hrId?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (hrId) params.set('hrId', hrId);
    fetch(`/api/employees?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmployees();
    if (isAdmin) {
      fetch('/api/admin/users')
        .then((r) => r.json())
        .then((d) => setHrUsers((d.users || []).filter((u: any) => u.role === 'employee')));
    }
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.phone || '').includes(search) ||
    (e.employeeId || '').toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e._id));
  const someSelected = filtered.some((e) => selected.has(e._id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((e) => next.delete(e._id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((e) => next.add(e._id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function exportAttendance() {
    const selectedEmployees = employees.filter((e) => selected.has(e._id));
    if (!selectedEmployees.length) { toast.error('Select at least one employee'); return; }

    setExporting(true);
    const toastId = toast.loading('Preparing Excel…');
    try {
      const phones = selectedEmployees.map((e) => e.phone);
      const res = await fetch('/api/attendance/export-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${todayStr()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Employee deleted');
      setEmployees((prev) => prev.filter((e) => e._id !== id));
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Tracker</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your registered employees</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft">
        {/* Header */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Employee List ({employees.length})</h2>
            {someSelected && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {selected.size} selected
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportAttendance}
              disabled={exporting || !someSelected}
              className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
              {exporting ? <Spinner size={15} /> : <FileSpreadsheet size={15} />}
              Export Attendance
            </button>
            <a href="/create-employee" className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
              <UserPlus size={15} /> Create Employee
            </a>
          </div>
        </div>

        {/* Search + HR filter */}
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 py-1.5 text-sm"
                placeholder="Search by name, phone or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <select
                  className="input py-1.5 text-sm min-w-[160px]"
                  value={filterHrId}
                  onChange={(e) => {
                    setFilterHrId(e.target.value);
                    setSelected(new Set());
                    fetchEmployees(e.target.value);
                  }}
                >
                  <option value="">All HR</option>
                  {hrUsers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex justify-center"><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            {employees.length === 0 ? 'No employees added yet.' : 'No results found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Sr No</th>
                  <th className="px-4 py-3 text-left">Emp ID</th>
                  <th className="px-4 py-3 text-left">Emp Name</th>
                  <th className="px-4 py-3 text-left">Vendor Name</th>
                  <th className="px-4 py-3 text-left">Designation</th>
                  <th className="px-4 py-3 text-left">District</th>
                  <th className="px-4 py-3 text-left">Assembly</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Salary</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Join Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((emp, i) => (
                  <tr key={emp._id}
                    className={`hover:bg-gray-50/50 cursor-pointer ${selected.has(emp._id) ? 'bg-blue-50/40' : ''}`}
                    onClick={() => toggleOne(emp._id)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(emp._id)}
                        onChange={() => toggleOne(emp._id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{emp.employeeId || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 font-medium" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setCalendarEmployee(emp)}
                        className="text-blue-600 hover:underline text-left">{emp.name}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.vendorName || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.district || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.assembly || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.email || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.salary || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        emp.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(emp._id, emp.name)}
                        disabled={deletingId === emp._id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {deletingId === emp._id ? <Spinner size={15} /> : <Trash2 size={15} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {calendarEmployee && (
      <EmployeeCalendarModal
        employee={calendarEmployee}
        onClose={() => setCalendarEmployee(null)}
      />
    )}
    </>
  );
}
