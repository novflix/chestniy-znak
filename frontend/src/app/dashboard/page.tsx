'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { productsApi, codesApi } from '@/services/api';
import Link from 'next/link';

interface Stats { products: number; totalCodes: number; validCodes: number; usedCodes: number; invalidCodes: number; }

function StatCard({ label, value, color, icon, href }: { label: string; value: number; color: string; icon: React.ReactNode; href: string; }) {
  return (
    <Link href={href}>
      <div className="card hover:border-gray-700 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
          <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-white font-mono">{value.toLocaleString('ru-RU')}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productsApi.getAll({ limit: 1 }), codesApi.stats()])
      .then(([p, c]) => setStats({
        products:    p.data.total,
        totalCodes:  parseInt(c.data.stats.total),
        validCodes:  parseInt(c.data.stats.valid),
        usedCodes:   parseInt(c.data.stats.used),
        invalidCodes:parseInt(c.data.stats.invalid),
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const skeletonCard = (
    <div className="card animate-pulse">
      <div className="w-10 h-10 bg-gray-800 rounded-lg mb-4" />
      <div className="h-7 w-16 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-28 bg-gray-800 rounded" />
    </div>
  );

  return (
    <div className="p-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <p className="text-gray-400 text-sm mt-1">
          Добро пожаловать, <span className="text-white">{user?.email?.split('@')[0]}</span> — Маркировка «Честный знак»
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <>{skeletonCard}{skeletonCard}{skeletonCard}{skeletonCard}{skeletonCard}</>
        ) : stats ? (<>
          <StatCard label="Товаров в системе" value={stats.products} color="bg-blue-500/10 text-blue-400" href="/products"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
          <StatCard label="Всего кодов" value={stats.totalCodes} color="bg-gray-700/50 text-gray-300" href="/codes"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>} />
          <StatCard label="Действительных" value={stats.validCodes} color="bg-green-500/10 text-green-400" href="/codes"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
          <StatCard label="Использованных" value={stats.usedCodes} color="bg-yellow-500/10 text-yellow-400" href="/codes"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard label="Недействительных" value={stats.invalidCodes} color="bg-red-500/10 text-red-400" href="/codes"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
        </>) : null}
      </div>

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Быстрые действия</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/products?action=create', color: 'green', label: 'Добавить товар', sub: 'Создать новую позицию', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /> },
          { href: '/codes?action=generate',  color: 'blue',  label: 'Генерировать код', sub: 'Создать код маркировки', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /> },
          { href: '/codes?action=verify',    color: 'purple', label: 'Проверить код', sub: 'Верифицировать маркировку', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        ].map(a => (
          <Link key={a.href} href={a.href}>
            <div className={`card hover:border-${a.color}-800/50 hover:bg-${a.color}-900/5 transition-all cursor-pointer group`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-${a.color}-500/10 border border-${a.color}-500/20 flex items-center justify-center text-${a.color}-400 shrink-0`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{a.icon}</svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{a.label}</p>
                  <p className="text-xs text-gray-500">{a.sub}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
