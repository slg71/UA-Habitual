import '../styles/habitual.css'
import '../styles/inicio.css'
import PhotoCollage from '../components/PhotoCollage'
import logo from '../assets/logo.png'

// Ejemplo con API:
// const [comunidades, setComunidades] = useState([])
// useEffect(() => {
//   fetch('/api/comunidades/mias').then(r => r.json()).then(setComunidades)
// }, [])

// const [posts, setPosts] = useState([])
// useEffect(() => {
//   fetch('/api/feed').then(r => r.json()).then(setPosts)
// }, [])

export default function PerfilScreen( { onExplorar, onInicio, onPerfil, onConfiguracion, onCrear } ) {
  return (
    <div className="hb-screen inicio-screen">

      {/* ── Cabecera ── */}
      <div className="inicio-header">
        <img src={logo} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" aria-label="Ajustes" onClick={onConfiguracion}>⚙️</button>
      </div>

      {/* ── Nav inferior ── */}
      <nav className="inicio-nav">
        <button className="inicio-nav-item" onClick={onInicio}>
          <span>⌂</span>
          <span>Inicio</span>
        </button>
        <button className="inicio-nav-item" onClick={onExplorar}>
          <span>🔍</span>
          <span>Explorar</span>
        </button>
        <button className="inicio-nav-item inicio-nav-item--active" onClick={onPerfil}>
          <span>👤</span>
          <span>Perfil</span>
        </button>
        <button className="inicio-nav-item" onClick={onCrear}>
          <span>＋</span>
          <span>Crear</span>
        </button>
      </nav>

    </div>
  )
}
