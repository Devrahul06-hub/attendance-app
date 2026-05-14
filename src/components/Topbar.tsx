'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface TopbarProps {
  user: { name: string; email: string; role: 'admin' | 'employee' };
  onMenuClick: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-[var(--border)] sticky top-0 z-20">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="hidden lg:block text-sm text-gray-500">
          Welcome back, <span className="font-medium text-gray-800">{user.name.split(' ')[0]}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-gray-500 leading-tight capitalize">
                {user.role === 'employee' ? 'HR' : user.role}
              </div>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[var(--border)] rounded-lg shadow-card z-20 py-1">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
