import { useState } from 'react'
import '../styles/habitual.css'
import '../styles/configuracion.css'

// Ejemplo con API:
// const guardar = () => {
//   fetch('/api/usuario/preferencias', {
//     method: 'PUT',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//     body: JSON.stringify({ modoOscuro, notificaciones })
//   })
// }

// const eliminarCuenta = () => {
//   fetch('/api/usuario/eliminar', {
//     method: 'DELETE',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//     body: JSON.stringify({ password: passEliminar })
//   }).then(r => { if (r.ok) { setCuentaEliminada(true); setTimeout(() => onLogout(), 2000) } })
// }

export default function ConfiguracionScreen({ onBack, onInicio, onExplorar, onPerfil, onLogout, onCrear }) {
  const [modoOscuro, setModoOscuro]           = useState(false)
  const [notificaciones, setNotificaciones]   = useState(true)
  const [modalEliminar, setModalEliminar]     = useState(false)
  const [passEliminar, setPassEliminar]       = useState('')
  const [confirmPass, setConfirmPass]         = useState('')
  const [errorEliminar, setErrorEliminar]     = useState('')
  const [cuentaEliminada, setCuentaEliminada] = useState(false)

  function confirmarEliminar() {
    if (!passEliminar || !confirmPass) { setErrorEliminar('Rellena ambos campos'); return }
    if (passEliminar !== confirmPass)  { setErrorEliminar('Las contraseñas no coinciden'); return }
    // TODO: llamar a eliminarCuenta() cuando conectes la BD
    setModalEliminar(false)
    setCuentaEliminada(true)
    setTimeout(() => { setCuentaEliminada(false); if (onLogout) onLogout() }, 2000)
  }

  if (cuentaEliminada) {
    return (
      <div className="hb-screen cfg-eliminada-pantalla">
        <div className="cfg-eliminada-card">
          <div className="cfg-eliminada-circulo">
            <svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="cfg-eliminada-titulo">Cuenta eliminada</p>
          <p className="cfg-eliminada-sub">Redirigiendo a Inicio</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hb-screen inicio-screen">

      {/* ── Cabecera ── */}
      <div className="inicio-header">
        <button className="hb-back cfg-back" onClick={onBack}>← Volver</button>
        <h1 className="hb-title cfg-titulo">Configuración</h1>
      </div>

      {/* ── Opciones ── */}
      <div className="cfg-lista">

        <div className="cfg-fila">
          <span>Seleccionar Idioma</span>
        </div>

        <div className="cfg-fila">
          <span>Tamaño de texto</span>
        </div>

        <div className="cfg-fila">
          <span>Modo oscuro</span>
          <div className={`cfg-toggle ${modoOscuro ? 'cfg-toggle--on' : ''}`} onClick={() => setModoOscuro(v => !v)}>
            <span className="cfg-toggle-bola" />
          </div>
        </div>

        <div className="cfg-fila">
          <span>Notificaciones</span>
          <div className={`cfg-toggle ${notificaciones ? 'cfg-toggle--on' : ''}`} onClick={() => setNotificaciones(v => !v)}>
            <span className="cfg-toggle-bola" />
          </div>
        </div>

        <div className="cfg-fila">
          <span>Editar perfil</span>
        </div>

        <button className="cfg-fila-eliminar" onClick={() => { setModalEliminar(true); setErrorEliminar('') }}>
          Eliminar cuenta
        </button>

      </div>

      {/* ── Botones ── */}
      <div className="cfg-botones">
        <button className="hb-btn hb-btn--secondary cfg-btn" onClick={() => { setModoOscuro(false); setNotificaciones(true) }}>Reestablecer</button>
        <button className="hb-btn hb-btn--primary cfg-btn" onClick={() => alert('Guardado ✓')}>Guardar</button>
      </div>

      {/* ── Nav inferior ── */}
      <nav className="inicio-nav">
        <button className="inicio-nav-item" onClick={onInicio}>
          <span>⌂</span>
          <span>Inicio</span>
        </button>
        <button className="inicio-nav-item" onClick={onExplorar}>
          <span>🔍</span>
          <span>Búsqueda</span>
        </button>
        <button className="inicio-nav-item" onClick={onPerfil}>
          <span>👤</span>
          <span>Perfil</span>
        </button>
        <button className="inicio-nav-item" onClick={onCrear}>
          <span>＋</span>
          <span>Crear</span>
        </button>
      </nav>

      {/* ── Modal eliminar cuenta ── */}
      {modalEliminar && (
        <div className="cfg-overlay">
          <div className="cfg-modal">

            <h2 className="cfg-modal-titulo">¿Desea eliminar tu cuenta?</h2>

            <p className="cfg-modal-texto">
              Se eliminarán todos los datos de la cuenta y se cerrará la sesión automáticamente.
            </p>

            <div className="hb-field">
              <label>Contraseña</label>
              <input type="password" placeholder="Contraseña" value={passEliminar} onChange={e => setPassEliminar(e.target.value)} />
            </div>

            <div className="hb-field">
              <label>Confirmar contraseña</label>
              <input type="password" placeholder="Contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>

            {errorEliminar && <p className="cfg-error">{errorEliminar}</p>}

            <div className="cfg-botones">
              <button className="hb-btn hb-btn--secondary cfg-btn" onClick={() => { setModalEliminar(false); setPassEliminar(''); setConfirmPass('') }}>Cancelar</button>
              <button className="hb-btn hb-btn--primary cfg-btn" onClick={confirmarEliminar}>Confirmar</button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
