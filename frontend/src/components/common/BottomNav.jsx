import homeIcon from '../../assets/home.png'
import searchIcon from '../../assets/search.png'
import perfilIcon from '../../assets/perfil.png'
import plusIcon from '../../assets/plus.png'
import exitIcon from '../../assets/exit.png'

export default function BottomNav({ active, onInicio, onExplorar, onPerfil, onCrear, onLogout }) {
  return (
    <>
      {/* Botón logout móvil — esquina superior derecha */}
      {onLogout && (
        <button className="logout-btn-mobile" onClick={onLogout} aria-label="Cerrar sesión">
          <img src={exitIcon} alt="Salir" className="nav-icon" />
        </button>
      )}

      <nav className="inicio-nav">
        <button className={`inicio-nav-item ${active === 'inicio' ? 'inicio-nav-item--active' : ''}`} onClick={onInicio}>
          <img src={homeIcon} alt="Inicio" className="nav-icon" />
          <span className="nav-label">Inicio</span>
        </button>
        <button className={`inicio-nav-item ${active === 'explorar' ? 'inicio-nav-item--active' : ''}`} onClick={onExplorar}>
          <img src={searchIcon} alt="Explorar" className="nav-icon" />
          <span className="nav-label">Explorar</span>
        </button>
        <button className={`inicio-nav-item ${active === 'perfil' ? 'inicio-nav-item--active' : ''}`} onClick={onPerfil}>
          <img src={perfilIcon} alt="Perfil" className="nav-icon" />
          <span className="nav-label">Perfil</span>
        </button>
        <button className={`inicio-nav-item ${active === 'crear' ? 'inicio-nav-item--active' : ''}`} onClick={onCrear}>
          <img src={plusIcon} alt="Crear" className="nav-icon" />
          <span className="nav-label">Crear</span>
        </button>

        {/* Botón logout sidebar — al fondo del nav lateral */}
        {onLogout && (
          <button className="inicio-nav-item logout-btn-sidebar" onClick={onLogout}>
            <img src={exitIcon} alt="Salir" className="nav-icon" />
            <span className="nav-label">Salir y configuracion</span>
          </button>
        )}
      </nav>
    </>
  )
}