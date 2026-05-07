import { useRef } from 'react'
import { getImagenComunidad } from './comunidadImagenes'

export default function CommunitiesModal({ communities, loading, onJoin, isMember, joiningId, onClose, overlayRef }) {
  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
    >
      <div className="modal-comunidades">
        <div className="modal-header">
          <h3>Explorar comunidades</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-loading">Cargando comunidades…</div>
        ) : communities.length === 0 ? (
          <div className="modal-loading">No hay comunidades disponibles.</div>
        ) : (
          <div className="modal-lista">
            {communities.map(c => (
              <div key={c.id} className="modal-comunidad-item">
                <div className="modal-comunidad-avatar-sm">
                  <img
                    src={getImagenComunidad(c.name)}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.parentElement.textContent = c.name?.[0]?.toUpperCase()
                    }}
                  />
                </div>
                <div className="modal-comunidad-info">
                  <span className="modal-comunidad-nombre">{c.name}</span>
                  {c.category && <span className="modal-comunidad-cat">{c.category}</span>}
                </div>
                <button
                  className={`modal-join-btn ${isMember(c.id) ? 'joined' : ''}`}
                  onClick={() => !isMember(c.id) && onJoin(c.id)}
                  disabled={joiningId === c.id || isMember(c.id)}
                >
                  {joiningId === c.id ? '…' : isMember(c.id) ? '✓' : 'Unirse'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
