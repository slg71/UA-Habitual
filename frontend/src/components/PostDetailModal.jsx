import { useState } from 'react'
import CommentsSection from './common/CommentsSection'
import MediaCarousel from './MediaCarousel'
import DownloadConfirmModal from './DownloadConfirmModal'
import { downloadFile, getFilenameFromUrl } from '../utils/downloadFile'
import '../styles/post-detail-shared.css'

export default function PostDetailModal({ post, liked, likeCount, onLike, onClose, onAuthorClick, commentCount, onCommentCountChange }) {
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [selectedMediaForDownload, setSelectedMediaForDownload] = useState(null)

  const formatearFecha = iso =>
    iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  const mediaList = post.media_list && Array.isArray(post.media_list) ? post.media_list : (post.media_url ? [{ url: post.media_url, type: post.media_type }] : [])

  const handleDownload = (media) => {
    const filename = getFilenameFromUrl(media.url, media.type)
    downloadFile(media.url, filename)
    setShowDownloadConfirm(false)
    setSelectedMediaForDownload(null)
  }

  const handleMediaDownloadClick = () => {
    if (mediaList.length > 0) {
      setSelectedMediaForDownload(mediaList[0])
      setShowDownloadConfirm(true)
    }
  }

  return (
    <div className="modal-overlay post-overlay" onClick={onClose}>
      <div className="post-detail-card" onClick={e => e.stopPropagation()}>
        <div className="post-detail-header">
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--hb-green-lt)', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: 'var(--hb-green-dk)', flexShrink: 0
          }}>
            {post.username?.[0]?.toUpperCase()}
          </div>
          <button
            type="button"
            className="post-detail-username post-detail-username-btn"
            onClick={() => onAuthorClick(post.user_id)}
          >
            {post.username}
          </button>
          {post.community_name && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
              #{post.community_name}
            </span>
          )}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            {mediaList.length > 0 && (
              <button
                className="post-detail-close"
                onClick={handleMediaDownloadClick}
                title="Descargar archivo"
                style={{ fontSize: 18 }}
              >
                ⬇️
              </button>
            )}
            <button className="post-detail-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {mediaList.length > 0 && (
          <MediaCarousel
            mediaList={mediaList}
            onDownload={(media) => {
              setSelectedMediaForDownload(media)
              setShowDownloadConfirm(true)
            }}
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
            <strong>{post.username}</strong> {post.content}
          </div>
          {post.community_name && (
            <div className="post-detail-comment">
              <strong>Comunidad:</strong> {post.community_name}
            </div>
          )}
          <div className="post-detail-comment">
            <strong>Comentarios:</strong> {commentCount}
          </div>
          <div className="post-detail-date">{formatearFecha(post.created_at)}</div>
        </div>

        <CommentsSection
          postId={post.id}
          onCommentCountChange={onCommentCountChange}
        />
      </div>
      {showDownloadConfirm && selectedMediaForDownload && (
        <DownloadConfirmModal
          onConfirm={() => handleDownload(selectedMediaForDownload)}
          onCancel={() => {
            setShowDownloadConfirm(false)
            setSelectedMediaForDownload(null)
          }}
          filename={getFilenameFromUrl(selectedMediaForDownload.url, selectedMediaForDownload.type)}
        />
      )}
    </div>
  )
}
