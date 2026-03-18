import '../habitual.css'
import PhotoCollage from '../components/PhotoCollage'
import logo from '../assets/logo.png'

export default function WelcomeScreen({ onRegister, onLogin }) {
  return (
    <div className="hb-screen">
      <img src={logo} alt="Habitual" className="hb-logo" />
      <p className="hb-subtitle">
        Apasionate de lo habitual.<br />Como nunca antes.
      </p>

      <PhotoCollage />

      <div className="hb-actions">
        <button className="hb-btn hb-btn--primary" onClick={onRegister}>
          Registrar como nuevo
        </button>
        <button className="hb-btn hb-btn--secondary" onClick={onLogin}>
          Ya tengo una cuenta
        </button>
      </div>
    </div>
  )
}