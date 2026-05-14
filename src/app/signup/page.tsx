'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/Spinner';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      toast.success(`Welcome to PunchPilot, ${data.user.name.split(' ')[0]}!`);
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
      <div className="lg:flex-1 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 lg:p-12 flex flex-col justify-between text-white">
        <Logo />
        <div className="hidden lg:block max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Start tracking in minutes.
          </h1>
          <p className="text-brand-100 text-lg">
            No credit card. No setup fees. Just sign up and your team is ready to punch in.
          </p>
        </div>
        <div className="text-xs text-brand-200 hidden lg:block">© 2025 PunchPilot · Prototype</div>
      </div>

      <div className="lg:flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg)]">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-1">Create your account</h2>
          <p className="text-gray-500 text-sm mb-8">
            Already have one?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
