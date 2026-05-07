import CommentsSection from './CommentsSection'

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
        </div>
        {post.media_url ? (
          <img
            src={parseUrl(post.media_url)}
            alt="Contenido"
            className="post-detail-img"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        {post.media_url ? (
          <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'var(--hb-green-lt)', color: 'var(--hb-brown-mid)', fontSize: 13, textAlign: 'center' }}>
            📷 No se ha podido cargar la foto
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
    </div>
  )
}