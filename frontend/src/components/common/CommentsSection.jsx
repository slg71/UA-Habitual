import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../utils/api'
import { getStoredToken } from '../../utils/auth'
import '../../styles/comments-shared.css'

const formatearFecha = iso =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

export default function CommentsSection({ postId, onCommentCountChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
        await cargarComentarios()
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

  if (loading) {
    return (
      <div className="comments-section-body">
        <div className="comments-loading">Cargando comentarios...</div>
      </div>
    )
  }

  return (
    <>
      {/* Cuerpo de los comentarios */}
      <div className="comments-section-body">
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
                  </div>
                  <p className="comment-text">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contenedor independiente para el formulario */}
      <div className="comment-form-wrapper">
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
    </>
  )
}