import { useState, useEffect, useRef } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import '../styles/perfil.css'
import logo from '../assets/logo.png'
import BottomNav from '../components/BottomNav'
import { getImagenComunidad } from '../components/comunidadImagenes'

const API_BASE = '/api'
const LIKES_CACHE_KEY = 'habitual_likes_v1'

const formatearFecha = iso =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

// ─── Utilidades de caché ──────────────────────────────────────────────────────
const leerCacheLikes = () => {
  try { return JSON.parse(localStorage.getItem(LIKES_CACHE_KEY) || '{}') }
  catch { return {} }
}

const guardarCacheLikes = (mapa) => {
  try { localStorage.setItem(LIKES_CACHE_KEY, JSON.stringify(mapa)) }
  catch {}
}

export default function InicioScreen({ onPerfil, onExplorar, onInicio, onConfiguracion, onCrear, onComunidad }) {
  const [misComunidades, setMisComunidades] = useState([])
  const [todasComunidades, setTodasComunidades] = useState([])
  const [feedPosts, setFeedPosts] = useState([])
  const [cargandoFeed, setCargandoFeed] = useState(true)
  const [postSeleccionado, setPostSeleccionado] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [uniendose, setUniendose] = useState(null)

  // 1️⃣ INICIALIZAR desde localStorage para que persista entre navegaciones
  const [likesMap, setLikesMap] = useState(() => leerCacheLikes())

  const overlayRef = useRef(null)
  const comunidadesRef = useRef(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  // 2️⃣ Guardar en localStorage cada vez que likesMap cambia
  useEffect(() => {
    guardarCacheLikes(likesMap)
  }, [likesMap])

  const onMouseDown = (e) => {
    const el = comunidadesRef.current
    dragState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
  }
  const onMouseLeave = () => {
    dragState.current.isDown = false
    if (comunidadesRef.current) comunidadesRef.current.style.cursor = 'grab'
  }
  const onMouseUp = () => {
    dragState.current.isDown = false
    if (comunidadesRef.current) comunidadesRef.current.style.cursor = 'grab'
  }
  const onMouseMove = (e) => {
    if (!dragState.current.isDown) return
    e.preventDefault()
    const el = comunidadesRef.current
    const x = e.pageX - el.offsetLeft
    const walk = (x - dragState.current.startX) * 1.2
    el.scrollLeft = dragState.current.scrollLeft - walk
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    fetch(`${API_BASE}/user/communities`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(async (comunidades) => {
        const lista = Array.isArray(comunidades) ? comunidades : []
        setMisComunidades(lista)

        if (lista.length === 0) {
          setCargandoFeed(false)
          return
        }

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

        setFeedPosts(todos)
        // 3️⃣ Los posts se muestran YA con el estado cacheado del localStorage
        setCargandoFeed(false)

        // 4️⃣ Sincronización en segundo plano: solo pedimos los posts
        // que NO están en caché, o todos si quieres frescura total.
        // Aquí pedimos solo los que no están cacheados para ser eficientes.
        if (todos.length > 0) {
          const cachéActual = leerCacheLikes()
          const sinCache = todos.filter(p => !(p.id in cachéActual))

          // Solo consultamos el servidor para posts sin caché
          if (sinCache.length > 0) {
            const likeStates = await Promise.allSettled(
              sinCache.map(p =>
                fetch(`${API_BASE}/posts/${p.id}/user-like`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                  .then(r => r.ok ? r.json() : { liked: false })
                  .then(data => ({ id: p.id, liked: !!data.liked, count: p.likes_count || 0 }))
              )
            )

            const nuevos = {}
            likeStates.forEach(r => {
              if (r.status === 'fulfilled') {
                nuevos[r.value.id] = { liked: r.value.liked, count: r.value.count }
              }
            })

            if (Object.keys(nuevos).length > 0) {
              setLikesMap(prev => ({ ...prev, ...nuevos }))
            }
          }

          // 5️⃣ Actualizar contadores reales del servidor para TODOS los posts
          // (el liked ya viene del caché, pero el count puede haber cambiado)
          const countUpdates = await Promise.allSettled(
            todos.map(p =>
              fetch(`${API_BASE}/posts/${p.id}/likes/count`)
                .then(r => r.ok ? r.json() : null)
                .then(data => data ? { id: p.id, count: data.count } : null)
            )
          )

          const countMap = {}
          countUpdates.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
              countMap[r.value.id] = r.value.count
            }
          })

          if (Object.keys(countMap).length > 0) {
            setLikesMap(prev => {
              const actualizado = { ...prev }
              Object.entries(countMap).forEach(([id, count]) => {
                actualizado[id] = {
                  liked: actualizado[id]?.liked ?? false,
                  count
                }
              })
              return actualizado
            })
          }
        }
      })
      .catch(() => setCargandoFeed(false))
  }, [])

  const toggleLike = async (post, e) => {
    e.stopPropagation()
    const token = localStorage.getItem('token')
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
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Like failed')

      // Confirmar con el count real del servidor
      const countRes = await fetch(`${API_BASE}/posts/${id}/likes/count`)
      if (countRes.ok) {
        const data = await countRes.json()
        const countReal = typeof data.count === 'number' ? data.count : (yaLiked ? countActual - 1 : countActual + 1)
        setLikesMap(prev => ({
          ...prev,
          [id]: { liked: !yaLiked, count: countReal }
        }))
      }
    } catch {
      // Revertir si falla
      setLikesMap(prev => ({
        ...prev,
        [id]: { liked: yaLiked, count: countActual }
      }))
    }
  }

  const abrirModal = async () => {
    setModalAbierto(true)
    setCargando(true)
    try {
      const r = await fetch(`${API_BASE}/communities`)
      const data = r.ok ? await r.json() : []
      setTodasComunidades(Array.isArray(data) ? data : [])
    } catch {
      setTodasComunidades([])
    } finally {
      setCargando(false)
    }
  }

  const cerrarModal = () => setModalAbierto(false)

  const unirseAComunidad = async (comunidadId) => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Debes iniciar sesión')
    setUniendose(comunidadId)
    try {
      const r = await fetch(`${API_BASE}/communities/${comunidadId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) {
        const nueva = todasComunidades.find(c => c.id === comunidadId)
        if (nueva) setMisComunidades(prev => [...prev, nueva])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUniendose(null)
    }
  }

  const yaMiembro = (id) => misComunidades.some(c => c.id === id)

  return (
    <div className="hb-screen inicio-screen">

      <div className="inicio-header">
        <img src={logo} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" aria-label="Ajustes" onClick={onConfiguracion}>⚙️</button>
      </div>

      {/* Comunidades */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">
          Tus comunidades
          <button className="inicio-add-btn" aria-label="Añadir comunidad" onClick={abrirModal}>＋</button>
        </h2>

        <div
          className="inicio-comunidades"
          ref={comunidadesRef}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          {misComunidades.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>
              Aún no perteneces a ninguna. ¡Pulsa ＋ para unirte!
            </p>
          ) : (
            misComunidades.map(c => (
              <div key={c.id} className="inicio-comunidad" onClick={() => onComunidad(c)} style={{ cursor: 'pointer' }}>
                <div className="inicio-comunidad-avatar">
                  <img
                    src={getImagenComunidad(c.name)}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <span className="inicio-comunidad-nombre">{c.name}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Feed */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">Publicaciones</h2>

        {cargandoFeed ? (
          <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>Cargando publicaciones…</p>
        ) : feedPosts.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>
            Únete a comunidades para ver sus publicaciones aquí.
          </p>
        ) : (
          <div className="perfil-galeria" style={{ paddingBottom: 0 }}>
            {feedPosts.map(post => {
              const liked = likesMap[post.id]?.liked ?? false
              const likeCount = likesMap[post.id]?.count ?? post.likes_count ?? 0

              return (
                <div
                  key={`${post.id}-${post.community_name}`}
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
                      <span className="post-autor">@{post.username}</span>
                    )}
                    <p>{post.content}</p>
                    <span className="post-meta">
                      {formatearFecha(post.created_at)}
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
      </section>

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
              <span className="post-detail-username">{postSeleccionado.username}</span>
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
                <strong>Comentarios:</strong> {postSeleccionado.comments_count || 0}
              </div>
              <div className="post-detail-date">{formatearFecha(postSeleccionado.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      <BottomNav
        active="inicio"
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />

      {/* Modal explorar comunidades */}
      {modalAbierto && (
        <div
          className="modal-overlay"
          ref={overlayRef}
          onClick={e => e.target === overlayRef.current && cerrarModal()}
        >
          <div className="modal-comunidades">
            <div className="modal-header">
              <h3>Explorar comunidades</h3>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>

            {cargando ? (
              <div className="modal-loading">Cargando comunidades…</div>
            ) : todasComunidades.length === 0 ? (
              <div className="modal-loading">No hay comunidades disponibles.</div>
            ) : (
              <div className="modal-lista">
                {todasComunidades.map(c => (
                  <div key={c.id} className="modal-comunidad-item">
                    <div className="modal-comunidad-avatar-sm">
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="modal-comunidad-info">
                      <span className="modal-comunidad-nombre">{c.name}</span>
                      {c.category && <span className="modal-comunidad-cat">{c.category}</span>}
                    </div>
                    <button
                      className={`modal-join-btn ${yaMiembro(c.id) ? 'joined' : ''}`}
                      onClick={() => !yaMiembro(c.id) && unirseAComunidad(c.id)}
                      disabled={uniendose === c.id || yaMiembro(c.id)}
                    >
                      {uniendose === c.id ? '…' : yaMiembro(c.id) ? '✓' : 'Unirse'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}