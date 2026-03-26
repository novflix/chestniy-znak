'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import './globals.css';

export default function AuthPage() {
  const [mode, setMode]       = useState<'login' | 'register'>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else                  await register(email, password);
      // Route depends on role — user is set after login
      const stored = localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : null;
      router.push(u?.role === 'ADMIN' ? '/dashboard' : '/verify');
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0]?.message ||
        err?.response?.data?.error ||
        'Ошибка. Попробуйте снова.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(#22c55e 1px,transparent 1px),linear-gradient(90deg,#22c55e 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 mb-5">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Маркировка</h1>
          <p className="text-green-400/80 text-sm font-medium mt-0.5">«Честный знак»</p>
          <p className="text-gray-500 text-xs mt-2">Система контроля товаров</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-800 rounded-lg mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === m ? 'bg-gray-900 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                }`}>
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="admin@chestnyznak.ru"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password"
                placeholder={mode === 'register' ? 'Минимум 6 символов + цифра' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="error-box">{error}</p>}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {mode === 'login' ? 'Вход...' : 'Регистрация...'}
                </span>
              ) : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-5 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Демо доступ</p>
              <div className="space-y-1">
                <button type="button" onClick={() => { setEmail('admin@chestnyznak.ru'); setPassword('admin123'); }}
                  className="w-full text-left text-xs font-mono px-2 py-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-colors flex items-center justify-between">
                  <span>admin@chestnyznak.ru / admin123</span>
                  <span className="badge-admin ml-2">ADMIN</span>
                </button>
                <button type="button" onClick={() => { setEmail('user@chestnyznak.ru'); setPassword('user123'); }}
                  className="w-full text-left text-xs font-mono px-2 py-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-colors flex items-center justify-between">
                  <span>user@chestnyznak.ru / user123</span>
                  <span className="badge-user ml-2">USER</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
