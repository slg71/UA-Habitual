import { getStoredToken, getUserIdFromToken } from './auth'

const GUEST_LIKES_CACHE_KEY = 'habitual_likes_v2_guest'

const getLikesCacheKey = (token = getStoredToken()) => {
  const userId = getUserIdFromToken(token)
  return userId ? `habitual_likes_v2_user_${userId}` : GUEST_LIKES_CACHE_KEY
}

export const loadLikesCache = (token) => {
  try {
    return JSON.parse(localStorage.getItem(getLikesCacheKey(token)) || '{}')
  } catch {
    return {}
  }
}

export const saveLikesCache = (mapa, token) => {
  try {
    localStorage.setItem(getLikesCacheKey(token), JSON.stringify(mapa))
  } catch {
    // Cache opcional: si falla, seguimos sin bloquear la UI.
  }
}