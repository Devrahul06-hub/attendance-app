'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Camera, Upload, X, CheckCircle2, XCircle, Search, ImageIcon, UserCheck,
} from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface AttendanceRecord {
  _id: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'present' | 'absent';
  remarks?: string;
  imageUrl?: string;
}

export function AttendanceClient() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [employeeName, setEmployeeName] = useState('');
  const [status, setStatus] = useState<'present' | 'absent'>('present');
  const [remarks, setRemarks] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters for history
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function loadRecords() {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance').then((r) => r.json());
      setRecords(res.records || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRecords(); }, []);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeName.trim()) {
      toast.error('Employee name is required');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error || 'Image upload failed');
        imageUrl = upData.imageUrl;
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName, status, remarks, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark attendance');

      toast.success(`Attendance marked for ${employeeName}`);
      setEmployeeName('');
      setRemarks('');
      setStatus('present');
      clearImage();
      await loadRecords();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = records.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      !search ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search) ||
      (r.remarks && r.remarks.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-600">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">HR Panel</h1>
        <p className="text-gray-500 text-sm mt-1">
          Mark attendance for employees and review your submission history.
        </p>
      </div>

      {/* Mark attendance form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <UserCheck size={18} className="text-brand-600" /> Mark attendance
        </h2>

        {/* Employee Name */}
        <div>
          <label className="label" htmlFor="employeeName">Employee Name <span className="text-red-500">*</span></label>
          <input
            id="employeeName"
            className="input"
            placeholder="Enter employee full name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            required
          />
        </div>

        {/* Status toggle */}
        <div>
          <label className="label">Status</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('present')}
              className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                status === 'present'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-[var(--border)] bg-white hover:border-gray-300'
              }`}
            >
              <CheckCircle2
                className={status === 'present' ? 'text-emerald-600' : 'text-gray-400'}
                size={22}
              />
              <div className="text-left">
                <div className="font-medium">Present</div>
                <div className="text-xs text-gray-500">Employee is present</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStatus('absent')}
              className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                status === 'absent'
                  ? 'border-red-500 bg-red-50'
                  : 'border-[var(--border)] bg-white hover:border-gray-300'
              }`}
            >
              <XCircle
                className={status === 'absent' ? 'text-red-600' : 'text-gray-400'}
                size={22}
              />
              <div className="text-left">
                <div className="font-medium">Absent</div>
                <div className="text-xs text-gray-500">Employee is absent</div>
              </div>
            </button>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="label" htmlFor="remarks">Remarks (optional)</label>
          <textarea
            id="remarks"
            className="input min-h-[80px] resize-none"
            placeholder="e.g. On leave, working from client site, etc."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            maxLength={300}
          />
        </div>

        {/* Photo */}
        <div>
          <label className="label">Photo (optional, JPG/PNG)</label>
          {imagePreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-[var(--border)]"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                <Upload size={16} /> Upload photo
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-secondary"
              >
                <Camera size={16} /> Take photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
          {submitting ? <Spinner size={18} /> : 'Submit attendance'}
        </button>
      </form>

      {/* Submission history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h2 className="font-semibold">Your submissions</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 py-2 text-sm w-52"
                placeholder="Search employee or date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input py-2 text-sm w-32"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No records match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Employee</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Time</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Remarks</th>
                  <th className="px-5 py-3 text-left">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium">{r.employeeName}</td>
                    <td className="px-5 py-3 font-medium">{r.date}</td>
                    <td className="px-5 py-3 text-gray-600">{r.time}</td>
                    <td className="px-5 py-3">
                      <span className={r.status === 'present' ? 'badge-present' : 'badge-absent'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                      {r.remarks || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {r.imageUrl ? (
                        <a
                          href={r.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ImageIcon size={14} /> View
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
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
