'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, X } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import { assemblyData, assemblyDistricts } from '@/data/assembly';

interface Employee {
  _id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  district?: string;
  assembly?: string;
  phone?: string;
  email?: string;
  vendorName?: string;
  salary?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  addedByHrName: string;
  createdAt: string;
}

interface HrUser {
  _id: string;
  name: string;
  email: string;
}

const emptyForm = {
  name: '', employeeId: '', designation: '', district: '', assembly: '',
  phone: '', email: '', vendorName: '', salary: '', status: 'active', joinDate: '',
};

export function CreateEmployeeClient({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  const [form, setForm] = useState({ ...emptyForm });
  const [assignToHrId, setAssignToHrId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrUsers, setHrUsers] = useState<HrUser[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadEmployees() {
    setLoadingList(true);
    const res = await fetch('/api/employees').then((r) => r.json());
    setEmployees(res.employees || []);
    setLoadingList(false);
  }

  useEffect(() => {
    loadEmployees();
    if (isAdmin) {
      fetch('/api/admin/users')
        .then((r) => r.json())
        .then((d) => setHrUsers((d.users || []).filter((u: any) => u.role === 'employee')));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...(isAdmin && assignToHrId ? { assignToHrId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Employee ${form.name} created!`);
      setForm({ ...emptyForm });
      setAssignToHrId('');
      await loadEmployees();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp);
    setEditForm({
      name: emp.name,
      employeeId: emp.employeeId || '',
      designation: emp.designation || '',
      district: emp.district || '',
      assembly: emp.assembly || '',
      phone: emp.phone || '',
      email: emp.email || '',
      vendorName: emp.vendorName || '',
      salary: emp.salary || '',
      status: emp.status,
      joinDate: emp.joinDate || '',
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Employee updated');
      setEditTarget(null);
      await loadEmployees();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      toast.success('Employee deleted');
      await loadEmployees();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus size={22} className="text-blue-600" /> Create Employee
        </h1>
        <p className="text-gray-500 text-sm mt-1">Add new employees to the system.</p>
      </div>

      {/* Create Form */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft p-6">
        <h2 className="font-semibold mb-4 text-sm text-gray-700 uppercase tracking-wide">New Employee</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Employee Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Rohit Kumar" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Employee ID</label>
            <input className="input" placeholder="e.g. EMP001" value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          </div>
          <div>
            <label className="label">Vendor Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. ABC Vendors" value={form.vendorName}
              onChange={(e) => setForm({ ...form, vendorName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" placeholder="e.g. Site Supervisor" value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <label className="label">District</label>
            <select className="input" value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value, assembly: '' })}>
              <option value="">Select District</option>
              {assemblyDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assembly</label>
            <select className="input" value={form.assembly}
              onChange={(e) => setForm({ ...form, assembly: e.target.value })}
              disabled={!form.district}>
              <option value="">{form.district ? 'Select Assembly' : 'Select District first'}</option>
              {(assemblyData[form.district] || []).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. 9876543210" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
              maxLength={10} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="e.g. rohit@company.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Salary</label>
            <input className="input" placeholder="e.g. 15000" value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Join Date</label>
            <input type="date" className="input" value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
          </div>
          {isAdmin && (
            <div>
              <label className="label">Assign to HR</label>
              <select className="input" value={assignToHrId} onChange={(e) => setAssignToHrId(e.target.value)}>
                <option value="">— Self (Admin) —</option>
                {hrUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2 lg:col-span-3">
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
                {employees.map((emp, i) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{emp.employeeId || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.vendorName || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.district || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.assembly || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone || <span className="text-gray-300">—</span>}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(emp)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(emp._id, emp.name)}
                          disabled={deletingId === emp._id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                          {deletingId === emp._id ? <Spinner size={15} /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-lg">Edit Employee — {editTarget.name}</h3>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Employee Name <span className="text-red-500">*</span></label>
                <input className="input" value={editForm.name} required
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Employee ID</label>
                <input className="input" value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })} />
              </div>
              <div>
                <label className="label">Vendor Name <span className="text-red-500">*</span></label>
                <input className="input" value={editForm.vendorName} required
                  onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })} />
              </div>
              <div>
                <label className="label">Designation</label>
                <input className="input" value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
              </div>
              <div>
                <label className="label">District</label>
                <select className="input" value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value, assembly: '' })}>
                  <option value="">Select District</option>
                  {assemblyDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assembly</label>
                <select className="input" value={editForm.assembly}
                  onChange={(e) => setEditForm({ ...editForm, assembly: e.target.value })}
                  disabled={!editForm.district}>
                  <option value="">{editForm.district ? 'Select Assembly' : 'Select District first'}</option>
                  {(assemblyData[editForm.district] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone <span className="text-red-500">*</span></label>
                <input className="input" value={editForm.phone} required
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                  maxLength={10} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Salary</label>
                <input className="input" value={editForm.salary}
                  onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="label">Join Date</label>
                <input type="date" className="input" value={editForm.joinDate}
                  onChange={(e) => setEditForm({ ...editForm, joinDate: e.target.value })} />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Spinner size={18} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
