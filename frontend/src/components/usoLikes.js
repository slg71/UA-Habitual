import { useState, useCallback } from 'react'


/*CODIGO QUE DE MOMENTO NO FUNCIONA POR Q NO ME VA :D */


// ─── Caché en localStorage ───────────────────────────────────────────────────
const CACHE_KEY = 'likes_cache_v2'

const leerCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }
  catch { return {} }
}

const guardarCache = (mapa) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(mapa)) }
  catch {}
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useLikes() {
  const [likesMap, setLikesMap] = useState(() => leerCache())

  // Actualiza estado + caché de forma atómica
  const actualizarMapa = useCallback((updater) => {
    setLikesMap(prev => {
      const nuevo = typeof updater === 'function' ? updater(prev) : updater
      guardarCache(nuevo)
      return nuevo
    })
  }, [])

  /**
   * Precarga likes de una lista de posts.
   * - Si el post ya está en caché NO vuelve a consultar el servidor
   *   (evita peticiones redundantes al navegar entre pantallas).
   * - Sí pide el conteo real de likes al servidor (no te fías del campo
   *   `likes_count` que puede estar desfasado).
   */
  const precargarLikes = useCallback((lista, token) => {
    if (!lista?.length || !token) return

    const cache = leerCache()
    const sinCache = lista.filter(p => !(p.id in cache))
    if (!sinCache.length) return // todo ya está cacheado, nada que hacer

    const headers = { Authorization: `Bearer ${token}` }

    Promise.allSettled(
      sinCache.map(p =>
        Promise.all([
          // ¿El usuario actual dio like?
          fetch(`/api/posts/${p.id}/user-like`, { headers })
            .then(r => r.ok ? r.json() : { liked: false })
            .then(d => !!d.liked),
          // Conteo real desde el servidor
          fetch(`/api/posts/${p.id}/likes/count`)
            .then(r => r.ok ? r.json() : { count: p.likes_count || 0 })
            .then(d => typeof d.count === 'number' ? d.count : (p.likes_count || 0))
        ]).then(([liked, count]) => ({ id: p.id, liked, count }))
      )
    ).then(results => {
      const nuevos = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          nuevos[r.value.id] = { liked: r.value.liked, count: r.value.count }
        }
      })
      if (Object.keys(nuevos).length) {
        actualizarMapa(prev => ({ ...prev, ...nuevos }))
      }
    })
  }, [actualizarMapa])

  /**
   * Da o quita like de un post.
   * - Usa optimistic update: cambia la UI al instante y revierte si falla.
   * - Acepta el evento del botón para hacer stopPropagation.
   * - token puede venir como tercer argumento o se lee de localStorage.
   */
  const toggleLike = useCallback(async (post, e, token) => {
    if (e?.stopPropagation) e.stopPropagation()

    const tkn = token || localStorage.getItem('token')
    if (!tkn) return

    const id = post.id
    const cache = leerCache()
    const yaLiked = cache[id]?.liked ?? false
    const countActual = cache[id]?.count ?? post.likes_count ?? 0

    // — Optimistic update —
    actualizarMapa(prev => ({
      ...prev,
      [id]: { liked: !yaLiked, count: yaLiked ? countActual - 1 : countActual + 1 }
    }))

    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: yaLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${tkn}` }
      })

      if (!res.ok) throw new Error('Like request failed')

      // Tras confirmar, sincroniza el conteo real desde el servidor
      const countRes = await fetch(`/api/posts/${id}/likes/count`)
      if (countRes.ok) {
        const data = await countRes.json()
        const countReal = typeof data.count === 'number' ? data.count : (yaLiked ? countActual - 1 : countActual + 1)
        actualizarMapa(prev => ({
          ...prev,
          [id]: { liked: !yaLiked, count: countReal }
        }))
      }
    } catch {
      // — Revertir si falla —
      actualizarMapa(prev => ({
        ...prev,
        [id]: { liked: yaLiked, count: countActual }
      }))
    }
  }, [actualizarMapa])

  return { likesMap, precargarLikes, toggleLike }
}