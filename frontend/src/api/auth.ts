import axiosInstance from './axiosInstance'
import type { ApiResponse, AuthResponse, LoginFormData, RegisterFormData } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// The backend returns a flat object: { _id, name, email, role, token }
// But the frontend AuthResponse expects: { token, user: { id, name, email, role, createdAt } }
// This adapter bridges the two shapes.
interface BackendAuthPayload {
  _id: string
  name: string
  email: string
  role: 'admin' | 'sales'
  token: string
  createdAt?: string
}

function adaptAuthPayload(payload: BackendAuthPayload): AuthResponse {
  const { token, _id, name, email, role, createdAt } = payload
  return {
    token,
    user: {
      id: _id,
      name,
      email,
      role,
      createdAt: createdAt ?? new Date().toISOString(),
    },
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(data: RegisterFormData): Promise<AuthResponse> {
  const res = await axiosInstance.post<ApiResponse<BackendAuthPayload>>('/auth/register', data)
  if (!res.data.data) throw new Error(res.data.message ?? 'Registration failed')
  return adaptAuthPayload(res.data.data)
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(data: LoginFormData): Promise<AuthResponse> {
  const res = await axiosInstance.post<ApiResponse<BackendAuthPayload>>('/auth/login', data)
  if (!res.data.data) throw new Error(res.data.message ?? 'Login failed')
  return adaptAuthPayload(res.data.data)
}
