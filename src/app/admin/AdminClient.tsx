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
  date: string;
  time: string;
  status: 'present' | 'absent';
  remarks?: string;
  imageUrl?: string;
  markedByHrId: string;
  markedByHrName: string;
  markedByHrEmail: string;
}
interface Stats {
  totalUsers: number;
  presentToday: number;
  absentToday: number;
  totalRecords: number;
  todayDate: string;
}

export function AdminClient() {
  const [tab, setTab] = useState<'records' | 'users'>('records');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<HrUser[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterHrId, setFilterHrId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent'>('all');
  const [search, setSearch] = useState('');

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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={18} />} label="HR users" value={stats.totalUsers} color="brand" />
          <StatCard icon={<CheckCircle2 size={18} />} label={`Present (${stats.todayDate})`} value={stats.presentToday} color="emerald" />
          <StatCard icon={<XCircle size={18} />} label={`Absent (${stats.todayDate})`} value={stats.absentToday} color="red" />
          <StatCard icon={<FileSpreadsheet size={18} />} label="Total records" value={stats.totalRecords} color="violet" />
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
              <div>
                <label className="label text-xs">Status</label>
                <select
                  className="input py-2 text-sm"
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Search employee</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9 py-2 text-sm"
                    placeholder="Employee name..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
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
                      <th className="px-5 py-3 text-left">Marked by (HR)</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Time</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Remarks</th>
                      <th className="px-5 py-3 text-left">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {records.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium">{r.employeeName}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium">{r.markedByHrName}</div>
                          <div className="text-xs text-gray-500">{r.markedByHrEmail}</div>
                        </td>
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
                            <a href={r.imageUrl} target="_blank" rel="noopener noreferrer"
                              className="text-brand-600 hover:underline inline-flex items-center gap-1">
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
