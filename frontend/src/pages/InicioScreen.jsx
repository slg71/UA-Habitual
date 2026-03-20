import '../styles/habitual.css'
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

export default function InicioScreen( { onLogin }) {
  return (
    <div className="hb-screen inicio-screen">

      {/* ── Cabecera ── */}
      <div className="inicio-header">
        <img src={logo} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" aria-label="Ajustes">⚙️</button>
      </div>

      {/* ── Tus comunidades ── */}
      <section className="inicio-section">
        <h2 className="inicio-section-title">
          Tus comunidades
          <button className="inicio-add-btn" aria-label="Añadir comunidad">＋</button>
        </h2>

        <div className="inicio-comunidades">
          {/* {comunidades.map(c => (
            <div key={c.id} className="inicio-comunidad">
              <img src={c.foto} alt={c.nombre} className="inicio-comunidad-avatar" />
              <span className="inicio-comunidad-nombre">{c.nombre}</span>
            </div>
          ))} */}
        </div>
      </section>

      {/* ── Feed ── */}
      <section className="inicio-feed">
        {/* {posts.map(post => (
          <div key={post.id} className={`inicio-post inicio-post--${post.tipo}`}>
            {post.tipo === 'texto' && <p>{post.contenido}</p>}
            {post.tipo === 'foto'  && <img src={post.url} alt="" />}
            {post.tipo === 'audio' && (
              <div className="inicio-audio">
                <button>▶</button>
                <span>{post.duracion}</span>
              </div>
            )}
          </div>
        ))} */}
      </section>

      {/* ── Nav inferior ── */}
      <nav className="inicio-nav">
        <button className="inicio-nav-item inicio-nav-item--active">
          <span>⌂</span>
          <span>Inicio</span>
        </button>
        <button className="inicio-nav-item">
          <span>🔍</span>
          <span>Explorar</span>
        </button>
        <button className="inicio-nav-item" onClick={onLogin}>
          <span>👤</span>
          <span>Perfil</span>
        </button>
        <button className="inicio-nav-item">
          <span>＋</span>
          <span>Crear</span>
        </button>
      </nav>

    </div>
  )
}
