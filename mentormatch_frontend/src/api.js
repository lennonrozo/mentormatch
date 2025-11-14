import axios from 'axios'

// Base URL for the Django backend
// Uses environment variable in production, falls back to local dev server
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Factory function that returns a preconfigured Axios instance.
// If a JWT token is provided, we attach it as Authorization: Bearer <token>.
export function apiClient(token){
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return axios.create({ baseURL: API_BASE + '/api/', headers })
}

export default apiClient
