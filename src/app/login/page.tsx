'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="lg:flex-1 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 lg:p-12 flex flex-col justify-between text-white">
        <Logo />
        <div className="hidden lg:block max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Attendance, simplified.
          </h1>
          <p className="text-brand-100 text-lg">
            One-tap check-ins, photo verification, and instant reports — built for modern teams.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <Stat label="Setup time" value="< 2 min" />
            <Stat label="Mobile-ready" value="100%" />
          </div>
        </div>
        <div className="text-xs text-brand-200 hidden lg:block">© 2025 PunchPilot · Prototype</div>
      </div>

      {/* Right form panel */}
      <div className="lg:flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg)]">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-1">Sign in to your account</h2>
          <p className="text-gray-500 text-sm mb-8">Enter your credentials to access the system.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-white border border-[var(--border)] rounded-lg text-xs text-gray-600">
            <div className="font-semibold mb-1">Demo tip</div>
            The first user who signs up becomes the admin. You can also set <code className="px-1 bg-gray-100 rounded">ADMIN_EMAIL</code> in <code className="px-1 bg-gray-100 rounded">.env.local</code>.
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-brand-100">{label}</div>
    </div>
  );
}
