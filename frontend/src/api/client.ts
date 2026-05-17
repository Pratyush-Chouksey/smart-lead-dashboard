// This module is superseded by axiosInstance.ts which uses the correct
// storage keys (sld_token / sld_user) and includes 401 redirect logic.
// Re-export for any legacy imports that reference this path.
export { default as apiClient } from './axiosInstance'
