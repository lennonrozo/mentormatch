// api.js - Centralized Axios API client factory for connecting to the Django backend
// This file exports two things:
// 1) API_BASE: The base URL for all backend requests
// 2) apiClient(token): A function that creates an Axios instance with authentication

import axios from 'axios'

// Base URL for the Django backend API
// In production, you might replace this with an environment variable
export const API_BASE = 'http://127.0.0.1:8000'

/**
 * Creates and returns an Axios instance configured to communicate with the backend.
 * 
 * @param {string} token - The JWT access token for authenticating API requests
 * @returns {AxiosInstance} - A configured Axios instance
 * 
 * How it works:
 * - Sets the base URL to our Django backend
 * - Adds an Authorization header with the Bearer token for authentication
 * - Makes it easy to call API endpoints like: api.get('/profile/me/')
 */
export function apiClient(token) {
  return axios.create({
    baseURL: `${API_BASE}/api/`,  // All requests will be prefixed with this
    headers: {
      // JWT token format: "Bearer <token>"
      // The backend checks this header to authenticate the user
      Authorization: `Bearer ${token}`
    }
  })
}

// Export apiClient as the default export for convenience
// This allows: import api from './api' OR import { apiClient } from './api'
export default apiClient
