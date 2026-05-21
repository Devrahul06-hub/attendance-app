import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { VendorClient } from './VendorClient';

export default function VendorPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return (
    <AppShell user={session}>
      <VendorClient />
    </AppShell>
  );
}
