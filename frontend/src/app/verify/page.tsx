'use client';
import { useState, FormEvent } from 'react';
import { codesApi } from '@/services/api';
import { VerifyResult } from '@/types';

const STATUS_CONFIG = {
  valid:          { color: 'text-green-400',  bg: 'bg-green-900/20 border-green-700/50',  icon: '✓', label: 'Действителен',    desc: 'Код маркировки подлинный и не был использован ранее.' },
  used:           { color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/50',icon: '⚠', label: 'Использован',     desc: 'Этот код уже был применён ранее.' },
  invalid:        { color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/50',       icon: '✕', label: 'Недействителен',  desc: 'Код признан недействительным.' },
  not_found:      { color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/50',       icon: '✕', label: 'Не найден',       desc: 'Код отсутствует в базе данных.' },
  invalid_format: { color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-700/50', icon: '!', label: 'Неверный формат', desc: 'Код не соответствует формату MRK-XXXX-XXXX-XXXX-XXXX.' },
} as const;

export default function VerifyPage() {
  const [code, setCode]       = useState('');
  const [result, setResult]   = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VerifyResult[]>([]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setResult(null);
    setLoading(true);
    try {
      const res = await codesApi.verify(code.trim().toUpperCase(), false);
      setResult(res.data);
      setHistory(prev => [res.data, ...prev].slice(0, 10));
    } catch (err: any) {
      const r = err?.response?.data || { valid: false, message: 'Ошибка проверки', status: 'invalid_format', code };
      setResult(r);
      setHistory(prev => [r, ...prev].slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? STATUS_CONFIG[result.status as keyof typeof STATUS_CONFIG] : null;

  return (
    <div className="p-6 md:p-10 animate-fadeIn max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Проверка кода</h1>
            <p className="text-green-400/80 text-xs font-medium">Маркировка «Честный знак»</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-3">
          Введите код маркировки, чтобы проверить подлинность товара.
        </p>
      </div>

      {/* Verify form */}
      <div className="card mb-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="label">Код маркировки</label>
            <input
              className="input font-mono tracking-widest uppercase text-base"
              placeholder="MRK-XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              required
              autoFocus
              spellCheck={false}
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Формат: MRK-XXXX-XXXX-XXXX-XXXX (латиница и цифры)
            </p>
          </div>
          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Проверка...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Проверить подлинность
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && cfg && (
        <div className={`rounded-xl border p-6 animate-fadeIn mb-6 ${cfg.bg}`}>
          <div className="flex items-start gap-4">
            <div className={`text-3xl font-bold leading-none mt-0.5 ${cfg.color}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
              </div>
              <p className="text-gray-300 text-sm">{cfg.desc}</p>

              {/* Code display */}
              <div className="mt-4 flex items-center gap-2">
                <code className="code-display flex-1 text-sm py-2">{result.code}</code>
                <button
                  onClick={() => { setCode(''); setResult(null); }}
                  className="btn-secondary py-2 px-3 text-xs">
                  Очистить
                </button>
              </div>

              {/* Product info */}
              {result.product && (
                <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Товар</p>
                    <p className="text-sm text-white font-medium">{result.product.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Категория</p>
                    <p className="text-sm text-gray-300">{result.product.category}</p>
                  </div>
                  {result.usedAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Дата использования</p>
                      <p className="text-sm text-yellow-400">
                        {new Date(result.usedAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  )}
                  {result.createdAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Дата выдачи</p>
                      <p className="text-sm text-gray-400">
                        {new Date(result.createdAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">История проверок</h3>
            <button onClick={() => setHistory([])}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Очистить
            </button>
          </div>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => {
              const hcfg = STATUS_CONFIG[h.status as keyof typeof STATUS_CONFIG];
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                  <span className={`text-sm font-bold w-5 text-center ${hcfg.color}`}>{hcfg.icon}</span>
                  <code className="text-xs font-mono text-gray-400 flex-1 truncate">{h.code}</code>
                  <span className={`text-xs font-medium ${hcfg.color}`}>{hcfg.label}</span>
                  <button onClick={() => { setCode(h.code); setResult(h); }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors">↑</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
