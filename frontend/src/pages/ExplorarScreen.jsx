import { useState, useEffect, useCallback } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import '../styles/perfil.css'
import logo from '../assets/logo.png'
import BottomNav from '../components/BottomNav'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken, getUserIdFromToken } from '../utils/auth'
import { loadLikesCache, saveLikesCache } from '../utils/likesCache'

const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

export default function ExplorarScreen({ onPerfil, onExplorar, onInicio, onCrear, onVerPerfil, onConfiguracion }) {
  const [posts, setPosts] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [postSeleccionado, setPostSeleccionado] = useState(null)
  const [likesMap, setLikesMap] = useState(() => loadLikesCache())

  useEffect(() => {
    saveLikesCache(likesMap)
  }, [likesMap])

  const cargarPosts = useCallback(async () => {
    setCargando(true)
    const token = getStoredToken()
    try {
      const resComunidades = await fetch(`${API_BASE}/communities`)
      const todasComunidades = resComunidades.ok ? await resComunidades.json() : []
      const lista = Array.isArray(todasComunidades) ? todasComunidades : []

      if (lista.length === 0) {
        setPosts([])
        setCargando(false)
        return
      }

      const resultados = await Promise.allSettled(
        lista.map(c =>
          fetch(`${API_BASE}/community/${c.id}/posts`)
            .then(r => r.ok ? r.json() : [])
            .then(posts => (Array.isArray(posts) ? posts : []).map(p => ({ ...p, community_name: c.name })))
        )
      )

      const todos = resultados
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setPosts(todos)

      if (todos.length === 0 || !token) return

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
        likeStates.forEach(r => { if (r.status === 'fulfilled') nuevos[r.value.id] = { liked: r.value.liked, count: r.value.count } })
        if (Object.keys(nuevos).length > 0) setLikesMap(prev => ({ ...prev, ...nuevos }))
      }

      const countUpdates = await Promise.allSettled(
        todos.map(p =>
          fetch(`${API_BASE}/posts/${p.id}/likes/count`)
            .then(r => r.ok ? r.json() : null)
            .then(data => data ? { id: p.id, count: data.count } : null)
        )
      )
      const countMap = {}
      countUpdates.forEach(r => { if (r.status === 'fulfilled' && r.value) countMap[r.value.id] = r.value.count })
      if (Object.keys(countMap).length > 0) {
        setLikesMap(prev => {
          const actualizado = { ...prev }
          Object.entries(countMap).forEach(([id, count]) => { actualizado[id] = { liked: actualizado[id]?.liked ?? false, count } })
          return actualizado
        })
      }
    } catch (err) { console.error('Error:', err) } finally { setCargando(false) }
  }, [])

  useEffect(() => { cargarPosts() }, [])

  const toggleLike = async (post, e) => {
    e.stopPropagation()
    const token = getStoredToken()
    if (!token) return
    const id = post.id
    const yaLiked = likesMap[id]?.liked ?? false
    const countActual = likesMap[id]?.count ?? post.likes_count ?? 0

    setLikesMap(prev => ({ ...prev, [id]: { liked: !yaLiked, count: yaLiked ? countActual - 1 : countActual + 1 } }))

    try {
      const res = await fetch(`${API_BASE}/posts/${id}/like`, { method: yaLiked ? 'DELETE' : 'POST', headers: getAuthHeaders(token) })
      const countRes = await fetch(`${API_BASE}/posts/${id}/likes/count`)
      if (countRes.ok) {
        const data = await countRes.json()
        setLikesMap(prev => ({ ...prev, [id]: { liked: !yaLiked, count: data.count } }))
      }
    } catch { setLikesMap(prev => ({ ...prev, [id]: { liked: yaLiked, count: countActual } })) }
  }

  const abrirPerfil = (userId) => {
    if (!onVerPerfil || !userId) return
    const miId = getUserIdFromToken()
    onVerPerfil(String(userId) === String(miId) ? null : userId)
  }

  const postsFiltrados = busqueda.trim()
    ? posts.filter(p => p.content?.toLowerCase().includes(busqueda.toLowerCase()) || p.username?.toLowerCase().includes(busqueda.toLowerCase()) || p.community_name?.toLowerCase().includes(busqueda.toLowerCase()))
    : posts

  return (
    <div className="hb-screen inicio-screen">
      <div className="inicio-header">
        <img src={logo} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" onClick={onConfiguracion}>⚙️</button>
      </div>

      <div className="explorar-search-wrapper">
        <input
          type="search"
          className="explorar-search-input"
          placeholder="🔍   Buscar contenido, usuario o comunidad"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      <div className="perfil-galeria" style={{ paddingBottom: 0 }}>
        {postsFiltrados.map(post => {
          const liked = likesMap[post.id]?.liked ?? false
          const likeCount = likesMap[post.id]?.count ?? post.likes_count ?? 0

          return (
            <div
              key={post.id}
              className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
              onClick={() => setPostSeleccionado(post)}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              {post.media_url && <img src={parsearUrl(post.media_url)} alt="Post" />}

              {/* OVERLAY SUPERIOR: ETIQUETAS VERDES CON TEXTO CLARO */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                display: 'flex', justifyContent: 'space-between', padding: '6px 7px', zIndex: 2
              }}>
                {post.username ? (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); abrirPerfil(post.user_id) }}
                    style={{
                      background: 'var(--hb-green)', border: 'none', padding: '3px 8px', borderRadius: '10px',
                      fontSize: 9, color: 'var(--hb-bg)', fontWeight: 700, cursor: 'pointer',
                      maxWidth: '48%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}
                  >
                    @{post.username}
                  </button>
                ) : <span />}

                {post.community_name && (
                  <span style={{
                    background: 'var(--hb-green)', padding: '3px 8px', borderRadius: '10px',
                    fontSize: 9, color: 'var(--hb-bg)', fontWeight: 700,
                    maxWidth: '48%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    #{post.community_name}
                  </span>
                )}
              </div>

              {/* LIKE IZQUIERDA */}
              <button
                className={`like-btn ${liked ? 'liked' : ''}`}
                onClick={e => toggleLike(post, e)}
                style={{
                  position: 'absolute', bottom: 6, left: 7, zIndex: 2,
                  fontSize: 11, color: liked ? '#ff4d4d' : '#fff', background: 'none', border: 'none',
                  textShadow: '0 1px 3px rgba(0,0,0,0.7)', cursor: 'pointer', padding: 0
                }}
              >
                {liked ? '♥' : '♡'} {likeCount}
              </button>

              {!post.media_url && (
                <div style={{ padding: '35px 10px 25px', fontSize: 11, color: 'var(--hb-text)' }}>
                  {post.content}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Detalle (Opcional, igual al anterior) */}
      {postSeleccionado && (
        <div className="modal-overlay post-overlay" onClick={() => setPostSeleccionado(null)}>
          <div className="post-detail-card" onClick={e => e.stopPropagation()}>
            <div className="post-detail-header">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--hb-green-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--hb-green-dk)' }}>
                {postSeleccionado.username?.[0]?.toUpperCase()}
              </div>
              <button className="post-detail-username-btn" onClick={() => abrirPerfil(postSeleccionado.user_id)}>{postSeleccionado.username}</button>
            </div>
            {postSeleccionado.media_url && <img src={parsearUrl(postSeleccionado.media_url)} className="post-detail-img" />}
            <div className="post-detail-footer">
              <div className="post-detail-likes">
                <button className={`like-btn like-btn--lg ${likesMap[postSeleccionado.id]?.liked ? 'liked' : ''}`} onClick={e => toggleLike(postSeleccionado, e)}>
                  {likesMap[postSeleccionado.id]?.liked ? '♥' : '♡'}
                </button>
                <span>{likesMap[postSeleccionado.id]?.count ?? 0}</span>
              </div>
              <div className="post-detail-caption"><strong>{postSeleccionado.username}</strong> {postSeleccionado.content}</div>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="explorar" onInicio={onInicio} onExplorar={onExplorar} onPerfil={onPerfil} onCrear={onCrear} />
    </div>
  )
}