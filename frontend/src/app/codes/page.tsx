'use client';
import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { codesApi, productsApi } from '@/services/api';
import { Code, VerifyResult, Product } from '@/types';

// ── Generate Panel ──────────────────────────────────────────
function GeneratePanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [count, setCount] = useState(1);
  const [result, setResult] = useState<Code[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsApi.getAll({ limit: 500 }).then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null);
    setLoading(true);
    try {
      const res = await codesApi.generate(productId, count);
      setResult(res.data.codes);
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0]?.message ||
        err?.response?.data?.error ||
        'Ошибка генерации'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (result) navigator.clipboard.writeText(result.map(c => c.code).join('\n'));
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <h2 className="font-semibold text-white">Генерация кодов</h2>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="label">Товар *</label>
          <select className="input" value={productId} onChange={e => setProductId(e.target.value)} required>
            <option value="">Выберите товар</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Количество кодов (1–500)</label>
          <input
            className="input"
            type="number" min={1} max={500}
            value={count} onChange={e => setCount(parseInt(e.target.value) || 1)}
          />
        </div>
        {error && <p className="error-box">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Генерация...
            </span>
          ) : `Сгенерировать ${count > 1 ? count + ' кодов' : 'код'}`}
        </button>
      </form>

      {result && result.length > 0 && (
        <div className="mt-5 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-green-400">
              ✓ Сгенерировано кодов: {result.length}
            </p>
            <button onClick={copyAll} className="btn-secondary py-1.5 text-xs">
              Копировать все
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {result.map((code, i) => (
              <div key={code.id} className="flex items-center gap-3">
                <span className="text-gray-600 font-mono text-xs w-5 shrink-0">{i + 1}.</span>
                <code className="code-display flex-1 text-xs">{code.code}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(code.code)}
                  className="text-gray-500 hover:text-green-400 transition-colors shrink-0"
                  title="Копировать"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Verify Panel ────────────────────────────────────────────
function VerifyPanel() {
  const [code, setCode] = useState('');
  const [markAsUsed, setMarkAsUsed] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const res = await codesApi.verify(code.trim().toUpperCase(), markAsUsed);
      setResult(res.data);
    } catch (err: any) {
      setResult(err?.response?.data || { valid: false, message: 'Ошибка проверки', status: 'invalid', code });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    valid: { color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/50', icon: '✓', label: 'Действителен' },
    used: { color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/50', icon: '⚠', label: 'Использован' },
    invalid: { color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50', icon: '✕', label: 'Недействителен' },
    not_found: { color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50', icon: '✕', label: 'Не найден' },
    invalid_format: { color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/50', icon: '!', label: 'Неверный формат' },
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="font-semibold text-white">Проверка кода</h2>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="label">Код маркировки</label>
          <input
            className="input font-mono tracking-wider uppercase"
            placeholder="MRK-XXXX-XXXX-XXXX-XXXX"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Формат: MRK-XXXX-XXXX-XXXX-XXXX</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input type="checkbox" className="sr-only peer"
              checked={markAsUsed} onChange={e => setMarkAsUsed(e.target.checked)} />
            <div className="w-10 h-5 bg-gray-700 rounded-full peer-checked:bg-green-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
          <span className="text-sm text-gray-300">Отметить как использованный</span>
        </label>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Проверка...
            </span>
          ) : 'Проверить код'}
        </button>
      </form>

      {result && (
        <div className={`mt-5 rounded-lg border p-4 animate-fadeIn ${statusConfig[result.status]?.bg || 'bg-gray-800 border-gray-700'}`}>
          <div className="flex items-start gap-3">
            <span className={`text-xl font-bold leading-none ${statusConfig[result.status]?.color}`}>
              {statusConfig[result.status]?.icon}
            </span>
            <div className="flex-1">
              <p className={`font-semibold ${statusConfig[result.status]?.color}`}>
                {statusConfig[result.status]?.label}
              </p>
              <p className="text-gray-300 text-sm mt-1">{result.message}</p>
              {result.product && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Товар</span>
                    <span className="text-gray-200 font-medium">{result.product.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Категория</span>
                    <span className="text-gray-400">{result.product.category}</span>
                  </div>
                  {result.usedAt && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Использован</span>
                      <span className="text-gray-400">{new Date(result.usedAt).toLocaleString('ru-RU')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
function CodesContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('action') === 'verify' ? 'verify' : 'generate';
  const [tab, setTab] = useState<'generate' | 'verify'>(defaultTab as 'generate' | 'verify');

  return (
    <div className="p-8 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Коды маркировки</h1>
        <p className="text-gray-400 text-sm mt-1">Генерация и проверка кодов</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg mb-6 w-fit">
        {[
          { id: 'generate', label: 'Генерировать' },
          { id: 'verify', label: 'Проверить' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'generate' | 'verify')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-xl">
        {tab === 'generate' ? <GeneratePanel /> : <VerifyPanel />}
      </div>
    </div>
  );
}

export default function CodesPage() {
  return (
    <Suspense>
      <CodesContent />
    </Suspense>
  );
}
