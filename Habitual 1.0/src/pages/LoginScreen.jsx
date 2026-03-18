import '../habitual.css'
import PhotoCollage from '../components/PhotoCollage'
import logo from '../assets/logo.png'

export default function LoginScreen({ onBack }) {
  return (
    <div className="hb-screen">
      <img src={logo} alt="Habitual" className="hb-logo" />
      <p className="hb-subtitle">
        Apasionate de lo habitual.<br />Como nunca antes.
      </p>

      <PhotoCollage />

      <div className="hb-form">
        <div className="hb-field">
          <label htmlFor="login-name">Nombre</label>
          <input id="login-name" type="text" placeholder="Nombre" autoComplete="username" />
        </div>
        <div className="hb-field">
          <label htmlFor="login-pass">Contraseña</label>
          <input id="login-pass" type="password" placeholder="Contraseña" autoComplete="current-password" />
        </div>
        <button type="button" className="hb-btn hb-btn--primary" style={{ marginTop: 8 }}>
          Continuar
        </button>
      </div>

      <button type="button" className="hb-back" onClick={onBack}>← Volver</button>
    </div>
  )
}