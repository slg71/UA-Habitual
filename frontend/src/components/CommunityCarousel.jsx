import { useRef } from 'react'
import { getImagenComunidad } from './comunidadImagenes'

export default function CommunityCarousel({ communities, onSelectCommunity, onAddClick }) {
  const comunidadesRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const handleMouseDown = (e) => {
    const el = comunidadesRef.current
    if (!el) return
    isDraggingRef.current = true
    el.classList.add('dragging')
    startXRef.current = e.pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
  }

  const handleMouseMove = (e) => {
    const el = comunidadesRef.current
    if (!el || !isDraggingRef.current) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = x - startXRef.current
    el.scrollLeft = scrollLeftRef.current - walk
  }

  const handleMouseUp = () => {
    const el = comunidadesRef.current
    if (!el) return
    isDraggingRef.current = false
    el.classList.remove('dragging')
  }

  const handleTouchStart = (e) => {
    const el = comunidadesRef.current
    if (!el || !e.touches?.length) return
    isDraggingRef.current = true
    startXRef.current = e.touches[0].pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
  }

  const handleTouchMove = (e) => {
    const el = comunidadesRef.current
    if (!el || !isDraggingRef.current || !e.touches?.length) return
    const x = e.touches[0].pageX - el.offsetLeft
    const walk = x - startXRef.current
    el.scrollLeft = scrollLeftRef.current - walk
  }

  const handleTouchEnd = () => {
    isDraggingRef.current = false
  }

  return (
    <section className="inicio-section">
      <h2 className="inicio-section-title">
        Tus comunidades
        <button className="inicio-add-btn" aria-label="Añadir comunidad" onClick={onAddClick}>＋</button>
      </h2>

      <div className="inicio-comunidades-wrapper">
        <div
          className="inicio-comunidades"
          ref={comunidadesRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {communities.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>
              Aún no perteneces a ninguna. ¡Pulsa ＋ para unirte!
            </p>
          ) : (
            communities.map(c => (
              <div key={c.id} className="inicio-comunidad" onClick={() => onSelectCommunity(c)} style={{ cursor: 'pointer' }}>
                <div className="inicio-comunidad-avatar">
                  <img
                    src={getImagenComunidad(c.name)}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <span className="inicio-comunidad-nombre">{c.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
