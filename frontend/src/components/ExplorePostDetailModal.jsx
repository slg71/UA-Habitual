import CommentsSection from './CommentsSection'

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
        </div>

        {post.media_url ? (
          <>
            <img
              src={parseUrl(post.media_url)}
              alt="Contenido"
              className="post-detail-img"
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="explorar-detail-fallback">
              📷 No se ha podido cargar la foto
            </div>
          </>
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
    </div>
  )
}