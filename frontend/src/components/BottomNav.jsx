import homeIcon from '../assets/home.png'
import searchIcon from '../assets/search.png'
import perfilIcon from '../assets/perfil.png'
import plusIcon from '../assets/plus.png'

export default function BottomNav({ active, onInicio, onExplorar, onPerfil, onCrear }) {
  return (
    <nav className="inicio-nav">
      <button className={`inicio-nav-item ${active === 'inicio' ? 'inicio-nav-item--active' : ''}`} onClick={onInicio}>
        <img src={homeIcon} alt="Inicio" className="nav-icon" />
        <span>Inicio</span>
      </button>
      <button className={`inicio-nav-item ${active === 'explorar' ? 'inicio-nav-item--active' : ''}`} onClick={onExplorar}>
        <img src={searchIcon} alt="Explorar" className="nav-icon" />
        <span>Explorar</span>
      </button>
      <button className={`inicio-nav-item ${active === 'perfil' ? 'inicio-nav-item--active' : ''}`} onClick={onPerfil}>
        <img src={perfilIcon} alt="Perfil" className="nav-icon" />
        <span>Perfil</span>
      </button>
      <button className={`inicio-nav-item ${active === 'crear' ? 'inicio-nav-item--active' : ''}`} onClick={onCrear}>
        <img src={plusIcon} alt="Crear" className="nav-icon" />
        <span>Crear</span>
      </button>
    </nav>
  )
}