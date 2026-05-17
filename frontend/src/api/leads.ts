import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  Lead,
  LeadsResponse,
  LeadFormData,
  FilterParams,
} from '../types'

// ─── Get all leads (with filters + pagination) ────────────────────────────────

export async function getLeads(filters?: FilterParams): Promise<LeadsResponse> {
  // Strip empty-string values so they don't pollute the query string
  const params = filters
    ? Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      )
    : undefined

  const res = await axiosInstance.get<ApiResponse<LeadsResponse>>('/leads', { params })
  if (!res.data.data) throw new Error(res.data.message ?? 'Failed to fetch leads')
  return res.data.data
}

// ─── Get single lead ──────────────────────────────────────────────────────────

export async function getLeadById(id: string): Promise<Lead> {
  const res = await axiosInstance.get<ApiResponse<Lead>>(`/leads/${id}`)
  if (!res.data.data) throw new Error(res.data.message ?? 'Lead not found')
  return res.data.data
}

// ─── Create lead ──────────────────────────────────────────────────────────────

export async function createLead(data: LeadFormData): Promise<Lead> {
  const res = await axiosInstance.post<ApiResponse<Lead>>('/leads', data)
  if (!res.data.data) throw new Error(res.data.message ?? 'Failed to create lead')
  return res.data.data
}

// ─── Update lead ──────────────────────────────────────────────────────────────

export async function updateLead(id: string, data: Partial<LeadFormData>): Promise<Lead> {
  const res = await axiosInstance.put<ApiResponse<Lead>>(`/leads/${id}`, data)
  if (!res.data.data) throw new Error(res.data.message ?? 'Failed to update lead')
  return res.data.data
}

// ─── Delete lead ──────────────────────────────────────────────────────────────

export async function deleteLead(id: string): Promise<{ id: string }> {
  const res = await axiosInstance.delete<ApiResponse<{ id: string }>>(`/leads/${id}`)
  if (!res.data.data) throw new Error(res.data.message ?? 'Failed to delete lead')
  return res.data.data
}

// ─── Export leads as CSV download ─────────────────────────────────────────────

export async function exportLeadsCSV(
  filters?: Pick<FilterParams, 'status' | 'source' | 'search'>
): Promise<void> {
  const params = filters
    ? Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      )
    : undefined

  const res = await axiosInstance.get('/leads/export', {
    params,
    responseType: 'blob', // receive binary data, not parsed JSON
  })

  // Extract filename from Content-Disposition header if present
  const disposition  = res.headers['content-disposition'] as string | undefined
  const filenameMatch = disposition?.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/)
  const filename     = filenameMatch?.[1] ?? `leads_${new Date().toISOString().slice(0, 10)}.csv`

  // Trigger browser download without leaving the page
  const url  = window.URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
