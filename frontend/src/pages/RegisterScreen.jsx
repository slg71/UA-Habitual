import '../styles/habitual.css'
import PhotoCollage from '../components/PhotoCollage'
import logo from '../assets/logo.png'
import { useState } from 'react'

export default function RegisterScreen({ onBack, onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name || !email || !password || !password2) {
      setError('Completa todos los campos.')
      return
    }

    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No se pudo registrar la cuenta.')
        return
      }

      onLogin()
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
          <label htmlFor="reg-name">Nombre</label>
          <input
            id="reg-name"
            type="text"
            placeholder="Nombre"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="hb-field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="hb-field">
          <label htmlFor="reg-pass">Contraseña</label>
          <input
            id="reg-pass"
            type="password"
            placeholder="Contraseña"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="hb-field">
          <label htmlFor="reg-pass2">Confirmar contraseña</label>
          <input
            id="reg-pass2"
            type="password"
            placeholder="Contraseña"
            autoComplete="new-password"
            value={password2}
            onChange={(event) => setPassword2(event.target.value)}
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
          {loading ? 'Registrando...' : 'Continuar'}
        </button>
      </div>

      <button type="button" className="hb-back" onClick={onBack}>← Volver</button>
    </div>
  )
}