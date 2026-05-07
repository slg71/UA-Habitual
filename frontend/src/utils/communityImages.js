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
  coser:          'https://plus.unsplash.com/premium_photo-1676586308943-a2aca1cbdc06?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600',
  diseno_grafico: imgDiseno,
  escalada:       'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600',
  escritura:      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600',
  fotografia:     'https://images.unsplash.com/photo-1580707221190-bd94d9087b7f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  guitarra:       'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600',
  holandes:       'https://plus.unsplash.com/premium_photo-1670689707933-b1c85b8f7b3d?q=80&w=1315&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600',
  ingles:         'https://images.unsplash.com/photo-1464021025634-49b81a77a858?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600',
  jardineria:     'https://plus.unsplash.com/premium_photo-1678652879556-11451dff2f6a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600',
  karate:         'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600',
  literatura:     'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600',
  meditacion:     'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600',
  pintura:        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  programacion:   'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600',
  running:        'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600',
  yoga:           'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
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