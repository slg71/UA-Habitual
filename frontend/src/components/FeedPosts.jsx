import PostCard from './PostCard'

export default function FeedPosts({ posts, likesMap, loading, onLike, onSelectPost, onAuthorClick }) {
  if (loading) {
    return (
      <section className="inicio-section">
        <h2 className="inicio-section-title">Publicaciones</h2>
        <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>Cargando publicaciones…</p>
      </section>
    )
  }

  return (
    <section className="inicio-section">
      <h2 className="inicio-section-title">Publicaciones</h2>

      {posts.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0 4px' }}>
          Únete a comunidades para ver sus publicaciones aquí.
        </p>
      ) : (
        <div className="perfil-galeria" style={{ paddingBottom: 0 }}>
          {posts.map(post => {
            const liked = likesMap[post.id]?.liked ?? false
            const likeCount = likesMap[post.id]?.count ?? post.likes_count ?? 0

            return (
              <PostCard
                key={`${post.id}-${post.community_name}`}
                post={post}
                liked={liked}
                likeCount={likeCount}
                onLike={onLike}
                onSelect={() => onSelectPost(post)}
                onAuthorClick={onAuthorClick}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
