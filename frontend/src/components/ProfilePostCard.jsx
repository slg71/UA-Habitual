import '../styles/post-shared.css'

export default function ProfilePostCard({
  post,
  liked,
  likeCount,
  canOpenProfile,
  onOpenPost,
  onOpenAuthor,
  onToggleLike,
  formatDate,
  parseUrl
}) {
  return (
    <div
      className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
      onClick={() => onOpenPost(post)}
      style={{ cursor: 'pointer' }}
    >
      {post.media_url && post.media_type === 'image' && <img src={parseUrl(post.media_url)} alt="Post user" />}
      {post.media_url && post.media_type === 'video' && (
        <video
          src={parseUrl(post.media_url)}
          style={{ width: '100%', height: 'auto' }}
        />
      )}
      {post.media_url && post.media_type === 'audio' && (
        <audio
          src={parseUrl(post.media_url)}
          controls
          style={{ width: '100%' }}
        />
      )}
      <div className="post-footer-mini">
        {canOpenProfile ? (
          <button
            type="button"
            className="post-autor post-autor--clickable"
            onClick={e => {
              e.stopPropagation()
              onOpenAuthor(post.user_id)
            }}
          >
            @{post.username || 'Usuario'}
          </button>
        ) : null}
        <p>{post.content}</p>
        <span className="post-meta">
          {formatDate(post.created_at)}
          <button
            className={`like-btn ${liked ? 'liked' : ''}`}
            onClick={e => onToggleLike(post, e)}
          >
            {liked ? '♥' : '♡'} {likeCount}
          </button>
        </span>
      </div>
    </div>
  )
}