import { useState, useEffect } from 'react';
import '../styles/habitual.css';
import '../styles/perfil.css';
import BottomNav from '../components/common/BottomNav';
import ProfilePostCard from '../components/ProfilePostCard';
import ProfilePostDetailModal from '../components/ProfilePostDetailModal';
import ProfileProgressModal from '../components/ProfileProgressModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { API_BASE, getAuthHeaders } from '../utils/api';
import { getStoredToken, getUserIdFromToken } from '../utils/auth';
import { loadLikesCache, saveLikesCache } from '../utils/likesCache';
import imagenUsuario from '../assets/imagen-usuario.png';
import configIcon from '../assets/config.png';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS_SEMANA = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function PerfilScreen({ onExplorar, onInicio, onPerfil, onCrear, onConfiguracion, onVerPerfil, perfilVisitadoId, refreshPerfilKey }) {

  const [tabActual, setTabActual] = useState('publicaciones');
  const [showProgreso, setShowProgreso] = useState(false);
  const [postSeleccionado, setPostSeleccionado] = useState(null);
  const [commentCount, setCommentCount] = useState(0);
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
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showConfirmSaveGoal, setShowConfirmSaveGoal] = useState(false);

  const token = getStoredToken();
  const misHeaders = getAuthHeaders(token);
  const esPerfilPropio = !perfilVisitadoId;

  useEffect(() => {
    saveLikesCache(likesMap);
  }, [likesMap]);

  useEffect(() => {
    setAvatarFailed(false);
    setBannerFailed(false);
  }, [user]);

  const parsearUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const formatearFecha = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const calcularRachaDesdePost = (posts) => {
    if (!posts || posts.length === 0) return { dias: 0, historial: [] };

    // Convertir posts a fechas normalizadas (solo fecha, sin hora)
    const fechasConPosts = [];
    
    posts.forEach(post => {
      if (!post.created_at) return;
      const fecha = new Date(post.created_at);
      fecha.setHours(0, 0, 0, 0);
      
      // Evitar duplicados del mismo día
      if (!fechasConPosts.some(f => f.getTime() === fecha.getTime())) {
        fechasConPosts.push(fecha);
      }
    });

    // Ordenar descendentemente (más recientes primero)
    fechasConPosts.sort((a, b) => b - a);

    if (fechasConPosts.length === 0) return { dias: 0, historial: [] };

    // Verificar si la racha está activa (hay un post hoy o ayer)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ultimoPostFecha = fechasConPosts[0];

    // Si el último post fue hace más de 1 día, la racha se rompió
    const diasDesdeUltimo = Math.floor((hoy - ultimoPostFecha) / (1000 * 60 * 60 * 24));
    
    if (diasDesdeUltimo > 1) {
      return { dias: 0, historial: [] };
    }

    // Contar días consecutivos hacia atrás desde hoy
    let diasRacha = 0;
    let fechaActual = new Date(hoy);
    let indicePost = 0;

    while (indicePost < fechasConPosts.length) {
      const fechaPostActual = fechasConPosts[indicePost];

      if (fechaActual.getTime() === fechaPostActual.getTime()) {
        diasRacha++;
        fechaActual.setDate(fechaActual.getDate() - 1);
        indicePost++;
      } else {
        break;
      }
    }

    // Construir historial de racha (últimos N días)
    const historial = [];
    for (let i = 0; i < diasRacha; i++) {
      let fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      historial.push({
        mes: fecha.getMonth(),
        año: fecha.getFullYear(),
        dia: fecha.getDate()
      });
    }

    return { dias: diasRacha, historial };
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

  const borrarPost = async () => {
    if (!postSeleccionado || !token) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;

    setIsDeletingPost(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/posts/${postSeleccionado.id}`, {
        method: 'DELETE',
        headers: misHeaders
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar el post');
      }

      // Eliminar el post de la lista de posts propios
      setPostsPropios(prev => prev.filter(p => p.id !== postSeleccionado.id));
      setPostSeleccionado(null);
    } catch (err) {
      setDeleteError(err.message || 'Error al eliminar el post');
      console.error(err);
    } finally {
      setIsDeletingPost(false);
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
  }, [perfilVisitadoId, refreshPerfilKey]);

  // Recargar posts del usuario propio cuando entra a la pantalla para actualizar la racha
  useEffect(() => {
    if (!esPerfilPropio || !token) return;

    const recargarPostsAlEntrar = async () => {
      try {
        const res = await fetch(`${API_BASE}/posts/user`, { headers: getAuthHeaders(token) });
        if (res.ok) {
          const listaPosts = await res.json();
          setPostsPropios(Array.isArray(listaPosts) ? listaPosts : []);
          if (Array.isArray(listaPosts)) {
            precargarLikes(listaPosts);
          }
        }
      } catch (err) {
        console.error('Error recargando posts:', err);
      }
    };

    // Recargar posts una vez cuando entra al perfil propio
    recargarPostsAlEntrar();
  }, [esPerfilPropio, token]);

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

  const btnGuardarObjetivo = () => {
    if (!nuevoObjetivo.title.trim() || !nuevoObjetivo.community_id) {
      setErrorObj('Completa el título y selecciona una comunidad.');
      return;
    }
    setShowConfirmSaveGoal(true);
  };

  const confirmarGuardarObjetivo = async () => {
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
    setShowConfirmSaveGoal(false);
  };

  const actualizarNuevoObjetivo = (cambios) => {
    setNuevoObjetivo(prev => ({ ...prev, ...cambios }));
  };

  const completarObjetivo = async (objetivo) => {
    if (objetivo.status === 'completed') return;
    await fetch(`${API_BASE}/goals/${objetivo.id}/complete`, { method: 'PATCH', headers: misHeaders });
    setObjetivos(prev => prev.map(o => o.id === objetivo.id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
  };

  const añoActual = fechaCal.getFullYear();
  const mesActual = fechaCal.getMonth();
  const fechaDeHoy = new Date();
  const diaPrimerSemana = new Date(añoActual, mesActual, 1).getDay();
  const diasTotalesDelMes = new Date(añoActual, mesActual + 1, 0).getDate();
  
  // Calcular racha desde posts reales
  const { dias: diasRachaActuales, historial: historialRachaCalculado } = calcularRachaDesdePost(postsPropios);
  const historialRacha = historialRachaCalculado;
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
            src={!bannerFailed && user?.banner_url ? parsearUrl(user.banner_url) : imagenUsuario}
            alt="Portada"
            className="portada-img"
            onError={() => setBannerFailed(true)}
          />
        </div>
        <div className="perfil-info">
          <div className="perfil-avatar-container">
            <img
              src={!avatarFailed && user?.avatar_url ? parsearUrl(user.avatar_url) : imagenUsuario}
              alt="Avatar"
              className="perfil-avatar"
              onError={() => setAvatarFailed(true)}
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
                  <button className="perfil-settings" aria-label="Ajustes" onClick={onConfiguracion}><img src={configIcon} alt="Ajustes" className="config-icon" /></button>
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
              <span className="stat-tag">⚡ {diasRachaActuales || 0} días</span>
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
            <ProfilePostCard
              key={post.id}
              post={post}
              liked={likesMap[post.id]?.liked ?? false}
              likeCount={likesMap[post.id]?.count ?? post.likes_count ?? 0}
              canOpenProfile={puedeAbrirPerfil}
              onOpenPost={setPostSeleccionado}
              onOpenAuthor={abrirPerfil}
              onToggleLike={toggleLike}
              formatDate={formatearFecha}
              parseUrl={parsearUrl}
            />
          );
        })}
      </section>

      {postSeleccionado && (
        <ProfilePostDetailModal
          post={postSeleccionado}
          currentUsername={user?.username}
          currentUserId={user?.id}
          liked={likesMap[postSeleccionado.id]?.liked ?? false}
          likeCount={likesMap[postSeleccionado.id]?.count ?? postSeleccionado.likes_count ?? 0}
          onLike={toggleLike}
          onClose={() => setPostSeleccionado(null)}
          onOpenAuthor={abrirPerfil}
          commentCount={commentCount}
          onCommentCountChange={setCommentCount}
          onDelete={borrarPost}
          deleting={isDeletingPost}
          deleteError={deleteError}
          formatDate={formatearFecha}
          parseUrl={parsearUrl}
        />
      )}

      {esPerfilPropio && showProgreso && (
        <ProfileProgressModal
          open={showProgreso}
          onClose={() => setShowProgreso(false)}
          user={user}
          progress={miProgreso}
          monthLabel={MESES[mesActual]}
          yearLabel={añoActual}
          onPrevMonth={() => setFechaCal(new Date(añoActual, mesActual - 1, 1))}
          onNextMonth={() => setFechaCal(new Date(añoActual, mesActual + 1, 1))}
          weekdays={DIAS_SEMANA}
          emptySlots={diaPrimerSemana}
          daysInMonth={diasTotalesDelMes}
          isToday={diaDelMes => diaDelMes === fechaDeHoy.getDate() && mesActual === fechaDeHoy.getMonth() && añoActual === fechaDeHoy.getFullYear()}
          getStreakClass={getClaseRacha}
          showForm={showFormObj}
          onToggleForm={() => { setShowFormObj(!showFormObj); setErrorObj(''); }}
          newGoal={nuevoObjetivo}
          onChangeGoal={actualizarNuevoObjetivo}
          onSaveGoal={btnGuardarObjetivo}
          saving={isSaving}
          error={errorObj}
          communities={comunidades}
          goals={objetivos}
          onCompleteGoal={completarObjetivo}
        />
      )}

      <ConfirmationModal
        isOpen={showConfirmSaveGoal}
        title="Confirmar objetivo"
        message="¿Estás seguro de que quieres guardar este objetivo? Una vez guardado, no podrás eliminarlo hasta dentro de una semana."
        confirmText="Sí, guardar"
        cancelText="Cancelar"
        onConfirm={confirmarGuardarObjetivo}
        onCancel={() => setShowConfirmSaveGoal(false)}
        isLoading={isSaving}
      />

      <BottomNav active={esPerfilPropio ? 'perfil' : ''} onInicio={onInicio} onExplorar={onExplorar} onPerfil={onPerfil} onCrear={onCrear} />
    </div>
  );
}