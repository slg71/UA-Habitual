import { useState, useEffect } from 'react';
import '../styles/habitual.css';
import '../styles/inicio.css';
import '../styles/perfil.css';
import BottomNav from '../components/BottomNav';
import { API_BASE, getAuthHeaders } from '../utils/api';
import { getStoredToken, getUserIdFromToken } from '../utils/auth';
import { loadLikesCache, saveLikesCache } from '../utils/likesCache';
import imagenUsuario from '../assets/imagen-usuario.png';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS_SEMANA = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function PerfilScreen({ onExplorar, onInicio, onPerfil, onCrear, onConfiguracion, onVerPerfil, perfilVisitadoId }) {

  const [tabActual, setTabActual] = useState('publicaciones');
  const [showProgreso, setShowProgreso] = useState(false);
  const [postSeleccionado, setPostSeleccionado] = useState(null);
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [comunidades, setComunidades] = useState([]);
  const [postsPropios, setPostsPropios] = useState([]);
  const [postsLikes, setPostsLikes] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [likesMap, setLikesMap] = useState(() => loadLikesCache());
  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [errorFetch, setErrorFetch] = useState('');
  const [showFormObj, setShowFormObj] = useState(false);
  const [nuevoObjetivo, setNuevoObjetivo] = useState({ title: '', difficulty: 'easy', community_id: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorObj, setErrorObj] = useState('');
  const [fechaCal, setFechaCal] = useState(new Date());

  const token = getStoredToken();
  const misHeaders = getAuthHeaders(token);
  const esPerfilPropio = !perfilVisitadoId;

  useEffect(() => {
    saveLikesCache(likesMap);
  }, [likesMap]);

  const parsearUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const formatearFecha = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const calcularDiasRacha = (streakActual) => {
    const totalDias = streakActual || 0;
    const historial = [];
    for (let i = 0; i < totalDias; i++) {
      let fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - i);
      historial.push({ mes: fechaPasada.getMonth(), año: fechaPasada.getFullYear(), dia: fechaPasada.getDate() });
    }
    return historial;
  };

  const precargarLikes = async (listaDePosts) => {
    if (!listaDePosts.length || !token) return;

    const cacheActual = loadLikesCache();
    const sinCache = listaDePosts.filter(p => !(p.id in cacheActual));

    const countUpdates = await Promise.allSettled(
      listaDePosts.map(p =>
        fetch(`${API_BASE}/posts/${p.id}/likes/count`)
          .then(r => r.ok ? r.json() : null)
          .then(d => d ? { id: p.id, count: d.count } : null)
      )
    );
    const countMap = {};
    countUpdates.forEach(r => {
      if (r.status === 'fulfilled' && r.value) countMap[r.value.id] = r.value.count;
    });

    if (sinCache.length > 0) {
      const results = await Promise.allSettled(
        sinCache.map(p =>
          fetch(`${API_BASE}/posts/${p.id}/user-like`, { headers: misHeaders })
            .then(r => r.ok ? r.json() : { liked: false })
            .then(d => ({ id: p.id, liked: !!d.liked }))
        )
      );
      const nuevos = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') nuevos[r.value.id] = { liked: r.value.liked, count: countMap[r.value.id] ?? 0 };
      });

      setLikesMap(prev => {
        const actualizado = { ...prev };
        Object.entries(nuevos).forEach(([id, val]) => { actualizado[id] = val; });
        listaDePosts.filter(p => p.id in cacheActual).forEach(p => {
          if (countMap[p.id] !== undefined) {
            actualizado[p.id] = { liked: actualizado[p.id]?.liked ?? false, count: countMap[p.id] };
          }
        });
        return actualizado;
      });
    } else {
      if (Object.keys(countMap).length > 0) {
        setLikesMap(prev => {
          const actualizado = { ...prev };
          Object.entries(countMap).forEach(([id, count]) => {
            actualizado[id] = { liked: actualizado[id]?.liked ?? false, count };
          });
          return actualizado;
        });
      }
    }
  };

  const toggleLike = async (post, e) => {
    e.stopPropagation();
    if (!token) return;
    const postId = post.id;
    const yaTieneLike = likesMap[postId]?.liked ?? false;
    const cantidadActual = likesMap[postId]?.count ?? post.likes_count ?? 0;

    setLikesMap(prev => ({
      ...prev,
      [postId]: { liked: !yaTieneLike, count: yaTieneLike ? cantidadActual - 1 : cantidadActual + 1 }
    }));

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: yaTieneLike ? 'DELETE' : 'POST',
        headers: misHeaders
      });
      if (!res.ok) throw new Error('Like failed');

      const countRes = await fetch(`${API_BASE}/posts/${postId}/likes/count`);
      if (countRes.ok) {
        const data = await countRes.json();
        const countReal = typeof data.count === 'number' ? data.count : (yaTieneLike ? cantidadActual - 1 : cantidadActual + 1);
        setLikesMap(prev => ({ ...prev, [postId]: { liked: !yaTieneLike, count: countReal } }));
      }
    } catch {
      setLikesMap(prev => ({ ...prev, [postId]: { liked: yaTieneLike, count: cantidadActual } }));
    }
  };

  const abrirPerfil = (userId) => {
    if (!onVerPerfil || !userId) return;
    const miId = getUserIdFromToken();
    onVerPerfil(String(userId) === String(miId) ? null : userId);
  };

  const toggleFollow = async () => {
    if (!perfilVisitadoId || !token) return;

    setLoadingFollow(true);
    try {
      const endpoint = isFollowing
        ? `${API_BASE}/users/${perfilVisitadoId}/unfollow`
        : `${API_BASE}/users/${perfilVisitadoId}/follow`;
      const res = await fetch(endpoint, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: misHeaders
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el follow');
      }

      setIsFollowing(prev => !prev);
      setUser(prev => prev ? {
        ...prev,
        follower_count: Math.max(0, (prev.follower_count || 0) + (isFollowing ? -1 : 1))
      } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFollow(false);
    }
  };

  // Carga inicial: perfil, comunidades, posts propios y objetivos
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!token && !perfilVisitadoId) {
        setErrorFetch('No hay sesión activa.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorFetch('');
      setShowProgreso(false);
      setShowFormObj(false);
      setPostSeleccionado(null);
      setTabActual('publicaciones');

      try {
        const urlPerfil = perfilVisitadoId ? `${API_BASE}/users/${perfilVisitadoId}` : `${API_BASE}/profile`;
        const urlPosts = perfilVisitadoId ? `${API_BASE}/users/${perfilVisitadoId}/posts` : `${API_BASE}/posts/user`;

        const [resPerfil, resComunidades, resPosts, resObjetivos, resSeguimiento] = await Promise.all([
          fetch(urlPerfil, perfilVisitadoId ? undefined : { headers: misHeaders }),
          perfilVisitadoId ? Promise.resolve(null) : fetch(`${API_BASE}/user/communities`, { headers: misHeaders }),
          fetch(urlPosts, perfilVisitadoId ? undefined : { headers: misHeaders }),
          perfilVisitadoId ? Promise.resolve(null) : fetch(`${API_BASE}/goals`, { headers: misHeaders }),
          perfilVisitadoId && token ? fetch(`${API_BASE}/users/${perfilVisitadoId}/is-following`, { headers: misHeaders }) : Promise.resolve(null)
        ]);

        const dataPerfil = resPerfil.ok ? await resPerfil.json() : null;
        if (!dataPerfil) throw new Error('No se pudo cargar el perfil');
        if (dataPerfil.error) throw new Error(dataPerfil.error);

        const dataComunidades = resComunidades && resComunidades.ok ? await resComunidades.json() : [];
        const dataPosts = resPosts.ok ? await resPosts.json() : [];
        const dataObjetivos = resObjetivos && resObjetivos.ok ? await resObjetivos.json() : [];
        const dataSeguimiento = resSeguimiento && resSeguimiento.ok ? await resSeguimiento.json() : null;

        setUser(dataPerfil);
        setComunidades(Array.isArray(dataComunidades) ? dataComunidades : []);
        setObjetivos(Array.isArray(dataObjetivos) ? dataObjetivos : []);
        setIsFollowing(!!dataSeguimiento?.is_following);

        const listaPosts = Array.isArray(dataPosts) ? dataPosts : [];
        setPostsPropios(listaPosts);
        if (token) {
          precargarLikes(listaPosts);
        }
      } catch (err) {
        setErrorFetch(err.message);
        setUser(null);
        setComunidades([]);
        setObjetivos([]);
        setPostsPropios([]);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [perfilVisitadoId]);

  // Carga del tab likes
  useEffect(() => {
    if (tabActual !== 'likes' || !token) return;

    const cargarPostsLikeados = async () => {
      setLoadingLikes(true);
      try {
        const listaComunidades = comunidades.length > 0
          ? comunidades
          : await fetch(`${API_BASE}/user/communities`, { headers: misHeaders })
              .then(r => r.ok ? r.json() : [])
              .then(d => Array.isArray(d) ? d : []);

        if (listaComunidades.length === 0) {
          setPostsLikes([]);
          setLoadingLikes(false);
          return;
        }

        const resultados = await Promise.allSettled(
          listaComunidades.map(c =>
            fetch(`${API_BASE}/community/${c.id}/posts`)
              .then(r => r.ok ? r.json() : [])
              .then(posts =>
                (Array.isArray(posts) ? posts : []).map(p => ({
                  ...p,
                  community_name: c.name
                }))
              )
          )
        );

        const todosLosPosts = resultados
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const cacheActual = loadLikesCache();
        const sinCache = todosLosPosts.filter(p => !(p.id in cacheActual));

        let likesFinal = { ...cacheActual };

        if (sinCache.length > 0) {
          const resultadosLike = await Promise.allSettled(
            sinCache.map(p =>
              fetch(`${API_BASE}/posts/${p.id}/user-like`, { headers: misHeaders })
                .then(r => r.ok ? r.json() : { liked: false })
                .then(d => ({ id: p.id, liked: !!d.liked, count: p.likes_count ?? 0 }))
            )
          );

          resultadosLike.forEach(r => {
            if (r.status === 'fulfilled') {
              likesFinal[r.value.id] = { liked: r.value.liked, count: r.value.count };
            }
          });

          setLikesMap(prev => ({ ...prev, ...likesFinal }));
        }

        const postsFiltrados = todosLosPosts.filter(p => likesFinal[p.id]?.liked === true);
        setPostsLikes(postsFiltrados);

      } catch (err) {
        console.error('Error cargando likes:', err);
        setPostsLikes([]);
      } finally {
        setLoadingLikes(false);
      }
    };

    cargarPostsLikeados();
  }, [tabActual, token]);

  const btnGuardarObjetivo = async () => {
    if (!nuevoObjetivo.title.trim() || !nuevoObjetivo.community_id) {
      setErrorObj('Completa el título y selecciona una comunidad.');
      return;
    }
    setIsSaving(true);
    setErrorObj('');
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { ...misHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoObjetivo)
      });
      if (!res.ok) throw new Error('No se pudo guardar el objetivo');
      const peticionLista = await fetch(`${API_BASE}/goals`, { headers: misHeaders });
      const nuevaLista = await peticionLista.json();
      setObjetivos(Array.isArray(nuevaLista) ? nuevaLista : []);
      setNuevoObjetivo({ title: '', difficulty: 'easy', community_id: '' });
      setShowFormObj(false);
    } catch (err) {
      setErrorObj(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const añoActual = fechaCal.getFullYear();
  const mesActual = fechaCal.getMonth();
  const fechaDeHoy = new Date();
  const diaPrimerSemana = new Date(añoActual, mesActual, 1).getDay();
  const diasTotalesDelMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const historialRacha = calcularDiasRacha(user?.streak);
  const diasRachaEsteMes = historialRacha.filter(d => d.mes === mesActual && d.año === añoActual);
  const diasRachaSet = new Set(diasRachaEsteMes.map(d => d.dia));

  const getClaseRacha = (dia) => {
    if (!diasRachaSet.has(dia)) return '';
    const tieneDiaAnterior = diasRachaSet.has(dia - 1);
    const tieneDiaSiguiente = diasRachaSet.has(dia + 1);
    if (tieneDiaAnterior && tieneDiaSiguiente) return 'racha-medio';
    if (tieneDiaAnterior && !tieneDiaSiguiente) return 'racha-fin';
    if (!tieneDiaAnterior && tieneDiaSiguiente) return 'racha-inicio';
    return 'racha-unico';
  };

  const miProgreso = user?.score ? Math.min(100, user.score % 100) : 0;
  const mostrarLikes = esPerfilPropio && tabActual === 'likes';
  const misPostsParaMostrar = mostrarLikes ? postsLikes : postsPropios;
  const isCargandoPosts = mostrarLikes ? loadingLikes : loading;

  return (
    <div className="hb-screen perfil-screen">

      {esPerfilPropio && (
        <button className="perfil-nivel-badge" onClick={() => setShowProgreso(true)}>
          <span className="nivel-numero">{user?.rank_id || 1}</span>
        </button>
      )}

      <header className="perfil-header">
        <div className="perfil-portada">
          <img
            src={user?.banner_url ? parsearUrl(user.banner_url) : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"}
            alt="Portada"
            className="portada-img"
          />
        </div>
        <div className="perfil-info">
          <div className="perfil-avatar-container">
            <img
              src={user?.avatar_url ? parsearUrl(user.avatar_url) : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200"}
              alt="Avatar"
              className="perfil-avatar"
            />
          </div>
          <div className="perfil-datos">
            <div className="perfil-nombres">
              <h2>{user?.username || '—'}</h2>
              <span>@{user?.username || '—'}</span>
            </div>
            <div className="perfil-acciones">
              {esPerfilPropio ? (
                <>
                  <button className="hb-btn hb-btn--primary btn-seguir">Tu perfil</button>
                  <button className="perfil-settings" aria-label="Ajustes" onClick={onConfiguracion}>⚙️</button>
                </>
              ) : (
                <button
                  className="hb-btn hb-btn--primary btn-seguir"
                  onClick={toggleFollow}
                  disabled={loadingFollow || !token}
                >
                  {!token ? 'Inicia sesión' : isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="perfil-stats">
          {loading ? (
            <span className="stat-tag">Cargando...</span>
          ) : errorFetch ? (
            <span className="stat-tag">{errorFetch}</span>
          ) : (
            <>
              <span className="stat-tag">⚡ {user?.streak || 0} días</span>
              <span className="stat-tag">🖼️ {user?.posts_count || 0} Posts</span>
              <span className="stat-tag">👥 {user?.follower_count || 0} Seguidores</span>
              <span className="stat-tag">👣 {user?.following_count || 0} Siguiendo</span>
              {comunidades.length > 0
                ? comunidades.map(c => <span key={c.id} className="stat-tag">#{c.name}</span>)
                : <span className="stat-tag">Sin comunidades</span>}
            </>
          )}
        </div>
      </header>

      <div className="perfil-tabs">
        <button className={`tab-btn ${tabActual === 'publicaciones' ? 'active' : ''}`} onClick={() => setTabActual('publicaciones')}>Publicaciones</button>
        {esPerfilPropio && <button className={`tab-btn ${tabActual === 'likes' ? 'active' : ''}`} onClick={() => setTabActual('likes')}>Likes</button>}
      </div>

      <section className="perfil-galeria">
        {isCargandoPosts && <p className="perfil-empty-state">Cargando...</p>}
        {!isCargandoPosts && misPostsParaMostrar.length === 0 && (
          <p className="perfil-empty-state">
            {tabActual === 'likes' ? 'Aún no has dado likes. ¡Explora!' : 'Sin publicaciones.'}
          </p>
        )}
        {!isCargandoPosts && misPostsParaMostrar.map(post => {
          const liked = likesMap[post.id]?.liked ?? false;
          const likeCount = likesMap[post.id]?.count ?? post.likes_count ?? 0;
          const puedeAbrirPerfil = !!onVerPerfil && post.user_id && String(post.user_id) !== String(user?.id);
          return (
            <div
              key={post.id}
              className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
              onClick={() => setPostSeleccionado(post)}
              style={{ cursor: 'pointer' }}
            >
              {post.media_url && <img src={parsearUrl(post.media_url)} alt="Post user" />}
              <div className="post-footer-mini">
                {puedeAbrirPerfil ? (
                  <button
                    type="button"
                    className="post-autor post-autor--clickable"
                    onClick={e => {
                      e.stopPropagation()
                      abrirPerfil(post.user_id)
                    }}
                  >
                    @{post.username || 'Usuario'}
                  </button>
                ) : null}
                <p>{post.content}</p>
                <span className="post-meta">
                  {formatearFecha(post.created_at)}
                  <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={e => toggleLike(post, e)}>
                    {liked ? '♥' : '♡'} {likeCount}
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {postSeleccionado && (
        <div className="modal-overlay post-overlay" onClick={() => setPostSeleccionado(null)}>
          <div className="post-detail-card" onClick={e => e.stopPropagation()}>
            <div className="post-detail-header">
              <img src={imagenUsuario} alt="Avatar" className="post-detail-avatar" />
              {postSeleccionado.user_id && String(postSeleccionado.user_id) !== String(user?.id) ? (
                <button
                  type="button"
                  className="post-detail-username post-detail-username-btn"
                  onClick={() => abrirPerfil(postSeleccionado.user_id)}
                >
                  {postSeleccionado.username || user?.username}
                </button>
              ) : (
                <span className="post-detail-username">{postSeleccionado.username || user?.username}</span>
              )}
            </div>
            {postSeleccionado.media_url && (
              <img src={parsearUrl(postSeleccionado.media_url)} alt="Contenido" className="post-detail-img" />
            )}
            <div className="post-detail-footer">
              <div className="post-detail-likes">
                <button
                  className={`like-btn like-btn--lg ${likesMap[postSeleccionado.id]?.liked ? 'liked' : ''}`}
                  onClick={e => toggleLike(postSeleccionado, e)}
                >
                  {likesMap[postSeleccionado.id]?.liked ? '♥' : '♡'}
                </button>
                <span className="like-count">
                  {likesMap[postSeleccionado.id]?.count ?? postSeleccionado.likes_count ?? 0}
                </span>
              </div>
              <div className="post-detail-caption">
                <strong>{postSeleccionado.username || user?.username}</strong> {postSeleccionado.content}
              </div>
              <div className="post-detail-comment"><strong>Comunidad:</strong> {postSeleccionado.community_name || 'Sin comunidad'}</div>
              <div className="post-detail-comment"><strong>Comentarios:</strong> {postSeleccionado.comments_count || 0}</div>
              <div className="post-detail-date">{formatearFecha(postSeleccionado.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {esPerfilPropio && showProgreso && (
        <div className="modal-overlay" onClick={() => setShowProgreso(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="progreso-circular">
                <span>{miProgreso}%</span>
                <small>Progreso</small>
              </div>
              <div className="progreso-nivel">
                <span className="nivel-insignia">{user?.rank_id || 1}</span>
                <small>{user?.rank_name || 'Nivel'}</small>
              </div>
            </div>
            <div className="calendario-placeholder">
              <div className="cal-header">
                <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={() => setFechaCal(new Date(añoActual, mesActual - 1, 1))}>&lt;</span>
                <span>{MESES[mesActual]} {añoActual}</span>
                <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={() => setFechaCal(new Date(añoActual, mesActual + 1, 1))}>&gt;</span>
              </div>
              <div className="cal-grid">
                {DIAS_SEMANA.map(dia => <span key={dia} className="cal-weekday">{dia}</span>)}
                {Array.from({ length: diaPrimerSemana }).map((_, i) => <span key={`vacio-${i}`} />)}
                {Array.from({ length: diasTotalesDelMes }, (_, i) => i + 1).map(diaDelMes => {
                  const esHoy = (diaDelMes === fechaDeHoy.getDate() && mesActual === fechaDeHoy.getMonth() && añoActual === fechaDeHoy.getFullYear());
                  return (
                    <div key={diaDelMes} className={`cal-dia-wrapper ${getClaseRacha(diaDelMes)}`}>
                      <span className={`cal-dia-num ${esHoy ? 'hoy' : ''}`}>{diaDelMes}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="objetivos-section">
              <div className="objetivos-header">
                <h3>⭐ Objetivos</h3>
                <button className="btn-add" onClick={() => { setShowFormObj(!showFormObj); setErrorObj(''); }}>
                  {showFormObj ? '✕ Cancelar' : '＋ Añadir'}
                </button>
              </div>
              {showFormObj && (
                <div className="objetivo-form">
                  <div className="hb-field">
                    <label>Título</label>
                    <input type="text" placeholder="Ej: Correr 5km" value={nuevoObjetivo.title} onChange={e => setNuevoObjetivo({ ...nuevoObjetivo, title: e.target.value })} />
                  </div>
                  <div className="hb-field">
                    <label>Dificultad</label>
                    <select className="objetivo-select" value={nuevoObjetivo.difficulty} onChange={e => setNuevoObjetivo({ ...nuevoObjetivo, difficulty: e.target.value })}>
                      <option value="easy">Fácil</option>
                      <option value="medium">Media</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                  <div className="hb-field">
                    <label>Comunidad</label>
                    <select className="objetivo-select" value={nuevoObjetivo.community_id} onChange={e => setNuevoObjetivo({ ...nuevoObjetivo, community_id: e.target.value })}>
                      <option value="">-- Selecciona --</option>
                      {comunidades.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {errorObj && <p className="objetivo-error">{errorObj}</p>}
                  <button className="hb-btn hb-btn--primary" onClick={btnGuardarObjetivo} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar objetivo'}
                  </button>
                </div>
              )}
              <ul className="objetivos-list">
                {!objetivos.length && !showFormObj && <p className="objetivo-vacio">No tienes objetivos aún.</p>}
                {objetivos.map(objetivo => (
                  <li key={objetivo.id}>
                    <div>
                      <p>{objetivo.title}</p>
                      <small>
                        {objetivo.status === 'completed'
                          ? `Completado el ${formatearFecha(objetivo.completed_at)}`
                          : `${objetivo.community_name || '—'} · ${objetivo.difficulty}`}
                      </small>
                    </div>
                    <input type="checkbox" checked={objetivo.status === 'completed'} onChange={async () => {
                      if (objetivo.status === 'completed') return;
                      await fetch(`${API_BASE}/goals/${objetivo.id}/complete`, { method: 'PATCH', headers: misHeaders });
                      setObjetivos(objetivos.map(o => o.id === objetivo.id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <BottomNav active={esPerfilPropio ? 'perfil' : ''} onInicio={onInicio} onExplorar={onExplorar} onPerfil={onPerfil} onCrear={onCrear} />
    </div>
  );
}