'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, FileSpreadsheet, Search, Pencil, Trash2, X, Upload } from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface AttendanceRecord {
  _id: string;
  employeeName: string;
  phone: string;
  project?: string;
  date: string;
  inTime?: string;
  outTime?: string;
  status: 'present' | 'absent' | 'half-day';
  remarks?: string;
  inPhoto?: string;
  outPhoto?: string;
  markedByHrId: string;
  markedByHrName: string;
}

const EMPTY_FORM = {
  employeeName: '',
  phone: '',
  project: '',
  date: '',
  inTime: '',
  outTime: '',
  status: 'present' as 'present' | 'absent' | 'half-day',
  remarks: '',
  inPhoto: '',
  outPhoto: '',
};

const PER_PAGE = 5;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function driveThumbnail(url: string) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w80-h80` : url;
}

export function AttendanceClient() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [inPhotoFile, setInPhotoFile] = useState<File | null>(null);
  const [outPhotoFile, setOutPhotoFile] = useState<File | null>(null);
  const [inPhotoPreview, setInPhotoPreview] = useState('');
  const [outPhotoPreview, setOutPhotoPreview] = useState('');

  const inPhotoRef = useRef<HTMLInputElement>(null);
  const outPhotoRef = useRef<HTMLInputElement>(null);

  async function loadRecords() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterDate) p.set('date', filterDate);
      if (filterProject) p.set('project', filterProject);
      if (filterStatus !== 'all') p.set('status', filterStatus);
      if (search) p.set('search', search);
      const res = await fetch(`/api/attendance?${p}`).then((r) => r.json());
      setRecords(res.records || []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRecords(); }, []); // eslint-disable-line

  function openAdd() {
    setForm({ ...EMPTY_FORM, date: todayStr() });
    setInPhotoFile(null); setOutPhotoFile(null);
    setInPhotoPreview(''); setOutPhotoPreview('');
    setEditRecord(null);
    setShowModal(true);
  }

  function openEdit(r: AttendanceRecord) {
    setForm({
      employeeName: r.employeeName,
      phone: r.phone || '',
      project: r.project || '',
      date: r.date,
      inTime: r.inTime || '',
      outTime: r.outTime || '',
      status: r.status,
      remarks: r.remarks || '',
      inPhoto: r.inPhoto || '',
      outPhoto: r.outPhoto || '',
    });
    setInPhotoFile(null); setOutPhotoFile(null);
    setInPhotoPreview(''); setOutPhotoPreview('');
    setEditRecord(r);
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditRecord(null); }

  function handlePhotoFile(file: File | undefined, type: 'in' | 'out') {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) { toast.error('Only JPG/PNG'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    const preview = URL.createObjectURL(file);
    if (type === 'in') { setInPhotoFile(file); setInPhotoPreview(preview); }
    else { setOutPhotoFile(file); setOutPhotoPreview(preview); }
  }

  async function uploadPhoto(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.imageUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeName.trim()) { toast.error('Employee name required'); return; }
    if (!form.phone.trim()) { toast.error('Mobile number required'); return; }
    if (!/^\d{10}$/.test(form.phone.trim())) { toast.error('Enter a valid 10-digit mobile number'); return; }
    setSubmitting(true);
    try {
      let inPhoto = form.inPhoto;
      let outPhoto = form.outPhoto;
      if (inPhotoFile) inPhoto = await uploadPhoto(inPhotoFile);
      if (outPhotoFile) outPhoto = await uploadPhoto(outPhotoFile);

      const body = { ...form, inPhoto, outPhoto };
      const url = editRecord ? `/api/attendance/${editRecord._id}` : '/api/attendance';
      const method = editRecord ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast.success(editRecord ? 'Record updated!' : 'Attendance added!');
      closeModal();
      await loadRecords();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this attendance record?')) return;
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Record deleted');
      await loadRecords();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function exportExcel() {
    setExporting(true);
    const toastId = toast.loading('Preparing Excel…');
    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `attendance-${todayStr()}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  const projects = Array.from(new Set(records.map((r) => r.project).filter(Boolean)));
  const totalPages = Math.ceil(records.length / PER_PAGE);
  const paginated = records.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function StatusBadge({ status }: { status: string }) {
    if (status === 'present') return <span className="badge-present capitalize">Present</span>;
    if (status === 'absent') return <span className="badge-absent capitalize">Absent</span>;
    return <span className="badge-halfday">Half Day</span>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance Tracker</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manual Attendance Management</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft">
        {/* Card header */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)]">
          <h2 className="font-semibold text-lg">Attendance List</h2>
          <div className="flex gap-2">
            <button onClick={exportExcel} disabled={exporting}
              className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2">
              {exporting ? <Spinner size={15} /> : <FileSpreadsheet size={15} />}
              Export Excel
            </button>
            <a href="/create-employee" className="btn-primary text-sm py-2 inline-flex items-center gap-1.5">
              <UserPlus size={15} /> Create Employee
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date</label>
            <input type="date" className="input py-1.5 text-sm w-40"
              value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Project</label>
            <select className="input py-1.5 text-sm w-40"
              value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p} value={p!}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select className="input py-1.5 text-sm w-36"
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500 block mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9 py-1.5 text-sm" placeholder="Search by employee name…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <button onClick={loadRecords} className="btn-primary py-1.5 text-sm">Search</button>
          <button onClick={() => { setFilterDate(''); setFilterProject(''); setFilterStatus('all'); setSearch(''); setTimeout(loadRecords, 0); }}
            className="btn-secondary py-1.5 text-sm">Reset</button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex justify-center"><Spinner size={32} /></div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No records found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Employee Name</th>
                    <th className="px-4 py-3 text-left">Mobile</th>
                    <th className="px-4 py-3 text-left">Project</th>
                    <th className="px-4 py-3 text-left">IN Photo</th>
                    <th className="px-4 py-3 text-left">IN Time</th>
                    <th className="px-4 py-3 text-left">OUT Photo</th>
                    <th className="px-4 py-3 text-left">OUT Time</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">HR Remarks</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {paginated.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3 font-medium">{r.employeeName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.phone || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{r.project || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.inPhoto ? (
                          <a href={r.inPhoto} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={driveThumbnail(r.inPhoto)} alt="IN" className="w-12 h-12 object-cover rounded-lg border" />
                          </a>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.inTime || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.outPhoto ? (
                          <a href={r.outPhoto} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={driveThumbnail(r.outPhoto)} alt="OUT" className="w-12 h-12 object-cover rounded-lg border" />
                          </a>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.outTime || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{r.remarks || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(r)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(r._id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
              <span>Showing {Math.min((page - 1) * PER_PAGE + 1, records.length)} to {Math.min(page * PER_PAGE, records.length)} of {records.length} entries</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded border flex items-center justify-center text-sm transition ${p === page ? 'bg-blue-600 border-blue-600 text-white' : 'border-[var(--border)] hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-lg">{editRecord ? 'Edit Attendance' : 'Add Attendance'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="label">Date <span className="text-red-500">*</span></label>
                  <input type="date" className="input" value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                {/* Employee Name */}
                <div>
                  <label className="label">Employee Name <span className="text-red-500">*</span></label>
                  <input className="input" placeholder="Full name" value={form.employeeName}
                    onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))} required />
                </div>
                {/* Mobile Number */}
                <div>
                  <label className="label">Mobile Number <span className="text-red-500">*</span></label>
                  <input className="input" placeholder="10-digit mobile number" value={form.phone}
                    maxLength={10}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    required />
                </div>
                {/* Project */}
                <div>
                  <label className="label">Project</label>
                  <input className="input" placeholder="Project name" value={form.project}
                    onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))} />
                </div>
                {/* Status */}
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}>
                    <option value="present">Present</option>
                    <option value="half-day">Half Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                {/* IN Time */}
                <div>
                  <label className="label">IN Time</label>
                  <input type="time" className="input" value={form.inTime}
                    onChange={(e) => setForm((f) => ({ ...f, inTime: e.target.value }))} />
                </div>
                {/* OUT Time */}
                <div>
                  <label className="label">OUT Time</label>
                  <input type="time" className="input" value={form.outTime}
                    onChange={(e) => setForm((f) => ({ ...f, outTime: e.target.value }))} />
                </div>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">IN Photo (optional)</label>
                  {inPhotoPreview || form.inPhoto ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inPhotoPreview || driveThumbnail(form.inPhoto)} alt="IN"
                        className="w-24 h-24 object-cover rounded-lg border" />
                      <button type="button" onClick={() => { setInPhotoFile(null); setInPhotoPreview(''); setForm((f) => ({ ...f, inPhoto: '' })); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => inPhotoRef.current?.click()} className="btn-secondary text-xs py-1.5">
                        <Upload size={13} /> Upload
                      </button>
                      <input ref={inPhotoRef} type="file" accept="image/jpeg,image/png" className="hidden"
                        onChange={(e) => handlePhotoFile(e.target.files?.[0], 'in')} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">OUT Photo (optional)</label>
                  {outPhotoPreview || form.outPhoto ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={outPhotoPreview || driveThumbnail(form.outPhoto)} alt="OUT"
                        className="w-24 h-24 object-cover rounded-lg border" />
                      <button type="button" onClick={() => { setOutPhotoFile(null); setOutPhotoPreview(''); setForm((f) => ({ ...f, outPhoto: '' })); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => outPhotoRef.current?.click()} className="btn-secondary text-xs py-1.5">
                        <Upload size={13} /> Upload
                      </button>
                      <input ref={outPhotoRef} type="file" accept="image/jpeg,image/png" className="hidden"
                        onChange={(e) => handlePhotoFile(e.target.files?.[0], 'out')} />
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="label">HR Remarks (optional)</label>
                <textarea className="input min-h-[70px] resize-none" placeholder="e.g. Good Performance, Left Early…"
                  value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} maxLength={300} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Spinner size={16} /> : (editRecord ? 'Update' : 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
