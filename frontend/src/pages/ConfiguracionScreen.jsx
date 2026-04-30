import { useState, useEffect } from 'react'
import '../styles/habitual.css'
import '../styles/configuracion.css'
import BottomNav from '../components/BottomNav'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken } from '../utils/auth'

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
  const [modoOscuro, setModoOscuro]           = useState(document.body.classList.contains('dark-mode'))
  const [textoGrande, setTextoGrande]         = useState(document.body.classList.contains('texto-grande'))
  const [altoContraste, setAltoContraste]     = useState(document.body.classList.contains('alto-contraste'))
  const [editPerfilOpen, setEditPerfilOpen]   = useState(false)
  const [perfilUsername, setPerfilUsername]   = useState('')
  const [editUsername, setEditUsername]       = useState('')
  const [perfilEmail, setPerfilEmail]         = useState('')
  const [editEmail, setEditEmail]             = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarFile, setAvatarFile]           = useState(null)
  const [bannerFile, setBannerFile]           = useState(null)
  const [avatarPreview, setAvatarPreview]     = useState('')
  const [bannerPreview, setBannerPreview]     = useState('')
  const [editError, setEditError]             = useState('')
  const [editSuccess, setEditSuccess]         = useState('')
  const [editLoading, setEditLoading]         = useState(false)
  const [editSaving, setEditSaving]           = useState(false)
  const [modalEliminar, setModalEliminar]     = useState(false)
  const [passEliminar, setPassEliminar]       = useState('')
  const [confirmPass, setConfirmPass]         = useState('')
  const [errorEliminar, setErrorEliminar]     = useState('')
  const [cuentaEliminada, setCuentaEliminada] = useState(false)

  // Efecto para aplicar/quitar el modo oscuro en toda la app
  useEffect(() => {
    if (modoOscuro) document.body.classList.add('dark-mode')
    else document.body.classList.remove('dark-mode')
  }, [modoOscuro])

  // Efecto para aplicar/quitar el texto grande en toda la app
  useEffect(() => {
    if (textoGrande) document.body.classList.add('texto-grande')
    else document.body.classList.remove('texto-grande')
  }, [textoGrande])

  // Efecto para aplicar/quitar el alto contraste en toda la app
  useEffect(() => {
    if (altoContraste) document.body.classList.add('alto-contraste')
    else document.body.classList.remove('alto-contraste')
  }, [altoContraste])

  useEffect(() => {
    if (!editPerfilOpen) return

    const token = getStoredToken()
    if (!token) {
      setEditError('No hay sesión activa.')
      return
    }

    setEditLoading(true)
    setEditError('')
    setEditSuccess('')

    fetch(`${API_BASE}/profile`, {
      headers: {
        ...getAuthHeaders(token),
        'Content-Type': 'application/json'
      }
    })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el perfil')
        return data
      })
      .then(data => {
        setPerfilUsername(data.username || '')
        setEditUsername(data.username || '')
        setPerfilEmail(data.email || '')
        setEditEmail(data.email || '')
        setAvatarPreview(data.avatar_url || '')
        setBannerPreview(data.banner_url || '')
      })
      .catch(error => {
        setEditError(error.message || 'No se pudo cargar el perfil')
      })
      .finally(() => setEditLoading(false))
  }, [editPerfilOpen])

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview)
      }
    }
  }, [avatarPreview, bannerPreview])

  function guardarPerfil() {
    setEditError('')
    setEditSuccess('')

    if (!editUsername) {
      setEditError('El nombre de usuario es obligatorio.')
      return
    }

    if (!editEmail) {
      setEditError('El email es obligatorio.')
      return
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setEditError('Las contraseñas no coinciden.')
        return
      }
      if (newPassword.length < 6) {
        setEditError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
    }

    const token = getStoredToken()
    if (!token) {
      setEditError('No hay sesión activa.')
      return
    }

    const payload = {}
    if (editUsername !== perfilUsername) payload.username = editUsername
    if (editEmail !== perfilEmail) payload.email = editEmail
    if (newPassword) payload.password = newPassword
    if (!payload.username && !payload.email && !payload.password) {
      setEditError('No hay cambios para guardar.')
      return
    }

    setEditSaving(true)

    fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify(payload)
    })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Error al actualizar perfil')
        return data
      })
      .then(() => {
        setPerfilUsername(editUsername)
        setPerfilEmail(editEmail)
        setNewPassword('')
        setConfirmPassword('')
        setAvatarFile(null)
        setBannerFile(null)
        setEditSuccess('Perfil actualizado correctamente.')
        setEditPerfilOpen(false)
      })
      .catch(error => {
        setEditError(error.message || 'Error al actualizar perfil')
      })
      .finally(() => setEditSaving(false))
  }

  function confirmarEliminar() {
    if (!passEliminar || !confirmPass) { setErrorEliminar('Rellena ambos campos'); return }
    if (passEliminar !== confirmPass)  { setErrorEliminar('Las contraseñas no coinciden'); return }
    // TODO: llamar a eliminarCuenta() cuando conectamos la BD
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

        {/*toggle de Texto Grande */}
        <div className="cfg-fila">
          <span>Tamaño de texto</span>
          <div className={`cfg-toggle ${textoGrande ? 'cfg-toggle--on' : ''}`} onClick={() => setTextoGrande(v => !v)}>
            <span className="cfg-toggle-bola" />
          </div>
        </div>

        <div className="cfg-fila">
          <span>Modo oscuro</span>
          <div className={`cfg-toggle ${modoOscuro ? 'cfg-toggle--on' : ''}`} onClick={() => setModoOscuro(v => !v)}>
            <span className="cfg-toggle-bola" />
          </div>
        </div>

        <div className="cfg-fila">
          <span>Alto contraste</span>
          <div className={`cfg-toggle ${altoContraste ? 'cfg-toggle--on' : ''}`} onClick={() => setAltoContraste(v => !v)}>
            <span className="cfg-toggle-bola" />
          </div>
        </div>

        <div className="cfg-fila" style={{ cursor: 'pointer' }} onClick={() => { setEditPerfilOpen(true); setEditError(''); setEditSuccess('') }}>
          <span>Editar perfil</span>
        </div>

        {/*Botón para cerrar sesión */}
        <div className="cfg-fila" style={{ cursor: 'pointer' }} onClick={onLogout}>
          <span>Cerrar sesión</span>
        </div>

        <button className="cfg-fila-eliminar" onClick={() => { setModalEliminar(true); setErrorEliminar('') }}>
          Eliminar cuenta
        </button>

      </div>

      {/* ── Botones ── */}
      <div className="cfg-botones">
        <button className="hb-btn hb-btn--secondary cfg-btn" onClick={() => { setModoOscuro(false); setTextoGrande(false); setAltoContraste(false) }}>Reestablecer</button>
        <button className="hb-btn hb-btn--primary cfg-btn" onClick={() => alert('Guardado ✓')}>Guardar</button>
      </div>

      {/* ── Nav inferior ── */}
      <BottomNav
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />

      {/* ── Modal editar perfil ── */}
      {editPerfilOpen && (
        <div className="cfg-overlay">
          <div className="cfg-modal">

            <h2 className="cfg-modal-titulo">Editar perfil</h2>
            <p className="cfg-modal-texto">Actualiza tu nombre, email, contraseña o imágenes de perfil.</p>

            {editLoading ? (
              <p className="cfg-modal-texto">Cargando información...</p>
            ) : (
              <div className="cfg-modal-scrollable">
                <form className="hb-form" onSubmit={e => { e.preventDefault(); guardarPerfil() }}>
                  <div className="hb-field">
                    <label>Nombre de usuario</label>
                    <input
                      type="text"
                      placeholder="Tu nombre de usuario"
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                    />
                  </div>

                  <div className="hb-field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                    />
                  </div>

                  <div className="hb-field">
                    <label>Foto de perfil</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null
                        setAvatarFile(file)
                        if (file) {
                          const url = URL.createObjectURL(file)
                          setAvatarPreview(url)
                        }
                      }}
                    />
                    {avatarPreview && (
                      <img src={avatarPreview} alt="Previsualización avatar" className="cfg-image-preview" />
                    )}
                  </div>

                  <div className="hb-field">
                    <label>Foto de portada</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null
                        setBannerFile(file)
                        if (file) {
                          const url = URL.createObjectURL(file)
                          setBannerPreview(url)
                        }
                      }}
                    />
                    {bannerPreview && (
                      <img src={bannerPreview} alt="Previsualización portada" className="cfg-image-preview" />
                    )}
                  </div>

                  <div className="hb-field">
                    <label>Nueva contraseña</label>
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="hb-field">
                    <label>Confirmar contraseña</label>
                    <input
                      type="password"
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {editError && <p className="cfg-error">{editError}</p>}
                  {editSuccess && <p className="cfg-success">{editSuccess}</p>}
                </form>
              </div>
            )}

            <div className="cfg-botones">
              <button
                type="button"
                className="hb-btn hb-btn--secondary cfg-btn"
                onClick={() => {
                  setEditPerfilOpen(false)
                  setEditError('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setAvatarFile(null)
                  setBannerFile(null)
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="hb-btn hb-btn--primary cfg-btn"
                onClick={guardarPerfil}
                disabled={editSaving}
              >
                {editSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal editar perfil ── */}
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