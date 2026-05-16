'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/Spinner';

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
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: 'present' | 'absent' | 'half-day';
  inTime?: string;
  outTime?: string;
  inPhoto?: string;
  outPhoto?: string;
  remarks?: string;
  markedByHrName?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function driveThumbnail(url: string) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w80-h80` : url;
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const emptyForm = {
  status: 'present' as 'present' | 'absent' | 'half-day',
  inTime: '', outTime: '', remarks: '', inPhoto: '', outPhoto: '',
};

interface Props {
  employee: Employee;
  onClose: () => void;
  onAttendanceAdded?: () => void;
}

export function EmployeeCalendarModal({ employee, onClose, onAttendanceAdded }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [inPhotoFile, setInPhotoFile] = useState<File | null>(null);
  const [outPhotoFile, setOutPhotoFile] = useState<File | null>(null);
  const [inPhotoPreview, setInPhotoPreview] = useState('');
  const [outPhotoPreview, setOutPhotoPreview] = useState('');
  const inRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLInputElement>(null);

  const month = monthStr(currentDate);

  async function loadRecords() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/employee?phone=${employee.phone}&month=${month}`).then((r) => r.json());
      setRecords(res.records || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRecords(); }, [month]); // eslint-disable-line

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const recordByDate = Object.fromEntries(records.map((r) => [r.date, r]));
  const selectedRecord = selectedDate ? recordByDate[selectedDate] : null;

  // Calendar grid
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = todayStr();

  const calendarCells: Array<{ dateStr: string; day: number; currentMonth: boolean }> = [];
  const prevDays = new Date(year, monthIndex, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = monthIndex === 0 ? 12 : monthIndex;
    const y = monthIndex === 0 ? year - 1 : year;
    calendarCells.push({ dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ dateStr: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, currentMonth: true });
  }
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = monthIndex === 11 ? 1 : monthIndex + 2;
    const y = monthIndex === 11 ? year + 1 : year;
    calendarCells.push({ dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, currentMonth: false });
  }

  // Summary counts
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const halfDay = records.filter((r) => r.status === 'half-day').length;

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

  function openDateForm() {
    setForm({ ...emptyForm });
    setInPhotoFile(null); setOutPhotoFile(null);
    setInPhotoPreview(''); setOutPhotoPreview('');
  }

  useEffect(() => {
    if (selectedDate && !selectedRecord) openDateForm();
  }, [selectedDate]); // eslint-disable-line

  async function handleAddAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!form.status) { toast.error('Status required'); return; }
    setSubmitting(true);
    try {
      let inPhoto = form.inPhoto;
      let outPhoto = form.outPhoto;
      if (inPhotoFile) inPhoto = await uploadPhoto(inPhotoFile);
      if (outPhotoFile) outPhoto = await uploadPhoto(outPhotoFile);

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: employee.name,
          phone: employee.phone,
          date: selectedDate,
          status: form.status,
          inTime: form.inTime,
          outTime: form.outTime,
          remarks: form.remarks,
          inPhoto,
          outPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Attendance added!');
      await loadRecords();
      onAttendanceAdded?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function statusColor(status: string) {
    if (status === 'present') return 'bg-green-500';
    if (status === 'absent') return 'bg-red-500';
    return 'bg-orange-400';
  }

  const recentRecords = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* Employee Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
            {initials(employee.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg">{employee.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                employee.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
              }`}>{employee.status === 'active' ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500">
              {employee.employeeId && <span>🪪 {employee.employeeId}</span>}
              {employee.designation && <span>👤 {employee.designation}</span>}
              {employee.district && <span>📍 {employee.district}{employee.taluka ? `, ${employee.taluka}` : ''}</span>}
              {employee.email && <span>✉ {employee.email}</span>}
              <span>📞 {employee.phone}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 shrink-0"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Calendar */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-gray-100">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
              <span className="font-semibold text-base">{MONTHS[monthIndex]} {year}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            {loading ? (
              <div className="py-12 flex justify-center"><Spinner size={28} /></div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {calendarCells.map(({ dateStr, day, currentMonth }) => {
                  const rec = recordByDate[dateStr];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <div
                      key={dateStr}
                      onClick={() => currentMonth && setSelectedDate(dateStr)}
                      className={`bg-white min-h-[70px] p-1.5 flex flex-col transition-colors ${
                        currentMonth ? 'cursor-pointer hover:bg-blue-50/60' : 'opacity-30 cursor-default'
                      } ${isSelected && currentMonth ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                    >
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                        isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                      }`}>
                        {day}
                      </div>
                      {rec && (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor(rec.status)}`} />
                            {rec.inTime && <span className="text-[9px] text-gray-500 leading-tight">IN {rec.inTime}</span>}
                          </div>
                          {rec.outTime && (
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-400" />
                              <span className="text-[9px] text-gray-500 leading-tight">OUT {rec.outTime}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="w-72 shrink-0 overflow-y-auto p-4 space-y-4">

            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Attendance Summary ({MONTHS[monthIndex]})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Present', count: present, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                  { label: 'Absent', count: absent, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                  { label: 'Half Day', count: halfDay, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
                  { label: 'Total', count: records.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} className={`rounded-xl border p-2.5 text-center ${bg}`}>
                    <div className={`text-xl font-bold ${color}`}>{count}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Date */}
            {selectedDate && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                </h3>

                {selectedRecord ? (
                  <div className="space-y-3">
                    {/* Status badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      selectedRecord.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                      selectedRecord.status === 'absent' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-orange-50 text-orange-600 border-orange-200'
                    }`}>
                      {selectedRecord.status === 'present' ? 'Present' : selectedRecord.status === 'absent' ? 'Absent' : 'Half Day'}
                    </div>

                    {/* IN */}
                    {(selectedRecord.inTime || selectedRecord.inPhoto) && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <div>
                          <div className="text-xs text-gray-400 font-medium">IN Time</div>
                          <div className="font-semibold text-sm">{selectedRecord.inTime || '—'}</div>
                        </div>
                        {selectedRecord.inPhoto && (
                          <a href={selectedRecord.inPhoto} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={driveThumbnail(selectedRecord.inPhoto)} alt="IN" className="w-12 h-12 object-cover rounded-lg border" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* OUT */}
                    {(selectedRecord.outTime || selectedRecord.outPhoto) && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <div>
                          <div className="text-xs text-gray-400 font-medium">OUT Time</div>
                          <div className="font-semibold text-sm">{selectedRecord.outTime || '—'}</div>
                        </div>
                        {selectedRecord.outPhoto && (
                          <a href={selectedRecord.outPhoto} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={driveThumbnail(selectedRecord.outPhoto)} alt="OUT" className="w-12 h-12 object-cover rounded-lg border" />
                          </a>
                        )}
                      </div>
                    )}

                    {selectedRecord.remarks && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                        <div className="font-medium text-gray-600 mb-0.5">Remarks</div>
                        {selectedRecord.remarks}
                      </div>
                    )}
                    {selectedRecord.markedByHrName && (
                      <div className="text-xs text-gray-400">Marked by: {selectedRecord.markedByHrName}</div>
                    )}
                  </div>
                ) : (
                  /* Add Attendance Form */
                  <form onSubmit={handleAddAttendance} className="space-y-3">
                    <p className="text-xs text-gray-400">No attendance recorded. Add now:</p>

                    <div>
                      <label className="label text-xs">Status <span className="text-red-500">*</span></label>
                      <select className="input py-1.5 text-sm" value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}>
                        <option value="present">Present</option>
                        <option value="half-day">Half Day</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs">IN Time</label>
                        <input type="time" className="input py-1.5 text-sm" value={form.inTime}
                          onChange={(e) => setForm((f) => ({ ...f, inTime: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">OUT Time</label>
                        <input type="time" className="input py-1.5 text-sm" value={form.outTime}
                          onChange={(e) => setForm((f) => ({ ...f, outTime: e.target.value }))} />
                      </div>
                    </div>

                    {/* IN Photo */}
                    <div>
                      <label className="label text-xs">IN Photo</label>
                      {inPhotoPreview ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={inPhotoPreview} alt="IN" className="w-16 h-16 object-cover rounded-lg border" />
                          <button type="button" onClick={() => { setInPhotoFile(null); setInPhotoPreview(''); }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={() => inRef.current?.click()}
                            className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                            <Upload size={11} /> Upload
                          </button>
                          <input ref={inRef} type="file" accept="image/jpeg,image/png" className="hidden"
                            onChange={(e) => handlePhotoFile(e.target.files?.[0], 'in')} />
                        </>
                      )}
                    </div>

                    {/* OUT Photo */}
                    <div>
                      <label className="label text-xs">OUT Photo</label>
                      {outPhotoPreview ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={outPhotoPreview} alt="OUT" className="w-16 h-16 object-cover rounded-lg border" />
                          <button type="button" onClick={() => { setOutPhotoFile(null); setOutPhotoPreview(''); }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                        </div>
                      ) : (
                        <>
                          <button type="button" onClick={() => outRef.current?.click()}
                            className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                            <Upload size={11} /> Upload
                          </button>
                          <input ref={outRef} type="file" accept="image/jpeg,image/png" className="hidden"
                            onChange={(e) => handlePhotoFile(e.target.files?.[0], 'out')} />
                        </>
                      )}
                    </div>

                    <div>
                      <label className="label text-xs">Remarks</label>
                      <textarea className="input text-sm py-1.5 resize-none min-h-[60px]"
                        placeholder="Optional remarks…" value={form.remarks} maxLength={300}
                        onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
                    </div>

                    <button type="submit" className="btn-primary w-full text-sm py-2" disabled={submitting}>
                      {submitting ? <Spinner size={16} /> : 'Submit Attendance'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Recent Attendance */}
            {recentRecords.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Attendance</h3>
                <div className="space-y-1.5">
                  {recentRecords.map((r) => (
                    <div key={r._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'present' ? 'bg-green-50 text-green-700' :
                        r.status === 'absent' ? 'bg-red-50 text-red-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {r.status === 'present' ? 'Present' : r.status === 'absent' ? 'Absent' : 'Half Day'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
