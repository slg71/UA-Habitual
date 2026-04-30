import { useEffect, useState } from 'react'
import WelcomeScreen from '../pages/WelcomeScreen'
import RegisterScreen from '../pages/RegisterScreen'
import LoginScreen from '../pages/LoginScreen'
import InicioScreen from '../pages/InicioScreen'
import ExplorarScreen from '../pages/ExplorarScreen'
import PerfilScreen from '../pages/PerfilScreen'
import ConfiguracionScreen from '../pages/ConfiguracionScreen'
import CrearScreen from '../pages/CrearScreen'
import ComunidadScreen from '../pages/ComunidadScreen'
import { clearStoredToken, getStoredToken } from '../utils/auth'

const SCREEN_STORAGE_KEY = 'habitual_last_screen_v1'
const COMMUNITY_STORAGE_KEY = 'habitual_last_community_v1'
const PROFILE_STORAGE_KEY = 'habitual_last_profile_user_v1'
const AUTH_SCREENS = new Set(['inicio', 'explorar', 'perfil', 'configuracion', 'crear'])
const PUBLIC_SCREENS = new Set(['welcome', 'register', 'login'])

function getInitialScreen() {
  const token = getStoredToken()
  const savedScreen = localStorage.getItem(SCREEN_STORAGE_KEY)
  const savedCommunity = localStorage.getItem(COMMUNITY_STORAGE_KEY)

  if (token) {
    if (savedScreen === 'comunidad' && savedCommunity) return 'comunidad'
    if (AUTH_SCREENS.has(savedScreen)) return savedScreen
    return 'inicio'
  }

  if (PUBLIC_SCREENS.has(savedScreen)) return savedScreen
  return 'welcome'
}

export default function App() {
  const [screen, setScreen] = useState(() => getInitialScreen())
  const [perfilVisitadoId, setPerfilVisitadoId] = useState(() => localStorage.getItem(PROFILE_STORAGE_KEY) || null)
  const [comunidadActual, setComunidadActual] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (screen === 'comunidad') {
      localStorage.setItem(SCREEN_STORAGE_KEY, 'comunidad')
      localStorage.removeItem(PROFILE_STORAGE_KEY)
      return
    }

    if (screen === 'welcome' || screen === 'register' || screen === 'login' || AUTH_SCREENS.has(screen)) {
      localStorage.setItem(SCREEN_STORAGE_KEY, screen)
      if (screen !== 'perfil' || !perfilVisitadoId) {
        localStorage.removeItem(PROFILE_STORAGE_KEY)
      }
    }
  }, [screen, perfilVisitadoId])

  const handleLogout = () => {
    clearStoredToken()
    localStorage.removeItem(SCREEN_STORAGE_KEY)
    localStorage.removeItem(COMMUNITY_STORAGE_KEY)
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    setComunidadActual(null)
    setPerfilVisitadoId(null)
    setScreen('welcome')
  }

  const abrirPerfilUsuario = (userId = null) => {
    const siguienteId = userId ? String(userId) : null
    setPerfilVisitadoId(siguienteId)
    if (siguienteId) {
      localStorage.setItem(PROFILE_STORAGE_KEY, siguienteId)
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY)
    }
    setScreen('perfil')
  }

  const irAComunidad = (comunidad) => {
    setComunidadActual(comunidad)
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(comunidad))
    setScreen('comunidad')
  }

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen
          onRegister={() => setScreen('register')}
          onLogin={() => setScreen('login')}
        />
      )}
      {screen === 'register' && (
        <RegisterScreen
          onBack={() => setScreen('welcome')}
          onLogin={() => setScreen('login')}
        />
      )}
      {screen === 'login' && (
        <LoginScreen
          onBack={() => setScreen('welcome')}
          onInicio={() => setScreen('inicio')}
        />
      )}
      {screen === 'inicio' && (
        <InicioScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => abrirPerfilUsuario(null)}
          onConfiguracion={() => setScreen('configuracion')}
          onCrear={() => setScreen('crear')}
          onComunidad={irAComunidad} 
          onVerPerfil={abrirPerfilUsuario}
        />
      )}
      {screen === 'explorar' && (
        <ExplorarScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => abrirPerfilUsuario(null)}
          onConfiguracion={() => setScreen('configuracion')}
          onCrear={() => setScreen('crear')}
          onComunidad={irAComunidad}
        />
      )}
      {screen === 'perfil' && (
        <PerfilScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => abrirPerfilUsuario(null)}
          onCrear={() => setScreen('crear')}
          onConfiguracion={() => setScreen('configuracion')}
          onVerPerfil={abrirPerfilUsuario}
          perfilVisitadoId={perfilVisitadoId}
        />
      )}
      {screen === 'configuracion' && (
        <ConfiguracionScreen
          onBack={() => setScreen('inicio')}
          onInicio={() => setScreen('inicio')}
          onExplorar={() => setScreen('explorar')}
          onPerfil={() => abrirPerfilUsuario(null)}
          onLogout={handleLogout}
          onCrear={() => setScreen('crear')}
        />
      )}
      {screen === 'crear' && (
        <CrearScreen
          onInicio={() => setScreen('inicio')}
          onExplorar={() => setScreen('explorar')}
          onPerfil={() => abrirPerfilUsuario(null)}
          onCrear={() => setScreen('crear')}
          onConfiguracion={() => setScreen('configuracion')}
        />
      )}
      {screen === 'comunidad' && (        
        <ComunidadScreen
          comunidad={comunidadActual}
          onBack={() => setScreen('inicio')}
          onInicio={() => setScreen('inicio')}
          onExplorar={() => setScreen('explorar')}
          onPerfil={() => abrirPerfilUsuario(null)}
          onCrear={() => setScreen('crear')}
          onVerPerfil={abrirPerfilUsuario}
        />
      )}
    </>
  )
}