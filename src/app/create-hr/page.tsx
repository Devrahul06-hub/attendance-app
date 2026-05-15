import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { CreateHrClient } from './CreateHrClient';

export default function CreateHrPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return (
    <AppShell user={session}>
      <CreateHrClient />
    </AppShell>
  );
}
