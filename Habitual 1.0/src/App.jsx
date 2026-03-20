import { useState } from 'react'
import WelcomeScreen from './pages/WelcomeScreen'
import RegisterScreen from './pages/RegisterScreen'
import LoginScreen from './pages/LoginScreen'
import InicioScreen from './pages/InicioScreen'

export default function App() {
  const [screen, setScreen] = useState('welcome') // 'welcome' | 'register' | 'login'

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen
          onRegister={() => setScreen('register')}
          onLogin={() => setScreen('login')}
        />
      )}
      {screen === 'register' && (
        <RegisterScreen onBack={() => setScreen('welcome')} />
      )}
      {screen === 'login' && (
        <LoginScreen onBack={() => setScreen('welcome')}
        onInicio={() => setScreen('inicio')}
        />
      )}
      {screen === 'inicio' && (
        <InicioScreen 
        onLogin={() => setScreen('login')}
        />
      )}
    </>
  )
}