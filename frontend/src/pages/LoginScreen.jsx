import '../styles/habitual.css'
import PhotoCollage from '../components/PhotoCollage'
import logo from '../assets/logo.png'
import { useState } from 'react'

export default function LoginScreen({ onBack, onInicio }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Completa email y contraseña.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No se pudo iniciar sesión.')
        return
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      onInicio()
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hb-screen">
      <img src={logo} alt="Habitual" className="hb-logo" />
      <p className="hb-subtitle">
        Apasionate de lo habitual.<br />Como nunca antes.
      </p>

      <PhotoCollage />

      <div className="hb-form">
        <div className="hb-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="hb-field">
          <label htmlFor="login-pass">Contraseña</label>
          <input
            id="login-pass"
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <p className="hb-form-message">{error}</p>}
        <button
          type="button"
          className="hb-btn hb-btn--primary"
          style={{ marginTop: 8 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Continuar'}
        </button>
      </div>

      <button type="button" className="hb-back" onClick={onBack}>← Volver</button>
    </div>
  )
}