/// <reference types="vite/client" />
import axios from 'axios'

// ─── Instance ─────────────────────────────────────────────────────────────────

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ─── Request interceptor — attach Bearer token ────────────────────────────────

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sld_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor — handle 401 globally ───────────────────────────────

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth state and send user back to login
      localStorage.removeItem('sld_token')
      localStorage.removeItem('sld_user')

      // Only redirect if not already on the login page to avoid loops
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    // Normalise error message so callers can do: error.message
    const serverMessage = error.response?.data?.message
    if (serverMessage) error.message = serverMessage

    return Promise.reject(error)
  }
)

export default axiosInstance
