import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { FileSignature, Lock, User, ShieldCheck, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { username, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in. Please check your Focus ERP credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-[1.08fr_.92fr] bg-white">
      <section className="hidden lg:flex relative overflow-hidden bg-[#15183b] text-white p-14 xl:p-20 flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(129,140,248,.48),transparent_28rem)]" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 top-[38%] h-64 w-64 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white text-indigo-700 flex items-center justify-center shadow-2xl"><FileSignature className="w-6 h-6" /></div>
          <div><h1 className="text-xl font-extrabold tracking-tight">FocusFlow</h1><p className="text-xs text-indigo-200/70">Intelligent ERP approvals</p></div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
            <Sparkles className="w-3.5 h-3.5" /> Built for fast-moving finance teams
          </span>
          <h2 className="mt-7 text-4xl xl:text-5xl font-extrabold leading-[1.12] tracking-[-.04em]">Move every invoice forward with confidence.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-indigo-100/65">A secure, focused approval workspace connected directly to your Focus ERP data and authorization hierarchy.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-lg">
            {['Live ERP synchronization', 'Multi-level approval rules', 'Verified e-signatures', 'Complete audit history'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-indigo-50/85"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />{item}</div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-indigo-200/65">
          <ShieldCheck className="w-4 h-4 text-emerald-300" /> Enterprise-grade access controls · Focus80D0 connected
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
          <div className="mb-9 lg:hidden flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"><FileSignature className="w-5 h-5" /></div>
            <div><h1 className="text-lg font-extrabold text-slate-950">FocusFlow</h1><p className="text-xs text-slate-500">Intelligent ERP approvals</p></div>
          </div>

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-slate-500">Use your existing Focus ERP credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">{error}</div>}
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-bold text-slate-700">Focus username</label>
              <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="username" autoComplete="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 text-sm font-medium transition-all placeholder:text-slate-400" placeholder="Enter your username" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="password" autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 text-sm font-medium transition-all placeholder:text-slate-400" placeholder="Enter your password" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="group w-full min-h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-indigo-200/70 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Authenticating…</> : <>Continue to workspace <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>
          <p className="mt-8 text-center text-xs leading-5 text-slate-400">Protected by your organization’s ERP access policies.<br />Need access? Contact your Focus administrator.</p>
        </motion.div>
      </section>
    </div>
  );
}

export default Login;
