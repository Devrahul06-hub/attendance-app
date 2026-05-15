'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface Employee {
  _id: string;
  name: string;
  employeeId: string;
  project?: string;
  phone?: string;
  addedByHrName: string;
  createdAt: string;
}

export function CreateEmployeeClient() {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [project, setProject] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  async function loadEmployees() {
    setLoadingList(true);
    const res = await fetch('/api/employees').then((r) => r.json());
    setEmployees(res.employees || []);
    setLoadingList(false);
  }

  useEffect(() => { loadEmployees(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, employeeId, project, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Employee ${name} created!`);
      setName(''); setEmployeeId(''); setProject(''); setPhone('');
      await loadEmployees();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus size={22} className="text-blue-600" /> Create Employee
        </h1>
        <p className="text-gray-500 text-sm mt-1">Add new employees to the system.</p>
      </div>

      {/* Form */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Employee Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Rohit Kumar" value={name}
              onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Employee ID <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. EMP001" value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)} required />
          </div>
          <div>
            <label className="label">Project / Department</label>
            <input className="input" placeholder="e.g. Pune Survey Project" value={project}
              onChange={(e) => setProject(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" placeholder="e.g. 9876543210" value={phone}
              onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner size={18} /> : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>

      {/* Employee List */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">All Employees ({employees.length})</h2>
        </div>
        {loadingList ? (
          <div className="py-10 flex justify-center"><Spinner size={28} /></div>
        ) : employees.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">No employees added yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Employee ID</th>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Project</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Added By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-blue-600">{emp.employeeId}</td>
                    <td className="px-5 py-3 font-medium">{emp.name}</td>
                    <td className="px-5 py-3 text-gray-600">{emp.project || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-600">{emp.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-600">{emp.addedByHrName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
