import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { AttendanceClient } from './AttendanceClient';

export default function AttendancePage() {
  const session = getSession();
  if (!session) redirect('/login');

  return (
    <AppShell user={session}>
      <AttendanceClient role={session.role} />
    </AppShell>
  );
}
