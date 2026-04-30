import { useState, useEffect } from 'react'
import '../styles/habitual.css'
import '../styles/inicio.css'
import PhotoCollage from '../components/PhotoCollage'
import logoLight from '../assets/logo.png'
import logoDark from '../assets/logodark.png'
import BottomNav from '../components/BottomNav'

// Ejemplo con API:
// const [comunidades, setComunidades] = useState([])
// useEffect(() => {
//   fetch('/api/comunidades/mias').then(r => r.json()).then(setComunidades)
// }, [])

// const [posts, setPosts] = useState([])
// useEffect(() => {
//   fetch('/api/feed').then(r => r.json()).then(setPosts)
// }, [])

export default function ExplorarScreen( { onPerfil, onExplorar, onInicio, onConfiguracion, onCrear } ) {
  const [modoOscuro, setModoOscuro] = useState(document.body.classList.contains('dark-mode'))

  useEffect(() => {
    const observador = new MutationObserver(() => {
      setModoOscuro(document.body.classList.contains('dark-mode'))
    })
    observador.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observador.disconnect()
  }, [])

  return (
    <div className="hb-screen inicio-screen">

      {/* ── Cabecera ── */}
      <div className="inicio-header">
        <img src={modoOscuro ? logoDark : logoLight} alt="Habitual" className="hb-logo" style={{ marginBottom: 0 }} />
        <button className="inicio-settings" aria-label="Ajustes" onClick={onConfiguracion}>⚙️</button>
      </div>

      {/* ── Barra de búsqueda ── */}
      <div className="explorar-search-wrapper">
        <input
          type="search"
          className="explorar-search-input"
          placeholder="🔍  Buscar"
        />
      </div>

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
      <BottomNav
        active="explorar"
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />

    </div>
  )
}
