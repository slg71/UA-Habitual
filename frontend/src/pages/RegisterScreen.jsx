import '../styles/habitual.css'
import PhotoCollage from '../components/PhotoCollage'
import logo from '../assets/logo.png'

export default function RegisterScreen({ onBack, onLogin }) {
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
          <input id="reg-name" type="text" placeholder="Nombre" autoComplete="name" />
        </div>
        <div className="hb-field">
          <label htmlFor="reg-pass">Contraseña</label>
          <input id="reg-pass" type="password" placeholder="Contraseña" autoComplete="new-password" />
        </div>
        <div className="hb-field">
          <label htmlFor="reg-pass2">Confirmar contraseña</label>
          <input id="reg-pass2" type="password" placeholder="Contraseña" autoComplete="new-password" />
        </div>
        <button type="button" className="hb-btn hb-btn--primary" style={{ marginTop: 8 }} onClick={onLogin}>
          Continuar
        </button>
      </div>

      <button type="button" className="hb-back" onClick={onBack}>← Volver</button>
    </div>
  )
}