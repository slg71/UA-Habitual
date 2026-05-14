import { useState } from 'react'
import '../styles/media-carousel.css'

export default function MediaCarousel({ mediaList = [], onDownload }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!mediaList || mediaList.length === 0) {
    return null
  }

  const currentMedia = mediaList[currentIndex]
  const hasMultiple = mediaList.length > 1

  const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? mediaList.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev === mediaList.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="media-carousel">
      <div className="media-carousel-container">
        {currentMedia.type === 'image' && (
          <img
            src={parsearUrl(currentMedia.url)}
            alt="Contenido"
            className="media-carousel-content"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}
        {currentMedia.type === 'video' && (
          <video
            src={parsearUrl(currentMedia.url)}
            controls
            className="media-carousel-content"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}
        {currentMedia.type === 'audio' && (
          <audio
            src={parsearUrl(currentMedia.url)}
            controls
            className="media-carousel-audio"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}
        <div style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          padding: '32px 16px', background: 'var(--hb-green-lt)',
          color: 'var(--hb-brown-mid)', fontSize: 13, textAlign: 'center'
        }}>
          No se pudo cargar el contenido
        </div>

        {hasMultiple && (
          <>
            <button
              className="media-carousel-nav media-carousel-prev"
              onClick={goToPrevious}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              className="media-carousel-nav media-carousel-next"
              onClick={goToNext}
              aria-label="Siguiente"
            >
              ›
            </button>
            <div className="media-carousel-counter">
              {currentIndex + 1} / {mediaList.length}
            </div>
          </>
        )}

      </div>

      {hasMultiple && (
        <div className="media-carousel-dots">
          {mediaList.map((_, index) => (
            <button
              key={index}
              className={`media-carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir a media ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
