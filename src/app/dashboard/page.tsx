import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { DashboardClient } from './DashboardClient';

export default function DashboardPage() {
  const session = getSession();
  if (!session) redirect('/login');

  return (
    <AppShell user={session}>
      <DashboardClient user={session} />
    </AppShell>
  );
}
