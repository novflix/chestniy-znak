import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send HttpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage as fallback (for SSR-unfriendly envs)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),
};

// ── Products ────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get('/products', { params }),

  getById: (id: string) => api.get(`/products/${id}`),

  create: (data: { name: string; category: string; description?: string }) =>
    api.post('/products', data),

  getCategories: () => api.get('/products/categories'),
};

// ── Codes ───────────────────────────────────────────────────
export const codesApi = {
  generate: (productId: string, count: number = 1) =>
    api.post('/codes/generate', { productId, count }),

  verify: (code: string, markAsUsed: boolean = false) =>
    api.post('/codes/verify', { code, markAsUsed }),

  stats: () => api.get('/codes/stats'),
};

// ── Logs ────────────────────────────────────────────────────
export const logsApi = {
  getAll: (params?: { page?: number; limit?: number; action?: string }) =>
    api.get('/logs', { params }),
};
