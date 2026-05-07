export default function ExplorePostCard({
  post,
  liked,
  likeCount,
  onOpenPost,
  onOpenAuthor,
  onToggleLike,
  formatDate,
  parseUrl
}) {
  return (
    <article
      className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
      onClick={() => onOpenPost(post)}
      style={{ cursor: 'pointer' }}
    >
      {post.media_url ? (
        <img
          src={parseUrl(post.media_url)}
          alt="Post"
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}
      {post.media_url ? (
        <div style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          padding: '20px 12px', background: 'var(--hb-green-lt)',
          color: 'var(--hb-brown-mid)', fontSize: 12, textAlign: 'center'
        }}>
          📷 No se ha podido cargar la foto
        </div>
      ) : null}

      <div className="post-footer-mini">
        {post.username && (
          <button
            type="button"
            className="post-autor post-autor--clickable"
            onClick={e => {
              e.stopPropagation()
              onOpenAuthor(post.user_id)
            }}
          >
            @{post.username}
          </button>
        )}

        {post.community_name && <span className="explorar-post-community">#{post.community_name}</span>}

        <p className="explorar-post-text">{post.content}</p>

        <span className="post-meta explorar-post-meta">
          {formatDate(post.created_at)}
          <button
            className={`like-btn ${liked ? 'liked' : ''}`}
            onClick={e => onToggleLike(post, e)}
          >
            {liked ? '♥' : '♡'} {likeCount}
          </button>
        </span>
      </div>
    </article>
  )
}