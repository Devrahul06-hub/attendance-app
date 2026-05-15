'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2, Clock, TrendingUp, ArrowRight, CheckCircle2, XCircle,
} from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface DashboardClientProps {
  user: { name: string; email: string; role: 'admin' | 'employee' };
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [today, setToday] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/attendance/today').then((r) => r.json()),
      fetch('/api/attendance').then((r) => r.json()),
    ])
      .then(([todayData, listData]) => {
        setToday(todayData.record);
        setRecords(listData.records || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-600">
        <Spinner size={32} />
      </div>
    );
  }

  // Quick stats
  const totalRecords = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const rate = totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Hi {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s your attendance overview.</p>
      </div>

      {/* Today's status card */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              today
                ? today.status === 'present'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {today
              ? today.status === 'present'
                ? <CheckCircle2 size={22} />
                : <XCircle size={22} />
              : <Clock size={22} />}
          </div>
          <div>
            <div className="text-sm text-gray-500">Today&apos;s status</div>
            <div className="text-xl font-bold capitalize mt-0.5">
              {today ? today.status : 'Not marked yet'}
            </div>
            {today && (
              <div className="text-xs text-gray-500 mt-0.5">
                Marked at {today.time}
                {today.remarks && ` · "${today.remarks}"`}
              </div>
            )}
          </div>
        </div>

        <Link
          href="/attendance"
          className={today ? 'btn-secondary' : 'btn-primary'}
        >
          {today ? 'View attendance' : 'Mark attendance'}
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarCheck2 size={18} />}
          label="Total records"
          value={totalRecords}
          color="brand"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Present"
          value={presentCount}
          color="emerald"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Absent"
          value={absentCount}
          color="red"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Attendance rate"
          value={`${rate}%`}
          color="violet"
        />
      </div>

    </div>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'brand' | 'emerald' | 'red' | 'violet';
}) {
  const map = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${map[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
