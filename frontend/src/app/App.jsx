import { useState } from 'react'
import WelcomeScreen from '../pages/WelcomeScreen'
import RegisterScreen from '../pages/RegisterScreen'
import LoginScreen from '../pages/LoginScreen'
import InicioScreen from '../pages/InicioScreen'
import ExplorarScreen from '../pages/ExplorarScreen'
import PerfilScreen from '../pages/PerfilScreen'
import ConfiguracionScreen from '../pages/ConfiguracionScreen'
import CrearScreen from '../pages/CrearScreen'
import ComunidadScreen from '../pages/ComunidadScreen'

export default function App() {
  const [screen, setScreen] = useState('welcome')
  const [comunidadActual, setComunidadActual] = useState(null) 

  const irAComunidad = (comunidad) => {                         
    setComunidadActual(comunidad)
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
          onPerfil={() => setScreen('perfil')}
          onConfiguracion={() => setScreen('configuracion')}
          onCrear={() => setScreen('crear')}
          onComunidad={irAComunidad} 
        />
      )}
      {screen === 'explorar' && (
        <ExplorarScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => setScreen('perfil')}
          onConfiguracion={() => setScreen('configuracion')}
          onCrear={() => setScreen('crear')}
          onComunidad={irAComunidad}
        />
      )}
      {screen === 'perfil' && (
        <PerfilScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => setScreen('perfil')}
          onCrear={() => setScreen('crear')}
        />
      )}
      {screen === 'configuracion' && (
        <ConfiguracionScreen
          onBack={() => setScreen('inicio')}
          onInicio={() => setScreen('inicio')}
          onExplorar={() => setScreen('explorar')}
          onPerfil={() => setScreen('perfil')}
          onLogout={() => setScreen('welcome')}
          onCrear={() => setScreen('crear')}
        />
      )}
      {screen === 'crear' && (
        <CrearScreen
          onInicio={() => setScreen('inicio')}
          onExplorar={() => setScreen('explorar')}
          onPerfil={() => setScreen('perfil')}
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
          onPerfil={() => setScreen('perfil')}
          onCrear={() => setScreen('crear')}
        />
      )}
    </>
  )
}