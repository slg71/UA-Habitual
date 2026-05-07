import '../styles/post-shared.css'

export default function PostCard({ post, liked, likeCount, onLike, onSelect, onAuthorClick }) {
  const formatearFecha = iso =>
    iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

  return (
    <div
      className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
      {post.media_url && post.media_type === 'image' && (
        <img
          src={parsearUrl(post.media_url)}
          alt="Post"
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )}
      {post.media_url && post.media_type === 'video' && (
        <video
          src={parsearUrl(post.media_url)}
          controls
          style={{ width: '100%', height: 'auto' }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )}
      {post.media_url && post.media_type === 'audio' && (
        <audio
          src={parsearUrl(post.media_url)}
          controls
          style={{ width: '100%' }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )}
      {post.media_url && (
        <div style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          padding: '20px 12px', background: 'var(--hb-green-lt)',
          color: 'var(--hb-brown-mid)', fontSize: 12, textAlign: 'center'
        }}>
          📷 No se ha podido cargar el contenido multimedia
        </div>
      )}
      <div className="post-footer-mini">
        {post.username && (
          <button
            type="button"
            className="post-autor post-autor--clickable"
            onClick={e => {
              e.stopPropagation()
              onAuthorClick?.(post.user_id)
            }}
          >
            @{post.username}
          </button>
        )}
        <p>{post.content}</p>
        <span className="post-meta">
          {formatearFecha(post.created_at)}
          <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={e => onLike(post, e)}>
            {liked ? '♥' : '♡'} {likeCount}
          </button>
        </span>
      </div>
    </div>
  )
}
