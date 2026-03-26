'use client';
import { useEffect, useState } from 'react';
import { logsApi } from '@/services/api';
import { LogEntry } from '@/types';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  AUTH_LOGIN:     { label: 'Вход',          color: 'text-blue-400 bg-blue-900/20 border-blue-800/30' },
  AUTH_REGISTER:  { label: 'Регистрация',   color: 'text-green-400 bg-green-900/20 border-green-800/30' },
  AUTH_LOGOUT:    { label: 'Выход',         color: 'text-gray-400 bg-gray-800/50 border-gray-700/30' },
  PRODUCT_CREATE: { label: 'Создан товар',  color: 'text-purple-400 bg-purple-900/20 border-purple-800/30' },
  PRODUCT_LIST:   { label: 'Список товаров',color: 'text-gray-400 bg-gray-800/30 border-gray-700/20' },
  CODE_GENERATE:  { label: 'Генерация кода',color: 'text-cyan-400 bg-cyan-900/20 border-cyan-800/30' },
  CODE_VERIFY:    { label: 'Проверка кода', color: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30' },
  LOGS_VIEW:      { label: 'Просмотр логов',color: 'text-gray-500 bg-gray-800/20 border-gray-700/10' },
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_LABELS[action] || { label: action, color: 'text-gray-400 bg-gray-800 border-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    logsApi.getAll({ page, limit: 50, action: actionFilter || undefined })
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Журнал действий</h1>
          <p className="text-gray-400 text-sm mt-1">Всего записей: {total}</p>
        </div>
        <select
          className="input w-52"
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">Все действия</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Время</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Действие</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Пользователь</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">IP</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(12)].map((_, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-28 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-40 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">Логи не найдены</td>
              </tr>
            ) : logs.map(log => (
              <>
                <tr
                  key={log.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {log.user_email ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-300 font-bold shrink-0">
                          {log.user_email[0].toUpperCase()}
                        </div>
                        <span className="text-gray-300 text-xs">{log.user_email}</span>
                        <span className={log.user_role === 'ADMIN' ? 'badge-admin' : 'badge-user'}>
                          {log.user_role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs italic">аноним</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500 font-mono text-xs">
                    {log.ip_address || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <svg
                      className={`w-3 h-3 text-gray-600 transition-transform ${expanded === log.id ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
                {expanded === log.id && (
                  <tr key={`${log.id}-detail`} className="bg-gray-950/50 border-b border-gray-800/30">
                    <td colSpan={5} className="px-6 py-3">
                      <div className="text-xs text-gray-400 font-mono">
                        <span className="text-gray-600">Детали: </span>
                        <pre className="inline whitespace-pre-wrap break-all text-green-400/80">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary px-3 py-2 disabled:opacity-30">←</button>
          <span className="text-sm text-gray-400">Стр. {page} из {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary px-3 py-2 disabled:opacity-30">→</button>
        </div>
      )}
    </div>
  );
}
