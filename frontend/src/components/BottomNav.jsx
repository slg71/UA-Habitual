export default function BottomNav({ active, onInicio, onExplorar, onPerfil, onCrear }) {
  return (
    <nav className="inicio-nav">
      <button className={`inicio-nav-item ${active === 'inicio' ? 'inicio-nav-item--active' : ''}`} onClick={onInicio}>
        <span>⌂</span>
        <span>Inicio</span>
      </button>
      <button className={`inicio-nav-item ${active === 'explorar' ? 'inicio-nav-item--active' : ''}`} onClick={onExplorar}>
        <span>🔍</span>
        <span>Explorar</span>
      </button>
      <button className={`inicio-nav-item ${active === 'perfil' ? 'inicio-nav-item--active' : ''}`} onClick={onPerfil}>
        <span>👤</span>
        <span>Perfil</span>
      </button>
      <button className={`inicio-nav-item ${active === 'crear' ? 'inicio-nav-item--active' : ''}`} onClick={onCrear}>
        <span>＋</span>
        <span>Crear</span>
      </button>
    </nav>
  )
}