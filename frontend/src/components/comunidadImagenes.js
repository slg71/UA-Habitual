import imgChino from '../assets/comunidades/chino.jpg'
import imgAjedrez from '../assets/comunidades/ajdrz.jpg'
import imgDiseno from '../assets/comunidades/dg.jpg'

export const COMUNIDAD_IMAGENES = {
  ajedrez:        imgAjedrez,
  astronomia:     'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600',
  baile:          'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600',
  boxeo:          'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
  chino:          imgChino,
  ciclismo:       'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600',
  cine:           'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
  cocina:         'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
  coser:          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  diseno_grafico: imgDiseno,
  // ... resto de comunidades
}

export const IMAGEN_FALLBACK = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600'

export const normalizarNombre = (str = '') =>
  str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .trim()

export const getImagenComunidad = (name) => {
  const key = normalizarNombre(name)
  return COMUNIDAD_IMAGENES[key] || IMAGEN_FALLBACK
}