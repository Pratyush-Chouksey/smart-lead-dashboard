import { Request } from 'express'
import { Types } from 'mongoose'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'sales'

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost'

export type LeadSource = 'Website' | 'Instagram' | 'Referral'

export type SortOrder = 'asc' | 'desc'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
  _id: Types.ObjectId
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

export interface IUserDocument extends IUser {
  _id: Types.ObjectId
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export interface ILead {
  _id: Types.ObjectId
  name: string
  email: string
  phone?: string
  company?: string
  status: LeadStatus
  source: LeadSource
  notes?: string
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface ILeadDocument extends ILead {
  _id: Types.ObjectId
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export interface CreateLeadPayload {
  name: string
  email: string
  phone?: string
  company?: string
  status?: LeadStatus
  source: LeadSource
  notes?: string
}

export interface UpdateLeadPayload {
  name?: string
  email?: string
  phone?: string
  company?: string
  status?: LeadStatus
  source?: LeadSource
  notes?: string
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface LeadQueryParams {
  status?: LeadStatus
  source?: LeadSource
  search?: string
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: SortOrder
}

export interface ExportQueryParams {
  status?: LeadStatus
  source?: LeadSource
  search?: string
}

// ─── API Response Shape ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  leads: T[]
  total: number
  page: number
  pages: number
  limit: number
}

// ─── Auth Response ────────────────────────────────────────────────────────────

export interface AuthResponse {
  _id: string
  name: string
  email: string
  role: UserRole
  token: string
}

// ─── Augmented Express Request ────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: IUserDocument
}
