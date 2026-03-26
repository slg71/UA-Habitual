import { useState } from 'react'
import WelcomeScreen from '../pages/WelcomeScreen'
import RegisterScreen from '../pages/RegisterScreen'
import LoginScreen from '../pages/LoginScreen'
import InicioScreen from '../pages/InicioScreen'
import ExplorarScreen from '../pages/ExplorarScreen'
import PerfilScreen from '../pages/PerfilScreen'

export default function App() {
  const [screen, setScreen] = useState('welcome')

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
        />
      )}
      {screen === 'explorar' && (
        <ExplorarScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => setScreen('perfil')}
        />
      )}
      {screen === 'perfil' && (
        <PerfilScreen
          onExplorar={() => setScreen('explorar')}
          onInicio={() => setScreen('inicio')}
          onPerfil={() => setScreen('perfil')}
        />
      )}
    </>
  )
}
