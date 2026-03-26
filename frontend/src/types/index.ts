export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  created_by_email?: string;
  created_at: string;
  code_count?: number;
  valid_codes?: number;
}

export interface Code {
  id: string;
  product_id: string;
  code: string;
  status: 'valid' | 'used' | 'invalid';
  created_at: string;
  used_at?: string;
  product_name?: string;
  product_category?: string;
}

export interface VerifyResult {
  valid: boolean;
  status: 'valid' | 'used' | 'invalid' | 'not_found' | 'invalid_format';
  message: string;
  code: string;
  product?: { name: string; category: string };
  usedAt?: string;
  createdAt?: string;
}

export interface LogEntry {
  id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
  user_email?: string;
  user_role?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}
