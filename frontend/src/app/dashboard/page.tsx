'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { productsApi, codesApi } from '@/services/api';
import Link from 'next/link';

interface Stats {
  products: number;
  totalCodes: number;
  validCodes: number;
  usedCodes: number;
  invalidCodes: number;
}

function StatCard({ label, value, color, icon, href }: {
  label: string; value: number | string; color: string; icon: React.ReactNode; href: string;
}) {
  return (
    <Link href={href}>
      <div className={`card hover:border-gray-700 transition-all cursor-pointer group`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, codeRes] = await Promise.all([
          productsApi.getAll({ limit: 1 }),
          codesApi.stats(),
        ]);
        setStats({
          products: prodRes.data.total,
          totalCodes: parseInt(codeRes.data.stats.total),
          validCodes: parseInt(codeRes.data.stats.valid),
          usedCodes: parseInt(codeRes.data.stats.used),
          invalidCodes: parseInt(codeRes.data.stats.invalid),
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Добро пожаловать{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Обзор системы маркировки товаров</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-10 h-10 bg-gray-800 rounded-lg mb-4" />
              <div className="h-7 w-16 bg-gray-800 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Товаров в системе"
            value={stats.products}
            color="bg-blue-500/10 text-blue-400"
            href="/products"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            label="Всего кодов"
            value={stats.totalCodes}
            color="bg-gray-700/50 text-gray-300"
            href="/codes"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            }
          />
          <StatCard
            label="Действительных кодов"
            value={stats.validCodes}
            color="bg-green-500/10 text-green-400"
            href="/codes"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StatCard
            label="Использованных кодов"
            value={stats.usedCodes}
            color="bg-yellow-500/10 text-yellow-400"
            href="/codes"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Недействительных"
            value={stats.invalidCodes}
            color="bg-red-500/10 text-red-400"
            href="/codes"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/products?action=create">
            <div className="card hover:border-green-800/50 hover:bg-green-900/5 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Добавить товар</p>
                  <p className="text-xs text-gray-500">Создать новый товар</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/codes?action=generate">
            <div className="card hover:border-blue-800/50 hover:bg-blue-900/5 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Генерировать код</p>
                  <p className="text-xs text-gray-500">Создать код маркировки</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/codes?action=verify">
            <div className="card hover:border-purple-800/50 hover:bg-purple-900/5 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Проверить код</p>
                  <p className="text-xs text-gray-500">Верифицировать маркировку</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
