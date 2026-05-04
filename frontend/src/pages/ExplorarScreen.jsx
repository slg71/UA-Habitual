// ExplorarScreen.jsx
import { useState, useEffect, useCallback } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import logo from '../assets/logo.png'
import BottomNav from '../components/BottomNav'
import CommentsSection from '../components/CommentsSection'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken, getUserIdFromToken } from '../utils/auth'
import { loadLikesCache, saveLikesCache } from '../utils/likesCache'

const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

const formatearFecha = iso =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

export default function ExplorarScreen({ onPerfil, onExplorar, onInicio, onCrear, onVerPerfil, onConfiguracion }) {
  const [posts, setPosts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [postSeleccionado, setPostSeleccionado] = useState(null)
  const [commentCount, setCommentCount] = useState(0)

  // ── Likes persistentes (mismo patrón que InicioScreen y PerfilScreen) ──
  const [likesMap, setLikesMap] = useState(() => loadLikesCache())

  useEffect(() => {
    saveLikesCache(likesMap)
  }, [likesMap])

  // ── Cargar TODOS los posts de TODAS las comunidades ──────────────────────
  const cargarPosts = useCallback(async () => {
    setCargando(true)
    const token = getStoredToken()

    try {
      // 1. Obtener todas las comunidades públicas
      const resComunidades = await fetch(`${API_BASE}/communities`)
      const todasComunidades = resComunidades.ok ? await resComunidades.json() : []
      const lista = Array.isArray(todasComunidades) ? todasComunidades : []

      if (lista.length === 0) {
        setPosts([])
        setCargando(false)
        return
      }

      // 2. Obtener posts de cada comunidad
      const resultados = await Promise.allSettled(
        lista.map(c =>
          fetch(`${API_BASE}/community/${c.id}/posts`)
            .then(r => r.ok ? r.json() : [])
            .then(posts =>
              (Array.isArray(posts) ? posts : []).map(p => ({
                ...p,
                community_name: c.name
              }))
            )
        )
      )

      const todos = resultados
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setPosts(todos)

      if (todos.length === 0 || !token) return

      // 3. Precargar estado liked para posts sin caché
      const cacheActual = loadLikesCache()
      const sinCache = todos.filter(p => !(p.id in cacheActual))

      if (sinCache.length > 0) {
        const likeStates = await Promise.allSettled(
          sinCache.map(p =>
            fetch(`${API_BASE}/posts/${p.id}/user-like`, { headers: getAuthHeaders(token) })
              .then(r => r.ok ? r.json() : { liked: false })
              .then(data => ({ id: p.id, liked: !!data.liked, count: p.likes_count || 0 }))
          )
        )

        const nuevos = {}
        likeStates.forEach(r => {
          if (r.status === 'fulfilled') nuevos[r.value.id] = { liked: r.value.liked, count: r.value.count }
        })

        if (Object.keys(nuevos).length > 0) {
          setLikesMap(prev => ({ ...prev, ...nuevos }))
        }
      }

      // 4. Actualizar counts reales del servidor
      const countUpdates = await Promise.allSettled(
        todos.map(p =>
          fetch(`${API_BASE}/posts/${p.id}/likes/count`)
            .then(r => r.ok ? r.json() : null)
            .then(data => data ? { id: p.id, count: data.count } : null)
        )
      )

      const countMap = {}
      countUpdates.forEach(r => {
        if (r.status === 'fulfilled' && r.value) countMap[r.value.id] = r.value.count
      })

      if (Object.keys(countMap).length > 0) {
        setLikesMap(prev => {
          const actualizado = { ...prev }
          Object.entries(countMap).forEach(([id, count]) => {
            actualizado[id] = { liked: actualizado[id]?.liked ?? false, count }
          })
          return actualizado
        })
      }
    } catch (err) {
      console.error('Error cargando explorar:', err)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarPosts() }, [])

  // ── Toggle like — idéntico a InicioScreen ────────────────────────────────
  const toggleLike = async (post, e) => {
    e.stopPropagation()
    const token = getStoredToken()
    if (!token) return
    const id = post.id
    const yaLiked = likesMap[id]?.liked ?? false
    const countActual = likesMap[id]?.count ?? post.likes_count ?? 0

    // Optimistic update
    setLikesMap(prev => ({
      ...prev,
      [id]: { liked: !yaLiked, count: yaLiked ? countActual - 1 : countActual + 1 }
    }))

    try {
      const res = await fetch(`${API_BASE}/posts/${id}/like`, {
        method: yaLiked ? 'DELETE' : 'POST',
        headers: getAuthHeaders(token)
      })
      if (!res.ok) throw new Error('Like failed')

      const countRes = await fetch(`${API_BASE}/posts/${id}/likes/count`)
      if (countRes.ok) {
        const data = await countRes.json()
        const countReal = typeof data.count === 'number' ? data.count : (yaLiked ? countActual - 1 : countActual + 1)
        setLikesMap(prev => ({ ...prev, [id]: { liked: !yaLiked, count: countReal } }))
      }
    } catch {
      setLikesMap(prev => ({ ...prev, [id]: { liked: yaLiked, count: countActual } }))
    }
  }

  const abrirPerfil = (userId) => {
    if (!onVerPerfil || !userId) return
    const miId = getUserIdFromToken()
    onVerPerfil(String(userId) === String(miId) ? null : userId)
  }

  // ── Filtrar por búsqueda ─────────────────────────────────────────────────
  const postsFiltrados = busqueda.trim()
    ? posts.filter(p =>
        p.content?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.community_name?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : posts

  return (
    <div className="hb-screen inicio-screen">

      <div className="inicio-header">
        <img src={logo} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" aria-label="Ajustes" onClick={onConfiguracion}>⚙️</button>
      </div>

      <div className="explorar-search-wrapper">
        <input
          type="search"
          className="explorar-search-input"
          placeholder="🔍  Buscar por contenido, usuario o comunidad"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>Cargando publicaciones…</p>
      ) : postsFiltrados.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>
          {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay publicaciones disponibles.'}
        </p>
      ) : (
        <div className="perfil-galeria" style={{ paddingBottom: 0 }}>
          {postsFiltrados.map(post => {
            const liked = likesMap[post.id]?.liked ?? false
            const likeCount = likesMap[post.id]?.count ?? post.likes_count ?? 0

            return (
              <div
                key={post.id}
                className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
                onClick={() => setPostSeleccionado(post)}
                style={{ cursor: 'pointer' }}
              >
                {post.media_url ? (
                  <img
                    src={parsearUrl(post.media_url)}
                    alt="Post"
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                {post.media_url ? (
                  <div style={{
                    display: 'none', alignItems: 'center', justifyContent: 'center',
                    padding: '20px 12px', background: 'var(--hb-green-lt)',
                    color: 'var(--hb-brown-mid)', fontSize: 12, textAlign: 'center'
                  }}>
                    📷 No se ha podido cargar la foto
                  </div>
                ) : null}
                <div className="post-footer-mini">
                  {post.username && (
                    <button
                      type="button"
                      className="post-autor post-autor--clickable"
                      onClick={e => { e.stopPropagation(); abrirPerfil(post.user_id) }}
                    >
                      @{post.username}
                    </button>
                  )}
                  {post.community_name && (
                    <span style={{ fontSize: 10, color: 'var(--hb-green-dk)', fontWeight: 600, marginBottom: 2, display: 'block' }}>
                      #{post.community_name}
                    </span>
                  )}
                  {!post.media_url && <p>{post.content}</p>}
                  <span className="post-meta">
                    <button
                      className={`like-btn ${liked ? 'liked' : ''}`}
                      onClick={e => toggleLike(post, e)}
                    >
                      {liked ? '♥' : '♡'} {likeCount}
                    </button>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal detalle post */}
      {postSeleccionado && (
        <div className="modal-overlay post-overlay" onClick={() => setPostSeleccionado(null)}>
          <div className="post-detail-card" onClick={e => e.stopPropagation()}>
            <div className="post-detail-header">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--hb-green-lt)', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, color: 'var(--hb-green-dk)', flexShrink: 0
              }}>
                {postSeleccionado.username?.[0]?.toUpperCase()}
              </div>
              <button
                type="button"
                className="post-detail-username post-detail-username-btn"
                onClick={() => abrirPerfil(postSeleccionado.user_id)}
              >
                {postSeleccionado.username}
              </button>
              {postSeleccionado.community_name && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                  #{postSeleccionado.community_name}
                </span>
              )}
            </div>
            {postSeleccionado.media_url ? (
              <img
                src={parsearUrl(postSeleccionado.media_url)}
                alt="Contenido"
                className="post-detail-img"
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            {postSeleccionado.media_url ? (
              <div style={{
                display: 'none', alignItems: 'center', justifyContent: 'center',
                padding: '32px 16px', background: 'var(--hb-green-lt)',
                color: 'var(--hb-brown-mid)', fontSize: 13, textAlign: 'center'
              }}>
                📷 No se ha podido cargar la foto
              </div>
            ) : null}
            <div className="post-detail-footer">
              <div className="post-detail-likes">
                <button
                  className={`like-btn like-btn--lg ${likesMap[postSeleccionado.id]?.liked ? 'liked' : ''}`}
                  onClick={e => toggleLike(postSeleccionado, e)}
                >
                  {likesMap[postSeleccionado.id]?.liked ? '♥' : '♡'}
                </button>
                <span className="like-count">
                  {likesMap[postSeleccionado.id]?.count ?? postSeleccionado.likes_count ?? 0}
                </span>
              </div>
              <div className="post-detail-caption">
                <strong>{postSeleccionado.username}</strong> {postSeleccionado.content}
              </div>
              {postSeleccionado.community_name && (
                <div className="post-detail-comment">
                  <strong>Comunidad:</strong> {postSeleccionado.community_name}
                </div>
              )}
              <div className="post-detail-comment">
                <strong>Comentarios:</strong> {commentCount}
              </div>
              <div className="post-detail-date">{formatearFecha(postSeleccionado.created_at)}</div>
            </div>

            <CommentsSection
              postId={postSeleccionado.id}
              onCommentCountChange={setCommentCount}
            />
          </div>
        </div>
      )}

      <BottomNav
        active="explorar"
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />
    </div>
  )
}