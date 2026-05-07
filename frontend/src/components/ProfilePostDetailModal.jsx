import { useState } from 'react'
import CommentsSection from './common/CommentsSection'
import DownloadConfirmModal from './DownloadConfirmModal'
import { downloadFile, getFilenameFromUrl } from '../utils/downloadFile'
import imagenUsuario from '../assets/imagen-usuario.png'
import '../styles/post-detail-shared.css'

export default function ProfilePostDetailModal({
  post,
  currentUsername,
  currentUserId,
  liked,
  likeCount,
  onLike,
  onClose,
  onOpenAuthor,
  commentCount,
  onCommentCountChange,
  onDelete,
  deleting,
  deleteError,
  formatDate,
  parseUrl
}) {
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const puedeBorrar = String(post.user_id) === String(currentUserId)

  const handleDownload = () => {
    if (post.media_url) {
      const filename = getFilenameFromUrl(post.media_url, post.media_type)
      downloadFile(post.media_url, filename)
      setShowDownloadConfirm(false)
    }
  }

  return (
    <div className="modal-overlay post-overlay" onClick={onClose}>
      <div className="post-detail-card" onClick={e => e.stopPropagation()}>
        <div className="post-detail-header">
          <img src={imagenUsuario} alt="Avatar" className="post-detail-avatar" />
          {post.user_id && String(post.user_id) !== String(currentUserId) ? (
            <button
              type="button"
              className="post-detail-username post-detail-username-btn"
              onClick={() => onOpenAuthor(post.user_id)}
            >
              {post.username || currentUsername}
            </button>
          ) : (
            <span className="post-detail-username">{post.username || currentUsername}</span>
          )}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            {post.media_url && (
              <button
                className="post-detail-close"
                onClick={() => setShowDownloadConfirm(true)}
                title="Descargar archivo"
                style={{ fontSize: 18 }}
              >
                ⬇️
              </button>
            )}
            <button className="post-detail-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {post.media_url && post.media_type === 'image' && <img src={parseUrl(post.media_url)} alt="Contenido" className="post-detail-img" />}
        {post.media_url && post.media_type === 'video' && (
          <video
            src={parseUrl(post.media_url)}
            controls
            className="post-detail-img"
          />
        )}
        {post.media_url && post.media_type === 'audio' && (
          <audio
            src={parseUrl(post.media_url)}
            controls
            style={{ width: '100%', margin: '16px 0' }}
          />
        )}

        <div className="post-detail-footer">
          <div className="post-detail-likes">
            <button
              className={`like-btn like-btn--lg ${liked ? 'liked' : ''}`}
              onClick={e => onLike(post, e)}
            >
              {liked ? '♥' : '♡'}
            </button>
            <span className="like-count">{likeCount}</span>
          </div>

          <div className="post-detail-caption">
            <strong>{post.username || currentUsername}</strong> {post.content}
          </div>
          <div className="post-detail-comment"><strong>Comunidad:</strong> {post.community_name || 'Sin comunidad'}</div>
          <div className="post-detail-comment"><strong>Comentarios:</strong> {commentCount}</div>
          <div className="post-detail-date">{formatDate(post.created_at)}</div>

          {puedeBorrar && (
            <div className="post-detail-actions">
              {deleteError && <p className="delete-error">{deleteError}</p>}
              <button className="btn-delete" onClick={onDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar post'}
              </button>
            </div>
          )}
        </div>

        <CommentsSection postId={post.id} onCommentCountChange={onCommentCountChange} />
      </div>
      {showDownloadConfirm && (
        <DownloadConfirmModal
          onConfirm={handleDownload}
          onCancel={() => setShowDownloadConfirm(false)}
          filename={getFilenameFromUrl(post.media_url, post.media_type)}
        />
      )}
    </div>
  )
}