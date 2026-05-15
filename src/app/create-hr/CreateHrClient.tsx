'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldPlus } from 'lucide-react';
import { Spinner } from '@/components/Spinner';

export function CreateHrClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/create-hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create HR');
      toast.success(`HR account created for ${data.user.name}`);
      setName(''); setEmail(''); setPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldPlus size={22} className="text-blue-600" /> Create HR Account
        </h1>
        <p className="text-gray-500 text-sm mt-1">Create a new HR login that can mark employee attendance.</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl shadow-soft p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="e.g. Priya Sharma" value={name}
              onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="hr@company.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? <Spinner size={18} /> : 'Create HR Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
