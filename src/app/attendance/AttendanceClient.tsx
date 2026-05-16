'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import { EmployeeCalendarModal } from '@/components/EmployeeCalendarModal';

interface Employee {
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
}

export function AttendanceClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [calendarEmployee, setCalendarEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.phone || '').includes(search) ||
    (e.employeeId || '').toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="font-semibold text-lg">Employee List ({employees.length})</h2>
          <a href="/create-employee" className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
            <UserPlus size={15} /> Create Employee
          </a>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 py-1.5 text-sm"
              placeholder="Search by name, phone or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  <th className="px-4 py-3 text-left">Sr No</th>
                  <th className="px-4 py-3 text-left">Emp ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Designation</th>
                  <th className="px-4 py-3 text-left">District</th>
                  <th className="px-4 py-3 text-left">Taluka</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((emp, i) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{emp.employeeId || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 font-medium">
                      <button onClick={() => setCalendarEmployee(emp)}
                        className="text-blue-600 hover:underline text-left">{emp.name}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.district || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.taluka || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.email || <span className="text-gray-300">—</span>}</td>
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
