import { Request } from 'express';

// ─── JWT ──────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'sales';
  iat?: number;
  exp?: number;
}

// NOTE: Express.Request augmentation (req.user) lives in src/middleware/authMiddleware.ts
// to avoid TS2717 (duplicate property declarations must have the same type).

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Pagination Query ─────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Re-export Request for convenience
export type { Request };
