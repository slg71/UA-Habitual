import { useState, useEffect, useRef } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import logoLight from '../assets/logo.png'
import logoDark from '../assets/logodark.png'
import BottomNav from '../components/BottomNav'
import CommentsSection from '../components/CommentsSection'
import { getImagenComunidad } from '../components/comunidadImagenes'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken, getUserIdFromToken } from '../utils/auth'
import { loadLikesCache, saveLikesCache } from '../utils/likesCache'

const formatearFecha = iso =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

export default function InicioScreen({ onPerfil, onExplorar, onInicio, onConfiguracion, onCrear, onComunidad, onVerPerfil }) {
  const [misComunidades, setMisComunidades] = useState([])
  const [todasComunidades, setTodasComunidades] = useState([])
  const [feedPosts, setFeedPosts] = useState([])
  const [cargandoFeed, setCargandoFeed] = useState(true)
  const [postSeleccionado, setPostSeleccionado] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [uniendose, setUniendose] = useState(null)
  const [modoOscuro, setModoOscuro] = useState(document.body.classList.contains('dark-mode'))
  const [commentCount, setCommentCount] = useState(0)

  // 1️⃣ INICIALIZAR desde localStorage (con clave por usuario) para que persista entre navegaciones
  const [likesMap, setLikesMap] = useState(() => loadLikesCache())

  const overlayRef = useRef(null)
  const comunidadesRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  // 2️⃣ Guardar en localStorage cada vez que likesMap cambia
  useEffect(() => {
    saveLikesCache(likesMap)
  }, [likesMap])

  // Detectar cambios en modo oscuro
  useEffect(() => {
    const observador = new MutationObserver(() => {
      setModoOscuro(document.body.classList.contains('dark-mode'))
    })
    observador.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observador.disconnect()
  }, [])

  const cargarFeedComunidades = async () => {
    const token = getStoredToken()
    if (!token) {
      setCargandoFeed(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/user/communities`, {
        headers: getAuthHeaders(token)
      })

      const comunidades = response.ok ? await response.json() : []
      const lista = Array.isArray(comunidades) ? comunidades : []
      setMisComunidades(lista)

      if (lista.length === 0) {
        setFeedPosts([])
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
      setCargandoFeed(false)

      if (todos.length > 0) {
        const cachéActual = loadLikesCache()
        const sinCache = todos.filter(p => !(p.id in cachéActual))

        if (sinCache.length > 0) {
          const likeStates = await Promise.allSettled(
            sinCache.map(p =>
              fetch(`${API_BASE}/posts/${p.id}/user-like`, {
                headers: getAuthHeaders(token)
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
    } catch {
      setCargandoFeed(false)
    }
  }

  // referencias para controlar el scroll por flechas

  useEffect(() => {
    cargarFeedComunidades()
  }, [])

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

  const abrirPerfil = (userId) => {
    if (!onVerPerfil || !userId) return
    const miId = getUserIdFromToken()
    onVerPerfil(String(userId) === String(miId) ? null : userId)
  }

  // handlers para arrastrar la lista de comunidades
  const handleMouseDown = (e) => {
    const el = comunidadesRef.current
    if (!el) return
    isDraggingRef.current = true
    el.classList.add('dragging')
    startXRef.current = e.pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
  }

  const handleMouseMove = (e) => {
    const el = comunidadesRef.current
    if (!el || !isDraggingRef.current) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = x - startXRef.current
    el.scrollLeft = scrollLeftRef.current - walk
  }

  const handleMouseUp = () => {
    const el = comunidadesRef.current
    if (!el) return
    isDraggingRef.current = false
    el.classList.remove('dragging')
  }

  const handleTouchStart = (e) => {
    const el = comunidadesRef.current
    if (!el || !e.touches?.length) return
    isDraggingRef.current = true
    startXRef.current = e.touches[0].pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
  }

  const handleTouchMove = (e) => {
    const el = comunidadesRef.current
    if (!el || !isDraggingRef.current || !e.touches?.length) return
    const x = e.touches[0].pageX - el.offsetLeft
    const walk = x - startXRef.current
    el.scrollLeft = scrollLeftRef.current - walk
  }

  const handleTouchEnd = () => {
    isDraggingRef.current = false
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
    const token = getStoredToken()
    if (!token) return alert('Debes iniciar sesión')
    setUniendose(comunidadId)
    try {
      const r = await fetch(`${API_BASE}/communities/${comunidadId}/join`, {
        method: 'POST',
        headers: getAuthHeaders(token)
      })
      if (r.ok) {
        const nueva = todasComunidades.find(c => c.id === comunidadId)
        if (nueva) setMisComunidades(prev => [...prev, nueva])
        await cargarFeedComunidades()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUniendose(null)
    }
  }

  const yaMiembro = (id) => misComunidades.some(c => c.id === id)

  const scrollComunidades = (offset = 200) => {
    const el = comunidadesRef.current
    if (!el) return
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="hb-screen inicio-screen">

      <div className="inicio-header">
        <img src={modoOscuro ? logoDark : logoLight} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
      </div>

      {/* Comunidades */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">
          Tus comunidades
          <button className="inicio-add-btn" aria-label="Añadir comunidad" onClick={abrirModal}>＋</button>
        </h2>

        <div className="inicio-comunidades-wrapper">
          <div
            className="inicio-comunidades"
            ref={comunidadesRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                      <button
                        type="button"
                        className="post-autor post-autor--clickable"
                        onClick={e => {
                          e.stopPropagation()
                          abrirPerfil(post.user_id)
                        }}
                      >
                        @{post.username}
                      </button>
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
                        <img
                          src={getImagenComunidad(c.name)}
                          alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          onError={e => {
                            e.target.style.display = 'none'
                            e.target.parentElement.textContent = c.name?.[0]?.toUpperCase()
                          }}
                        />
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