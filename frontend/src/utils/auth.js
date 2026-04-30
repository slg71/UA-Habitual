const TOKEN_STORAGE_KEY = 'token'

const getStoredTokenRaw = () => localStorage.getItem(TOKEN_STORAGE_KEY)

export const getStoredToken = () => {
  const token = getStoredTokenRaw()
  if (!token) return null

  if (isTokenExpired(token)) {
    clearStoredToken()
    return null
  }

  return token
}

export const SETTINGS_STORAGE_KEY = 'habitual_user_settings_v1'

export const getSettingsStorageKey = (token = getStoredToken()) => {
  const userId = getUserIdFromToken(token)
  return userId ? `${SETTINGS_STORAGE_KEY}_${userId}` : SETTINGS_STORAGE_KEY
}

export const loadUserSettings = (token = getStoredToken()) => {
  const raw = localStorage.getItem(getSettingsStorageKey(token))
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const saveUserSettings = (settings, token = getStoredToken()) => {
  const key = getSettingsStorageKey(token)
  if (!key) return
  localStorage.setItem(key, JSON.stringify(settings))
}

export const clearUserSettings = (token = getStoredToken()) => {
  const key = getSettingsStorageKey(token)
  if (!key) return
  localStorage.removeItem(key)
}

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const decodeJwtPayload = (token = getStoredTokenRaw()) => {
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

export const isTokenExpired = (token = getStoredTokenRaw()) => {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false

  const nowInSeconds = Math.floor(Date.now() / 1000)
  return nowInSeconds >= payload.exp
}

export const getUserIdFromToken = (token = getStoredToken()) => {
  const payload = decodeJwtPayload(token)
  return payload?.id || payload?.sub || payload?.userId || null
}