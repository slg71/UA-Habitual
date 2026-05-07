import { useState, useEffect, useRef } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import logoLight from '../assets/logo.png'
import logoDark from '../assets/logodark.png'
import BottomNav from '../components/common/BottomNav'
import CommunityCarousel from '../components/CommunityCarousel'
import FeedPosts from '../components/FeedPosts'
import PostDetailModal from '../components/PostDetailModal'
import CommunitiesModal from '../components/CommunitiesModal'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken, getUserIdFromToken } from '../utils/auth'
import { loadLikesCache, saveLikesCache } from '../utils/likesCache'

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
  const [likesMap, setLikesMap] = useState(() => loadLikesCache())

  const overlayRef = useRef(null)


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

  const yaMiembro = (id) => misComunidades.some(c => c.id === id)

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

  return (
    <div className="hb-screen inicio-screen">
      <div className="inicio-header">
        <img src={modoOscuro ? logoDark : logoLight} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
      </div>

      <CommunityCarousel
        communities={misComunidades}
        onSelectCommunity={onComunidad}
        onAddClick={abrirModal}
      />

      <FeedPosts
        posts={feedPosts}
        likesMap={likesMap}
        loading={cargandoFeed}
        onLike={toggleLike}
        onSelectPost={setPostSeleccionado}
        onAuthorClick={abrirPerfil}
      />

      {postSeleccionado && (
        <PostDetailModal
          post={postSeleccionado}
          liked={likesMap[postSeleccionado.id]?.liked ?? false}
          likeCount={likesMap[postSeleccionado.id]?.count ?? postSeleccionado.likes_count ?? 0}
          onLike={toggleLike}
          onClose={() => setPostSeleccionado(null)}
          onAuthorClick={abrirPerfil}
          commentCount={commentCount}
          onCommentCountChange={setCommentCount}
        />
      )}

      <BottomNav
        active="inicio"
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />

      {modalAbierto && (
        <CommunitiesModal
          communities={todasComunidades}
          loading={cargando}
          onJoin={unirseAComunidad}
          isMember={yaMiembro}
          joiningId={uniendose}
          onClose={cerrarModal}
          overlayRef={overlayRef}
        />
      )}
    </div>
  )
}