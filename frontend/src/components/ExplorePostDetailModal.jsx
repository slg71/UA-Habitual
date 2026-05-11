import { useState } from 'react'
import CommentsSection from './common/CommentsSection'
import MediaCarousel from './MediaCarousel'
import DownloadConfirmModal from './DownloadConfirmModal'
import { downloadFile, getFilenameFromUrl } from '../utils/downloadFile'
import '../styles/post-detail-shared.css'

export default function ExplorePostDetailModal({
  post,
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
  const [selectedMediaForDownload, setSelectedMediaForDownload] = useState(null)

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
          <div className="explorar-avatar-badge">
            {post.username?.[0]?.toUpperCase()}
          </div>
          <button
            type="button"
            className="post-detail-username post-detail-username-btn"
            onClick={() => onOpenAuthor(post.user_id)}
          >
            {post.username}
          </button>
          {post.community_name && (
            <span className="explorar-detail-community">#{post.community_name}</span>
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