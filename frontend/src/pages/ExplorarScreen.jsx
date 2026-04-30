// ExplorarScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import logo from '../assets/logo.png'
import BottomNav from '../components/BottomNav'
import { loadLikesCache, saveLikesCache } from '../utils/likesCache'

async function fetchExploracion(page) {
  await new Promise(r => setTimeout(r, 600))
  return Array.from({ length: 18 }, (_, i) => ({
    id: `explorar-${page * 18 + i}`,   // prefijo para no colisionar con likes del feed
    url: `https://picsum.photos/seed/${page * 18 + i}/400/400`,
    tipo: 'imagen',
    usuario: 'usuario',
    likes: 142,
  }))
}

export default function ExplorarScreen({ onPerfil, onExplorar, onInicio, onUsuario, onCrear }) {
  const [posts,   setPosts]   = useState([])
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef(null)

  // ── Likes persistentes (mismo patrón que InicioScreen) ──────────────────
  const [likesMap, setLikesMap] = useState(() => loadLikesCache())

  useEffect(() => {
    saveLikesCache(likesMap)
  }, [likesMap])
  // ────────────────────────────────────────────────────────────────────────

  const toggleLike = (post, e) => {
    e.stopPropagation()
    const id = post.id
    const yaLiked  = likesMap[id]?.liked ?? false
    const countAct = likesMap[id]?.count ?? post.likes ?? 0

    setLikesMap(prev => ({
      ...prev,
      [id]: {
        liked: !yaLiked,
        count: yaLiked ? countAct - 1 : countAct + 1,
      },
    }))
  }

  const cargarMas = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nuevos = await fetchExploracion(page)
      if (nuevos.length === 0) {
        setHasMore(false)
      } else {
        // Inicializar en likesMap los posts que aún no tienen entrada
        setLikesMap(prev => {
          const copia = { ...prev }
          let cambio = false
          nuevos.forEach(p => {
            if (!(p.id in copia)) {
              copia[p.id] = { liked: false, count: p.likes }
              cambio = true
            }
          })
          return cambio ? copia : prev
        })
        setPosts(prev => [...prev, ...nuevos])
        setPage(prev => prev + 1)
      }
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page])

  useEffect(() => { cargarMas() }, []) // eslint-disable-line

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) cargarMas() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [cargarMas])

  return (
    <div className="hb-screen inicio-screen">

      <div className="inicio-header">
        <img src={logo} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" aria-label="Ajustes">⚙️</button>
      </div>

      <div className="explorar-search-wrapper">
        <input
          type="search"
          className="explorar-search-input"
          placeholder="🔍  Buscar"
        />
      </div>

      <section className="explorar-grid">
        {posts.map(post => {
          const liked = likesMap[post.id]?.liked ?? false
          const count = likesMap[post.id]?.count ?? post.likes

          return (
            <div key={post.id} className="explorar-grid-item">
              <div className="explorar-overlay-top">
                <button
                  className="explorar-usuario-btn"
                  onClick={() => onUsuario?.(post.usuario)}
                >
                  @{post.usuario}
                </button>
              </div>
              <img src={post.url} alt="" />
              <div className="explorar-overlay-bottom">
                <button
                  className="explorar-like-btn"
                  onClick={e => toggleLike(post, e)}
                >
                  <span className={`explorar-corazon ${liked ? 'explorar-corazon--lleno' : ''}`}>♥</span>
                  <span className="explorar-likes-num">{count}</span>
                </button>
              </div>
            </div>
          )
        })}
        <div ref={sentinelRef} style={{ height: 1, gridColumn: '1 / -1' }} />
      </section>

      {loading && <div className="inicio-loading"><span>Cargando…</span></div>}
      {!hasMore && <div className="inicio-loading"><span>Ya lo has visto todo 🎉</span></div>}

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