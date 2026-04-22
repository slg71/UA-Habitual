import { useState, useEffect, useRef } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import logo from '../assets/logo.png'

const API_BASE = '/api'

export default function InicioScreen({ onPerfil, onExplorar, onInicio, onConfiguracion, onCrear, onComunidad }) {
  const [misComunidades, setMisComunidades] = useState([])
  const [todasComunidades, setTodasComunidades] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [uniendose, setUniendose] = useState(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_BASE}/user/communities`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMisComunidades(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

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

      <section className="inicio-section">
        <h2 className="inicio-section-title">
          Tus comunidades
          <button className="inicio-add-btn" aria-label="Añadir comunidad" onClick={abrirModal}>＋</button>
        </h2>

        <div className="inicio-comunidades">
          {misComunidades.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>
              Aún no perteneces a ninguna. ¡Pulsa ＋ para unirte!
            </p>
          ) : (
            misComunidades.map(c => (
              <div key={c.id} className="inicio-comunidad" onClick={() => onComunidad(c)} style={{ cursor: 'pointer' }}>
                <div className="inicio-comunidad-avatar">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <span className="inicio-comunidad-nombre">{c.name}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="inicio-feed" />

      <nav className="inicio-nav">
        <button className="inicio-nav-item inicio-nav-item--active" onClick={onInicio}>
          <span>⌂</span><span>Inicio</span>
        </button>
        <button className="inicio-nav-item" onClick={onExplorar}>
          <span>🔍</span><span>Explorar</span>
        </button>
        <button className="inicio-nav-item" onClick={onPerfil}>
          <span>👤</span><span>Perfil</span>
        </button>
        <button className="inicio-nav-item" onClick={onCrear}>
          <span>＋</span><span>Crear</span>
        </button>
      </nav>

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