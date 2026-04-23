import { useState, useEffect } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import '../styles/comunidad.css'
import BottomNav from '../components/BottomNav'

//IMAGENES
import imgChino from '../assets/comunidades/chino.jpg'
import imgAjedrez from '../assets/comunidades/ajdrz.jpg'
import imgDiseno from '../assets/comunidades/dg.jpg'


const API_BASE = '/api'

const COMUNIDAD_IMAGENES = {
  ajedrez:          imgAjedrez,
  astronomia:       'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600',
  baile:            'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600',
  boxeo:            'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
  chino:            imgChino,
  ciclismo:         'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600',
  cine:             'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
  cocina:           'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
  coser:            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  diseno_grafico: imgDiseno,
  escalada:         'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600',
  escritura:        'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600',
  fotografia:       'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=600',
  guitarra:         'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600',
  holandes:         'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',
  ingles:           'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600',
  jardineria:       'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600',
  karate:           'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600',
  literatura:       'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600',
  meditacion:       'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
  pintura:          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600',
  programacion:     'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
  running:          'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600',
  yoga:             'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
}

const IMAGEN_FALLBACK = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600'

// Normaliza el nombre quitando tildes y pasándolo a minúsculas
const normalizarNombre = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\s+/g, '_')            // espacios → _
    .trim()

// Formatea el nombre para mostrarlo: primera letra de cada palabra en mayúscula
const formatearTitulo = (str = '') =>
  str
    .split(/[\s_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')



export default function ComunidadScreen({ comunidad, onBack, onInicio, onExplorar, onPerfil, onCrear }) {
  const [miembro, setMiembro] = useState(true)
  const [numMiembros, setNumMiembros] = useState(null)
  const [posts, setPosts] = useState([])
  const [cargandoPosts, setCargandoPosts] = useState(true)

  const nombreKey = normalizarNombre(comunidad?.name)
  const imagenHero = COMUNIDAD_IMAGENES[nombreKey] || IMAGEN_FALLBACK


  const getTituloComunidad = (name) => {
  if (!name) return ''

  switch (name.toLowerCase()) {
    case 'diseno_grafico':
      return 'Diseño Gráfico'
    default:
      return formatearTitulo(name)
  }
}

  useEffect(() => {
    if (!comunidad?.id) return

    // Cargar número de miembros
    fetch(`${API_BASE}/communities/${comunidad.id}/members`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setNumMiembros(Array.isArray(data) ? data.length : 0))
      .catch(() => setNumMiembros(0))

    // Cargar posts de la comunidad
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
        <img
          src={imagenHero}
          alt={comunidad?.name}
          className="comunidad-hero-img"
        />
        <div className="comunidad-hero-overlay" />

        <button className="comunidad-back" onClick={onBack}>←</button>

        <div className="comunidad-hero-content">
          <h1 className="comunidad-nombre">
            {getTituloComunidad(comunidad?.name)}
          </h1>
          <div className="comunidad-meta">
            {comunidad?.category && (
              <span className="comunidad-tag">🏷 {comunidad.category}</span>
            )}
            {numMiembros !== null && (
              <span className="comunidad-tag">👥 {numMiembros.toLocaleString()} Miembros</span>
            )}
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
          <div className="comunidad-posts-grid">
            {posts.map(post => (
              <div key={post.id} className="comunidad-post-card">
                <div className="comunidad-post-autor">
                  <div className="comunidad-post-avatar">
                    {post.username?.[0]?.toUpperCase()}
                  </div>
                  <span>{post.username}</span>
                </div>
                <p className="comunidad-post-content">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <BottomNav
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />
    </div>
  )
}