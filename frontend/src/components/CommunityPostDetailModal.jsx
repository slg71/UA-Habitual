import { useState } from 'react'
import CommentsSection from './common/CommentsSection'
import DownloadConfirmModal from './DownloadConfirmModal'
import { downloadFile, getFilenameFromUrl } from '../utils/downloadFile'
import '../styles/post-detail-shared.css'

export default function CommunityPostDetailModal({
  post,
  communityName,
  liked,
  likeCount,
  commentCount,
  onLike,
  onClose,
  onOpenAuthor,
  onCommentCountChange,
  formatDate,
  parseUrl
}) {
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)

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
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--hb-green-lt)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--hb-green-dk)', flexShrink: 0 }}>
            {post.username?.[0]?.toUpperCase()}
          </div>
          <button
            type="button"
            className="post-detail-username post-detail-username-btn"
            onClick={() => onOpenAuthor(post.user_id)}
          >
            {post.username}
          </button>
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
        {post.media_url && post.media_type === 'image' ? (
          <img
            src={parseUrl(post.media_url)}
            alt="Contenido"
            className="post-detail-img"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : post.media_url && post.media_type === 'video' ? (
          <video
            src={parseUrl(post.media_url)}
            controls
            className="post-detail-img"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : post.media_url && post.media_type === 'audio' ? (
          <audio
            src={parseUrl(post.media_url)}
            controls
            style={{ width: '100%', margin: '16px 0' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        {post.media_url ? (
          <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'var(--hb-green-lt)', color: 'var(--hb-brown-mid)', fontSize: 13, textAlign: 'center' }}>
            📷 No se ha podido cargar el contenido multimedia
          </div>
        ) : null}
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
            <strong>{post.username}</strong> {post.content}
          </div>
          <div className="post-detail-comment">
            <strong>Comunidad:</strong> {communityName || 'Sin comunidad'}
          </div>
          <div className="post-detail-comment">
            <strong>Comentarios:</strong> {commentCount}
          </div>
          <div className="post-detail-date">{formatDate(post.created_at)}</div>
        </div>

        <CommentsSection
          postId={post.id}
          onCommentCountChange={onCommentCountChange}
        />
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