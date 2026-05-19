'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldPlus, Pencil, Trash2, X } from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface HR {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  designation?: string;
  phone?: string;
  salary?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  createdAt: string;
}

const emptyForm = {
  name: '', email: '', password: '', employeeId: '',
  designation: '', phone: '', salary: '', status: 'active', joinDate: '',
};

export function CreateHrClient() {
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [hrs, setHrs] = useState<HR[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [editTarget, setEditTarget] = useState<HR | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadHrs() {
    setLoadingList(true);
    const res = await fetch('/api/admin/create-hr').then((r) => r.json());
    setHrs(res.hrs || []);
    setLoadingList(false);
  }

  useEffect(() => { loadHrs(); }, []);

  function field(key: string, value: string, setter: (v: typeof emptyForm) => void, prev: typeof emptyForm) {
    setter({ ...prev, [key]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/create-hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`HR account created for ${form.name}`);
      setForm({ ...emptyForm });
      await loadHrs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(hr: HR) {
    setEditTarget(hr);
    setEditForm({
      name: hr.name,
      email: hr.email,
      password: '',
      employeeId: hr.employeeId || '',
      designation: hr.designation || '',
      phone: hr.phone || '',
      salary: hr.salary || '',
      status: hr.status,
      joinDate: hr.joinDate || '',
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/create-hr/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('HR updated');
      setEditTarget(null);
      await loadHrs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete HR "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/create-hr/${id}`, { method: 'DELETE' });
      toast.success('HR deleted');
      await loadHrs();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldPlus size={22} className="text-blue-600" /> Create HR Account
        </h1>
        <p className="text-gray-500 text-sm mt-1">Create new HR logins that can mark employee attendance.</p>
      </div>

      {/* Create Form */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft p-6">
        <h2 className="font-semibold mb-4 text-sm text-gray-700 uppercase tracking-wide">New HR Account</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Priya Sharma" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" className="input" placeholder="hr@company.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password <span className="text-red-500">*</span></label>
            <input type="password" className="input" placeholder="Min 6 characters" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="label">Employee ID</label>
            <input className="input" placeholder="e.g. HR001" value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" placeholder="e.g. HR Manager" value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. 9876543210" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
              maxLength={10} required />
          </div>
          <div>
            <label className="label">Salary</label>
            <input className="input" placeholder="e.g. 25000" value={form.salary}
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
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner size={18} /> : 'Create HR Account'}
            </button>
          </div>
        </form>
      </div>

      {/* HR List */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">All HR Accounts ({hrs.length})</h2>
        </div>
        {loadingList ? (
          <div className="py-10 flex justify-center"><Spinner size={28} /></div>
        ) : hrs.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">No HR accounts created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Sr No</th>
                  <th className="px-4 py-3 text-left">Emp ID</th>
                  <th className="px-4 py-3 text-left">Emp Name</th>
                  <th className="px-4 py-3 text-left">Designation</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Salary</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Join Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {hrs.map((hr, i) => (
                  <tr key={hr._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{hr.employeeId || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 font-medium">{hr.name}</td>
                    <td className="px-4 py-3 text-gray-600">{hr.designation || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{hr.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{hr.salary || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{hr.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        hr.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {hr.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {hr.joinDate ? new Date(hr.joinDate).toLocaleDateString('en-IN') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(hr)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(hr._id, hr.name)}
                          disabled={deletingId === hr._id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                          {deletingId === hr._id ? <Spinner size={15} /> : <Trash2 size={15} />}
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
              <h3 className="font-semibold text-lg">Edit HR — {editTarget.name}</h3>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input" value={editForm.name} required
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input type="email" className="input" value={editForm.email} required
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Employee ID</label>
                <input className="input" value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })} />
              </div>
              <div>
                <label className="label">Designation</label>
                <input className="input" value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
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
