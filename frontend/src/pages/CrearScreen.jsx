import { useState } from 'react'
import '../styles/habitual.css'
import '../styles/crear.css'

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

export default function CrearScreen({ onInicio, onExplorar, onPerfil }) {
  const [actividad, setActividad]   = useState('')
  const [comentario, setComentario] = useState('')
  const [archivo, setArchivo]       = useState(null)
  const [publicado, setPublicado]   = useState(false)

  function publicar() {
    if (!actividad) { alert('Selecciona una actividad'); return }
    // TODO: reemplazar por llamada a la API cuando conectes la BD
    setPublicado(true)
    setTimeout(() => { setPublicado(false); onPerfil() }, 1000)
  }

  function cancelar() {
    setActividad('')
    setComentario('')
    setArchivo(null)
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
      <nav className="inicio-nav">
        <button className="inicio-nav-item" onClick={onInicio}>
          <span>⌂</span><span>Inicio</span>
        </button>
        <button className="inicio-nav-item" onClick={onExplorar}>
          <span>🔍</span><span>Búsqueda</span>
        </button>
        <button className="inicio-nav-item" onClick={onPerfil}>
          <span>👤</span><span>Perfil</span>
        </button>
        <button className="inicio-nav-item inicio-nav-item--active">
          <span>＋</span><span>Crear</span>
        </button>
      </nav>

      {/* ── Modal centrado ── */}
      <div className="crear-overlay">
        <div className="crear-modal">

          <h2 className="crear-titulo">Añadir Publicación</h2>

          <select className="crear-select" value={actividad} onChange={e => setActividad(e.target.value)}>
            <option value="">Seleccionar Actividad ∨</option>
            {/* Descomentar cuando conectes la BD:
            {actividades.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)} */}
            <option value="running">Running</option>
            <option value="yoga">Yoga</option>
            <option value="gym">Gimnasio</option>
            <option value="ciclismo">Ciclismo</option>
          </select>

          <textarea
            className="crear-textarea"
            placeholder="Añadir comentario..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
          />

          <label className="crear-archivo">
            {archivo ? archivo.name : 'Añadir archivo multimedia'}
            <input type="file" accept="image/*,video/*,audio/*" style={{ display: 'none' }} onChange={e => setArchivo(e.target.files[0])} />
          </label>

          <div className="crear-botones">
            <button className="hb-btn hb-btn--secondary crear-btn" onClick={cancelar}>Cancelar</button>
            <button className="hb-btn hb-btn--primary crear-btn"   onClick={publicar}>Publicar</button>
          </div>

        </div>
      </div>

    </div>
  )
}
