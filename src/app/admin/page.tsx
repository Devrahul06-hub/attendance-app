import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { AdminClient } from './AdminClient';

export default function AdminPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return (
    <AppShell user={session}>
      <AdminClient />
    </AppShell>
  );
}
