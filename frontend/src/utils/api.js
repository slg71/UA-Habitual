import { getStoredToken } from './auth'

export const API_BASE = '/api'

export const getAuthHeaders = (token = getStoredToken()) => {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}