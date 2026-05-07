import CommentsSection from './common/CommentsSection'
import '../styles/post-detail-shared.css'

export default function PostDetailModal({ post, liked, likeCount, onLike, onClose, onAuthorClick, commentCount, onCommentCountChange }) {
  const formatearFecha = iso =>
    iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`)

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
        </div>

        {post.media_url && (
          <img
            src={parsearUrl(post.media_url)}
            alt="Contenido"
            className="post-detail-img"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}
        {post.media_url && (
          <div style={{
            display: 'none', alignItems: 'center', justifyContent: 'center',
            padding: '32px 16px', background: 'var(--hb-green-lt)',
            color: 'var(--hb-brown-mid)', fontSize: 13, textAlign: 'center'
          }}>
            📷 No se ha podido cargar la foto
          </div>
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
    </div>
  )
}
