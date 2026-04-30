const TOKEN_STORAGE_KEY = 'token'

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY)

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const decodeJwtPayload = (token = getStoredToken()) => {
  if (!token) return null

  try {
    const tokenParts = token.split('.')
    if (tokenParts.length < 2) return null

    const payload = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const paddedPayload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=')
    return JSON.parse(atob(paddedPayload))
  } catch {
    return null
  }
}

export const getUserIdFromToken = (token = getStoredToken()) => {
  const payload = decodeJwtPayload(token)
  return payload?.id || payload?.sub || payload?.userId || null
}