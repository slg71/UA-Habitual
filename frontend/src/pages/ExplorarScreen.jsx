// ExplorarScreen.jsx
import { useState, useEffect, useCallback } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import '../styles/explorar.css'
import logoLight from '../assets/logo.png'
import logoDark from '../assets/logodark.png'
import BottomNav from '../components/common/BottomNav'
import ExplorePostCard from '../components/ExplorePostCard'
import ExplorePostDetailModal from '../components/ExplorePostDetailModal'
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
  const [modoOscuro, setModoOscuro] = useState(document.body.classList.contains('dark-mode'))

  // ── Likes persistentes (mismo patrón que InicioScreen y PerfilScreen) ──
  const [likesMap, setLikesMap] = useState(() => loadLikesCache())

  // Detectar cambios en modo oscuro
  useEffect(() => {
    const observador = new MutationObserver(() => {
      setModoOscuro(document.body.classList.contains('dark-mode'))
    })
    observador.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observador.disconnect()
  }, [])

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
        <img src={modoOscuro ? logoDark : logoLight} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
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
        <p className="explorar-state">Cargando publicaciones…</p>
      ) : postsFiltrados.length === 0 ? (
        <p className="explorar-state">
          {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay publicaciones disponibles.'}
        </p>
      ) : (
        <div className="perfil-galeria explorar-feed">
          {postsFiltrados.map(post => (
            <ExplorePostCard
              key={post.id}
              post={post}
              liked={likesMap[post.id]?.liked ?? false}
              likeCount={likesMap[post.id]?.count ?? post.likes_count ?? 0}
              onOpenPost={setPostSeleccionado}
              onOpenAuthor={abrirPerfil}
              onToggleLike={toggleLike}
              formatDate={formatearFecha}
              parseUrl={parsearUrl}
            />
          ))}
        </div>
      )}

      {postSeleccionado && (
        <ExplorePostDetailModal
          post={postSeleccionado}
          liked={likesMap[postSeleccionado.id]?.liked ?? false}
          likeCount={likesMap[postSeleccionado.id]?.count ?? postSeleccionado.likes_count ?? 0}
          commentCount={commentCount}
          onLike={toggleLike}
          onClose={() => setPostSeleccionado(null)}
          onOpenAuthor={abrirPerfil}
          onCommentCountChange={setCommentCount}
          formatDate={formatearFecha}
          parseUrl={parsearUrl}
        />
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