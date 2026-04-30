import { useEffect, useState } from 'react'
import '../styles/habitual.css'
import '../styles/crear.css'
import BottomNav from '../components/BottomNav'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken } from '../utils/auth'

// Ejemplo con API:
// const publicar = () => {
//   const formData = new FormData()
//   formData.append('actividad', actividad)
//   formData.append('comentario', comentario)
//   if (archivo) formData.append('archivo', archivo)
//   fetch('/api/publicaciones', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//     body: formData
//   }).then(r => { if (r.ok) { setPublicado(true); setTimeout(() => onInicio(), 2000) } })
// }

export default function CrearScreen({ onInicio, onExplorar, onPerfil, onCrear }) {
  const [actividad, setActividad]   = useState('')
  const [comentario, setComentario] = useState('')
  const [archivo, setArchivo]       = useState(null)
  const [publicado, setPublicado]   = useState(false)
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingActividades, setLoadingActividades] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setError('No hay sesion activa. Inicia sesion para publicar.')
      setLoadingActividades(false)
      return
    }

    const cargarComunidades = async () => {
      try {
        setLoadingActividades(true)
        setError('')

        const response = await fetch(`${API_BASE}/user/communities`, {
          headers: getAuthHeaders(token)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'No se pudieron cargar tus actividades.')
        }

        setActividades(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'No se pudieron cargar tus actividades.')
      } finally {
        setLoadingActividades(false)
      }
    }

    cargarComunidades()
  }, [])

  async function publicar() {
    const token = getStoredToken()

    if (!token) {
      setError('No hay sesion activa. Inicia sesion para publicar.')
      return
    }

    if (!actividad) {
      setError('Selecciona una actividad.')
      return
    }

    if (!comentario.trim()) {
      setError('Escribe un comentario para la publicacion.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const formData = new FormData()
      formData.append('content', comentario.trim())
      formData.append('community_id', String(Number(actividad)))
      if (archivo) {
        formData.append('media', archivo)
      }

      const response = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: formData
      })

      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo crear la publicacion.')
      }

      setPublicado(true)
      setTimeout(() => {
        setPublicado(false)
        setActividad('')
        setComentario('')
        setArchivo(null)
        onPerfil()
      }, 1000)
    } catch (err) {
      setError(err.message || 'No se pudo crear la publicacion.')
    } finally {
      setLoading(false)
    }
  }

  function cancelar() {
    setActividad('')
    setComentario('')
    setArchivo(null)
    setError('')
    onPerfil()
  }

  if (publicado) {
    return (
      <div className="hb-screen crear-publicado">
        <div className="crear-publicado-card">
          <svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="var(--hb-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
            <path d="M21 12a9 9 0 1 1-9-9" />
          </svg>
          <p className="crear-publicado-texto">Publicación subida</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hb-screen inicio-screen">

      {/* ── Nav inferior ── */}
      <BottomNav
        active="crear"
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />

      {/* ── Modal centrado ── */}
      <div className="crear-overlay">
        <div className="crear-modal">

          <h2 className="crear-titulo">Añadir Publicación</h2>

          <select className="crear-select" value={actividad} onChange={e => setActividad(e.target.value)}>
            <option value="">Seleccionar Actividad</option>
            {actividades.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {loadingActividades && <p className="crear-feedback">Cargando actividades...</p>}

          <textarea
            className="crear-textarea"
            placeholder="Añadir comentario..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
          />

          <label className="crear-archivo">
            {archivo ? archivo.name : 'Añadir archivo multimedia'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setArchivo(e.target.files[0])} />
          </label>

          <div className="crear-botones">
            <button className="hb-btn hb-btn--secondary crear-btn" onClick={cancelar} disabled={loading}>Cancelar</button>
            <button className="hb-btn hb-btn--primary crear-btn" onClick={publicar} disabled={loading || loadingActividades}>
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
          {!!error && <p className="crear-feedback crear-feedback--error">{error}</p>}

        </div>
      </div>

    </div>
  )
}
