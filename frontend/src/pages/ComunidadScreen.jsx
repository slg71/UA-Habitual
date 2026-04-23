import { useState, useEffect } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import '../styles/comunidad.css'
import '../styles/perfil.css'
import { getImagenComunidad } from '../components/comunidadImagenes'

const API_BASE = '/api'

const formatearTitulo = (str = '') =>
  str.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const getTituloComunidad = (name) => {
  if (!name) return ''
  switch (name.toLowerCase()) {
    case 'diseno_grafico': return 'Diseño Gráfico'
    default: return formatearTitulo(name)
  }
}

const formatearFecha = iso =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

export default function ComunidadScreen({ comunidad, onBack, onInicio, onExplorar, onPerfil, onCrear }) {
  const [miembro, setMiembro] = useState(true)
  const [numMiembros, setNumMiembros] = useState(null)
  const [posts, setPosts] = useState([])
  const [cargandoPosts, setCargandoPosts] = useState(true)
  const [postSeleccionado, setPostSeleccionado] = useState(null)

  const imagenHero = getImagenComunidad(comunidad?.name)

  useEffect(() => {
    if (!comunidad?.id) return

    fetch(`${API_BASE}/communities/${comunidad.id}/members`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setNumMiembros(Array.isArray(data) ? data.length : 0))
      .catch(() => setNumMiembros(0))

    fetch(`${API_BASE}/community/${comunidad.id}/posts`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setCargandoPosts(false))
  }, [comunidad?.id])

  const toggleMiembro = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    if (miembro) {
      await fetch(`${API_BASE}/communities/${comunidad.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setMiembro(false)
      setNumMiembros(n => Math.max(0, n - 1))
    } else {
      await fetch(`${API_BASE}/communities/${comunidad.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      setMiembro(true)
      setNumMiembros(n => n + 1)
    }
  }

  return (
    <div className="hb-screen comunidad-screen">

      {/* Hero */}
      <div className="comunidad-hero">
        <img src={imagenHero} alt={comunidad?.name} className="comunidad-hero-img" />
        <div className="comunidad-hero-overlay" />
        <button className="comunidad-back" onClick={onBack}>←</button>
        <div className="comunidad-hero-content">
          <h1 className="comunidad-nombre">{getTituloComunidad(comunidad?.name)}</h1>
          <div className="comunidad-meta">
            {comunidad?.category && <span className="comunidad-tag">🏷 {comunidad.category}</span>}
            {numMiembros !== null && <span className="comunidad-tag">👥 {numMiembros.toLocaleString()} Miembros</span>}
          </div>
        </div>
        <button
          className={`comunidad-seguir-btn ${miembro ? 'siguiendo' : ''}`}
          onClick={toggleMiembro}
        >
          {miembro ? 'Siguiendo' : 'Unirse'}
        </button>
      </div>

      {/* Publicaciones */}
      <div className="comunidad-posts-section">
        <div className="comunidad-posts-header">
          <span>Publicaciones</span>
        </div>

        {cargandoPosts ? (
          <p className="comunidad-empty">Cargando publicaciones…</p>
        ) : posts.length === 0 ? (
          <p className="comunidad-empty">Aún no hay publicaciones en esta comunidad.</p>
        ) : (
          <div className="perfil-galeria">
            {posts.map(post => (
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
                  <p>{post.content}</p>
                  <span className="post-meta">
                    {formatearFecha(post.created_at)}
                    <span className="like-icon">♡ {post.likes_count || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <span className="heart-icon">♡</span>
                <span className="like-count">{postSeleccionado.likes_count || 0}</span>
              </div>
              <div className="post-detail-caption">
                <strong>{postSeleccionado.username}</strong> {postSeleccionado.content}
              </div>
              <div className="post-detail-comment">
                <strong>Comunidad:</strong> {getTituloComunidad(comunidad?.name)}
              </div>
              <div className="post-detail-comment">
                <strong>Comentarios:</strong> {postSeleccionado.comments_count || 0}
              </div>
              <div className="post-detail-date">{formatearFecha(postSeleccionado.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="inicio-nav">
        <button className="inicio-nav-item" onClick={onInicio}><span>⌂</span><span>Inicio</span></button>
        <button className="inicio-nav-item" onClick={onExplorar}><span>🔍</span><span>Explorar</span></button>
        <button className="inicio-nav-item" onClick={onPerfil}><span>👤</span><span>Perfil</span></button>
        <button className="inicio-nav-item" onClick={onCrear}><span>＋</span><span>Crear</span></button>
      </nav>
    </div>
  )
}