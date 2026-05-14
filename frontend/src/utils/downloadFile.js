/**
 * Descarga un archivo desde una URL
 * @param {string} url - URL del archivo a descargar
 * @param {string} filename - Nombre del archivo (opcional)
 */
export const downloadFile = (url, filename) => {
  const fullUrl = url.startsWith('http') ? url : `/api${url}`
  
  // Extraer nombre de archivo del URL si no se proporciona
  if (!filename) {
    const urlParts = fullUrl.split('/')
    filename = urlParts[urlParts.length - 1] || 'descarga'
  }

  // Crear un elemento <a> temporal para descargar
  const link = document.createElement('a')
  link.href = fullUrl
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Extrae el nombre del archivo del URL
 * @param {string} url - URL del archivo
 * @param {string} mediaType - Tipo de media (image, video, audio)
 * @returns {string} - Nombre del archivo
 */
export const getFilenameFromUrl = (url, mediaType = 'file') => {
  if (!url) return `descarga`
  
  const urlParts = url.split('/')
  const lastPart = urlParts[urlParts.length - 1]
  
  // Si tiene extensión, usarla
  if (lastPart && lastPart.includes('.')) {
    return lastPart
  }
  
  // Si no, agregar una extensión según el tipo de media
  const extensiones = {
    image: '.jpg',
    video: '.mp4',
    audio: '.mp3',
    file: ''
  }
  
  return `descarga${extensiones[mediaType] || extensiones.file}`
}
