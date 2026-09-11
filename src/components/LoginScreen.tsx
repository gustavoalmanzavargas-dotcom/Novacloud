import React, { FormEvent, useState } from 'react';
import { Cloud, Lock, Mail } from 'lucide-react';

export function LoginScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Invalid email or password');
      await onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
      <form onSubmit={login} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 mb-5"><Cloud /></div>
        <div className="text-xs font-mono font-bold tracking-widest text-cyan-500">CYVERAX NOVA</div>
        <h1 className="text-2xl font-bold mt-1">Sign in to the console</h1>
        <p className="text-sm text-slate-400 mt-2 mb-6">Use the administrator account created during installation.</p>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Email</label>
        <div className="relative mb-4"><Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm" /></div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
        <div className="relative mb-4"><Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm" /></div>
        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
        <button disabled={submitting} className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold rounded-lg py-2.5 text-sm">{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
