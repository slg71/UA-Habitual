import { useState, useEffect } from 'react'
import '../styles/habitual.css'
import '../styles/configuracion.css'
import BottomNav from '../components/BottomNav'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken, getUserIdFromToken, loadUserSettings, saveUserSettings, clearUserSettings } from '../utils/auth'

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
  const [modoOscuro, setModoOscuro]           = useState(() => {
    const stored = loadUserSettings()
    return stored?.modoOscuro ?? document.body.classList.contains('dark-mode')
  })
  const [textoGrande, setTextoGrande]         = useState(() => {
    const stored = loadUserSettings()
    return stored?.textoGrande ?? document.body.classList.contains('texto-grande')
  })
  const [altoContraste, setAltoContraste]     = useState(() => {
    const stored = loadUserSettings()
    return stored?.altoContraste ?? document.body.classList.contains('alto-contraste')
  })
  const [editPerfilOpen, setEditPerfilOpen]   = useState(false)
  const [perfilUsername, setPerfilUsername]   = useState('')
  const [editUsername, setEditUsername]       = useState('')
  const [perfilEmail, setPerfilEmail]         = useState('')
  const [editEmail, setEditEmail]             = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarFile, setAvatarFile]           = useState(null)
  const [bannerFile, setBannerFile]           = useState(null)
  const [editError, setEditError]             = useState('')
  const [editSuccess, setEditSuccess]         = useState('')
  const [editLoading, setEditLoading]         = useState(false)
  const [editSaving, setEditSaving]           = useState(false)
  const [modalEliminar, setModalEliminar]     = useState(false)
  const [passEliminar, setPassEliminar]       = useState('')
  const [confirmPass, setConfirmPass]         = useState('')
  const [errorEliminar, setErrorEliminar]     = useState('')
  const [cuentaEliminada, setCuentaEliminada] = useState(false)
  const [configMessage, setConfigMessage]     = useState('')
  const [deleteLoading, setDeleteLoading]     = useState(false)

  const guardarPreferencias = () => {
    saveUserSettings({ modoOscuro, textoGrande, altoContraste })
    setConfigMessage('Preferencias guardadas.')
  }

  const restaurarPreferencias = () => {
    setModoOscuro(false)
    setTextoGrande(false)
    setAltoContraste(false)
    clearUserSettings()
    setConfigMessage('Preferencias restauradas.')
  }

  useEffect(() => {
    if (!configMessage) return
    const timeoutId = setTimeout(() => setConfigMessage(''), 2800)
    return () => clearTimeout(timeoutId)
  }, [configMessage])

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
        setAvatarFile(null)
        setBannerFile(null)
      })
      .catch(error => {
        setEditError(error.message || 'No se pudo cargar el perfil')
      })
      .finally(() => setEditLoading(false))
  }, [editPerfilOpen])

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

    const hasUsernameChange = editUsername !== perfilUsername
    const hasEmailChange = editEmail !== perfilEmail
    const hasPasswordChange = newPassword
    const hasAvatarChange = avatarFile !== null
    const hasBannerChange = bannerFile !== null

    if (!hasUsernameChange && !hasEmailChange && !hasPasswordChange && !hasAvatarChange && !hasBannerChange) {
      setEditError('No hay cambios para guardar.')
      return
    }

    setEditSaving(true)

    // Si hay cambios de archivo, usar FormData
    if (hasAvatarChange || hasBannerChange) {
      const formData = new FormData()
      
      if (hasUsernameChange) formData.append('username', editUsername)
      if (hasEmailChange) formData.append('email', editEmail)
      if (hasPasswordChange) formData.append('password', newPassword)
      if (avatarFile) formData.append('avatar', avatarFile)
      if (bannerFile) formData.append('banner', bannerFile)

      fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: formData
      })
        .then(async response => {
          const data = await response.json()
          console.log('Response from server:', { status: response.status, data })
          if (!response.ok) throw new Error(data.error || `Error al actualizar perfil (${response.status})`)
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
          // Navegar al perfil para recargar la imagen
          setTimeout(() => {
            if (onPerfil) onPerfil()
          }, 500)
        })
        .catch(error => {
          console.error('Error al guardar perfil:', error)
          setEditError(error.message || 'Error al actualizar perfil')
        })
        .finally(() => setEditSaving(false))
    } else {
      // Si no hay cambios de archivo, usar JSON
      const payload = {}
      if (hasUsernameChange) payload.username = editUsername
      if (hasEmailChange) payload.email = editEmail
      if (hasPasswordChange) payload.password = newPassword

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
          // Navegar al perfil para recargar la imagen
          setTimeout(() => {
            if (onPerfil) onPerfil()
          }, 500)
        })
        .catch(error => {
          setEditError(error.message || 'Error al actualizar perfil')
        })
        .finally(() => setEditSaving(false))
    }
  }

  function confirmarEliminar() {
    if (!passEliminar || !confirmPass) {
      setErrorEliminar('Rellena ambos campos')
      return
    }
    if (passEliminar !== confirmPass) {
      setErrorEliminar('Las contraseñas no coinciden')
      return
    }

    const token = getStoredToken()
    if (!token) {
      setErrorEliminar('No hay sesión activa.')
      return
    }

    setErrorEliminar('')
    setDeleteLoading(true)

    fetch(`${API_BASE}/profile`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify({ password: passEliminar })
    })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Error al eliminar la cuenta')
        return data
      })
      .then(() => {
        setModalEliminar(false)
        setCuentaEliminada(true)
        setPassEliminar('')
        setConfirmPass('')
        setTimeout(() => {
          setCuentaEliminada(false)
          if (onLogout) onLogout()
        }, 2000)
      })
      .catch(error => {
        setErrorEliminar(error.message || 'No se pudo eliminar la cuenta')
      })
      .finally(() => setDeleteLoading(false))
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
        <button className="hb-btn hb-btn--secondary cfg-btn" onClick={restaurarPreferencias}>Reestablecer</button>
        <button className="hb-btn hb-btn--primary cfg-btn" onClick={guardarPreferencias}>Guardar</button>
      </div>
      {configMessage && <p className="cfg-success cfg-config-message">{configMessage}</p>}
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
                      }}
                    />
                  </div>

                  <div className="hb-field">
                    <label>Foto de portada</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null
                        setBannerFile(file)
                      }}
                    />
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
              <button className="hb-btn hb-btn--secondary cfg-btn" onClick={() => { setModalEliminar(false); setPassEliminar(''); setConfirmPass(''); setErrorEliminar('') }}>Cancelar</button>
              <button className="hb-btn hb-btn--primary cfg-btn" onClick={confirmarEliminar} disabled={deleteLoading}>{deleteLoading ? 'Eliminando...' : 'Confirmar'}</button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}