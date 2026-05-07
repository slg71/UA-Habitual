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
      {post.media_url && <img src={parseUrl(post.media_url)} alt="Post user" />}
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