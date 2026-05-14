'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import clsx from 'clsx';

interface SidebarProps {
  role: 'admin' | 'employee';
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/attendance', label: 'HR Panel', icon: CalendarCheck2 },
    ...(role === 'admin'
      ? [{ href: '/admin', label: 'Admin Panel', icon: Users }]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[var(--border)]',
          'transform transition-transform lg:translate-x-0 lg:static lg:shrink-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border)]">
          <Logo />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-xs text-gray-400 px-3">v0.1 · Prototype</div>
        </div>
      </aside>
    </>
  );
}
