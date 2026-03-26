'use client';
import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi } from '@/services/api';
import { Product } from '@/types';

const CATEGORIES = [
  'Электроника', 'Одежда', 'Обувь', 'Продукты питания',
  'Лекарства', 'Косметика', 'Ювелирные изделия', 'Игрушки',
  'Автозапчасти', 'Бытовая химия', 'Другое',
];

function CreateForm({ onCreated, onCancel }: { onCreated: (p: Product) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await productsApi.create({ name, category, description });
      onCreated(res.data.product);
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.[0]?.message ||
        err?.response?.data?.error ||
        'Ошибка создания товара'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6 border-green-800/40 animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-white">Новый товар</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Название *</label>
            <input className="input" placeholder="Смартфон Samsung..." value={name}
              onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Категория *</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Описание</label>
          <textarea className="input resize-none h-20" placeholder="Краткое описание товара..."
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {error && <p className="error-box">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Создание...' : 'Создать товар'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">Отмена</button>
        </div>
      </form>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get('action') === 'create');

  useEffect(() => {
    productsApi.getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    productsApi.getAll({ page, limit: 20, category: categoryFilter || undefined })
      .then(r => {
        setProducts(r.data.products);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, categoryFilter]);

  const handleCreated = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    setTotal(prev => prev + 1);
    setShowCreate(false);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Товары</h1>
          <p className="text-gray-400 text-sm mt-1">Всего: {total}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить товар
        </button>
      </div>

      {showCreate && <CreateForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {/* Filter */}
      <div className="mb-4">
        <select
          className="input w-48"
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
        >
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Название</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Категория</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Кодов</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Создан</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="px-4 py-3"><div className="h-4 w-48 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-12 bg-gray-800 rounded animate-pulse" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-28 bg-gray-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                  Товары не найдены
                </td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{p.name}</p>
                    {p.description && <p className="text-gray-500 text-xs truncate max-w-xs">{p.description}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-mono">{p.code_count ?? 0}</span>
                    {(p.valid_codes ?? 0) > 0 && (
                      <span className="badge-valid">{p.valid_codes} valid</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                  {new Date(p.created_at).toLocaleDateString('ru-RU')}
                </td>
              </tr>
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

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
