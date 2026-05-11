import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../utils/api'
import { getStoredToken, getUserIdFromToken } from '../utils/auth'

const formatearFecha = iso =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

export default function CommentsSection({ postId, onCommentCountChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState(null)
  
  const token = getStoredToken()
  const currentUserId = getUserIdFromToken(token)

  useEffect(() => {
    if (!postId) return
    cargarComentarios()
  }, [postId])

  const cargarComentarios = async () => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(Array.isArray(data) ? data : [])
        if (onCommentCountChange) {
          onCommentCountChange(data.length)
        }
      } else {
        setComments([])
        if (onCommentCountChange) {
          onCommentCountChange(0)
        }
      }
    } catch (err) {
      console.error('Error cargando comentarios:', err)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const enviarComentario = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const token = getStoredToken()
    if (!token) {
      setError('Debes iniciar sesión para comentar')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment.trim()
        })
      })

      if (response.ok) {
        setNewComment('')
        await cargarComentarios() // Recargar comentarios
      } else {
        const data = await response.json()
        setError(data.error || 'Error al enviar comentario')
      }
    } catch (err) {
      console.error('Error enviando comentario:', err)
      setError('Error al enviar comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const eliminarComentario = async (commentId) => {
    if (!token) return
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return

    setDeletingCommentId(commentId)

    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      })

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        if (onCommentCountChange) {
          onCommentCountChange(comments.length - 1)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Error al eliminar comentario')
      }
    } catch (err) {
      console.error('Error eliminando comentario:', err)
      setError('Error al eliminar comentario')
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (loading) {
    return (
      <div className="comments-section">
        <div className="comments-loading">Cargando comentarios...</div>
      </div>
    )
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h4>Comentarios</h4>
      </div>

      {comments.length === 0 ? (
        <div className="comments-empty">
          <p>Sé el primero en comentar</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                <div className="comment-avatar-circle">
                  {comment.username?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-username">@{comment.username}</span>
                  <span className="comment-date">{formatearFecha(comment.created_at)}</span>
                  {currentUserId && String(comment.user_id) === String(currentUserId) && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => eliminarComentario(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      title="Eliminar comentario"
                    >
                      {deletingCommentId === comment.id ? '...' : '✕'}
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={enviarComentario}>
        <div className="comment-input-container">
          <textarea
            className="comment-input"
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            maxLength={500}
            rows={1}
            disabled={submitting}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? '...' : 'Enviar'}
          </button>
        </div>
        {error && <p className="comment-error">{error}</p>}
      </form>
    </div>
  )
}