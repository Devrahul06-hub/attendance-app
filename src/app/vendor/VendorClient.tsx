'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Trash2, Pencil, X } from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface Vendor {
  _id: string;
  name: string;
  createdAt: string;
}

export function VendorClient() {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadVendors() {
    setLoading(true);
    const res = await fetch('/api/vendors').then((r) => r.json());
    setVendors(res.vendors || []);
    setLoading(false);
  }

  useEffect(() => { loadVendors(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Vendor "${name.trim()}" added`);
      setName('');
      await loadVendors();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Vendor updated');
      setEditTarget(null);
      await loadVendors();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, vendorName: string) {
    if (!confirm(`Delete vendor "${vendorName}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Vendor deleted');
      setVendors((prev) => prev.filter((v) => v._id !== id));
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Store size={22} className="text-blue-600" /> Vendors
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage vendor names used during employee creation.</p>
      </div>

      {/* Add form */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft p-6">
        <h2 className="font-semibold mb-4 text-sm text-gray-700 uppercase tracking-wide">Add Vendor</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="e.g. ABC Contractors"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary px-5" disabled={submitting}>
            {submitting ? <Spinner size={18} /> : 'Add'}
          </button>
        </form>
      </div>

      {/* Vendor list */}
      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">All Vendors ({vendors.length})</h2>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><Spinner size={28} /></div>
        ) : vendors.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">No vendors added yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Sr No</th>
                <th className="px-5 py-3 text-left">Vendor Name</th>
                <th className="px-5 py-3 text-left">Added On</th>
                <th className="px-5 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {vendors.map((v, i) => (
                <tr key={v._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 font-medium">{v.name}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(v.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditTarget(v); setEditName(v.name); }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id, v.name)}
                        disabled={deletingId === v._id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {deletingId === v._id ? <Spinner size={15} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-lg">Edit Vendor</h3>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="label">Vendor Name <span className="text-red-500">*</span></label>
                <input className="input" value={editName} required
                  onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3">
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
