import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { CreateEmployeeClient } from './CreateEmployeeClient';

export default function CreateEmployeePage() {
  const session = getSession();
  if (!session) redirect('/login');

  return (
    <AppShell user={session}>
      <CreateEmployeeClient role={session.role} />
    </AppShell>
  );
}
