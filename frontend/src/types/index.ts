// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales';
  createdAt: string;
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';
export type LeadSource = 'Website' | 'Instagram' | 'Referral';

export interface Lead {
  _id: string;
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  createdBy: Pick<User, 'id' | 'name' | 'email'> | string;
  createdAt: string;
  updatedAt: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface LeadsResponse {
  leads: Lead[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Filter / query params ────────────────────────────────────────────────────

export interface FilterParams {
  status?: LeadStatus | '';
  source?: LeadSource | '';
  search?: string;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
}

// ─── Form data shapes ─────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  source: LeadSource;
  status?: LeadStatus;
}
