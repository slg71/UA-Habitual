import { useState, useEffect } from 'react';
import '../styles/habitual.css';
import '../styles/inicio.css';
import '../styles/perfil.css';
import BottomNav from '../components/BottomNav';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS_SEMANA = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function PerfilScreen({ onExplorar, onInicio, onPerfil, onCrear, onConfiguracion }) {
  
  // ==========================================
  // 1. ESTADOS DEL COMPONENTE
  // ==========================================
  
  // Navegación interna y UI
  const [tabActual, setTabActual] = useState('publicaciones');
  const [showProgreso, setShowProgreso] = useState(false);
  const [postSeleccionado, setPostSeleccionado] = useState(null);
  
  // Datos del usuario
  const [user, setUser] = useState(null);
  const [comunidades, setComunidades] = useState([]);
  const [postsPropios, setPostsPropios] = useState([]);
  const [postsLikes, setPostsLikes] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [likesMap, setLikesMap] = useState({}); // Guarda el estado de los likes localmente
  
  // Estados de carga y errores
  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [errorFetch, setErrorFetch] = useState('');
  
  // Estados para el Modal de Objetivos
  const [showFormObj, setShowFormObj] = useState(false);
  const [nuevoObjetivo, setNuevoObjetivo] = useState({ title: '', difficulty: 'easy', community_id: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorObj, setErrorObj] = useState('');
  
  // Fecha actual para renderizar el calendario de rachas
  const [fechaCal, setFechaCal] = useState(new Date());

  // Credenciales para la API
  const token = localStorage.getItem('token');
  const misHeaders = { 'Authorization': `Bearer ${token}` };


  // ==========================================
  // 2. FUNCIONES AUXILIARES (HELPERS)
  // ==========================================
  
  // Asegura que las imágenes tengan la ruta correcta
  const parsearUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `/api${url}`;
  };

  // Convierte fechas ISO a formato legible (Ej: 06 de abril de 2026)
  const formatearFecha = (iso) => {
    if (!iso) return '';
    const fecha = new Date(iso);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Calcula qué días exactos conforman la racha actual del usuario
  const calcularDiasRacha = (streakActual) => {
    const totalDias = streakActual || 0;
    const historial = [];
    
    for (let i = 0; i < totalDias; i++) {
      let fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - i);
      
      historial.push({
        mes: fechaPasada.getMonth(),
        año: fechaPasada.getFullYear(),
        dia: fechaPasada.getDate()
      });
    }
    return historial;
  };


  // ==========================================
  // 3. LÓGICA DE API Y EFECTOS
  // ==========================================

  // Efecto principal: Cargar datos básicos al entrar al perfil
  useEffect(() => {
    if (!token) {
      setErrorFetch('No hay sesión activa.');
      setLoading(false);
      return;
    }

    const cargarDatosBasicos = async () => {
      try {
        // Usamos Promise.all para hacer las 4 peticiones a la vez y ahorrar tiempo
        const [resPerfil, resComunidades, resPosts, resObjetivos] = await Promise.all([
          fetch('/api/profile', { headers: misHeaders }),
          fetch('/api/user/communities', { headers: misHeaders }),
          fetch('/api/posts/user', { headers: misHeaders }),
          fetch('/api/goals', { headers: misHeaders })
        ]);

        const dataPerfil = await resPerfil.json();
        if (dataPerfil.error) throw new Error(dataPerfil.error);

        const dataComunidades = resComunidades.ok ? await resComunidades.json() : [];
        const dataPosts = await resPosts.json();
        const dataObjetivos = resObjetivos.ok ? await resObjetivos.json() : [];

        // Guardamos en el estado
        setUser(dataPerfil);
        setComunidades(Array.isArray(dataComunidades) ? dataComunidades : []);
        setObjetivos(Array.isArray(dataObjetivos) ? dataObjetivos : []);
        
        const listaPosts = Array.isArray(dataPosts) ? dataPosts : [];
        setPostsPropios(listaPosts);
        
        // posts tienen Like de este usuario
        precargarLikes(listaPosts);

      } catch (err) {
        setErrorFetch(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosBasicos();
  }, []);

  //Cargar posts a los que el usuario dio like si cambia de pestaña
  useEffect(() => {
    if (tabActual !== 'likes' || !token) return;
    
    const cargarPostsLikeados = async () => {
      setLoadingLikes(true);
      try {
        const respuesta = await fetch('/api/posts/liked', { headers: misHeaders });
        const data = await respuesta.json();
        
        const lista = Array.isArray(data) ? data : [];
        setPostsLikes(lista);
        precargarLikes(lista);
      } catch (error) {
        setPostsLikes([]); // Si falla, mostramos lista vacía
      } finally {
        setLoadingLikes(false);
      }
    };

    cargarPostsLikeados();
  }, [tabActual, token]);

  // Averigua si el usuario ya le dio like a una lista de posts
  const precargarLikes = async (listaDePosts) => {
    if (!listaDePosts.length || !token) return;

    try {
      // Pedimos el estado del like para cada post individual
      const peticiones = listaDePosts.map(post => 
        fetch(`/api/posts/${post.id}/user-like`, { headers: misHeaders })
      );
      
      const respuestas = await Promise.allSettled(peticiones);
      const nuevoMapaLikes = {};

      for (let i = 0; i < respuestas.length; i++) {
        const res = respuestas[i];
        if (res.status === 'fulfilled' && res.value.ok) {
          const data = await res.value.json();
          const postId = listaDePosts[i].id;
          
          nuevoMapaLikes[postId] = { 
            liked: Boolean(data.liked), 
            count: listaDePosts[i].likes_count || 0 
          };
        }
      }
      
      // Actualizamos el estado uniendo los likes antiguos con los nuevos
      setLikesMap(estadoAnterior => ({ ...estadoAnterior, ...nuevoMapaLikes }));
    } catch (error) {
      console.error("Error precargando likes:", error);
    }
  };

  // Función para dar o quitar Like
  const toggleLike = async (post, e) => {
    e.stopPropagation(); // Evita abrir el modal del post al hacer clic en el corazón
    if (!token) return;

    const postId = post.id;
    const yaTieneLike = likesMap[postId]?.liked ?? false;
    const cantidadActual = likesMap[postId]?.count ?? post.likes_count ?? 0;

    //Cambiamos la interfaz inmediatamente para que se sienta rápido,
    // antes de que el servidor nos responda.
    setLikesMap(estadoAnterior => ({
      ...estadoAnterior,
      [postId]: { 
        liked: !yaTieneLike, 
        count: yaTieneLike ? cantidadActual - 1 : cantidadActual + 1 
      }
    }));

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: yaTieneLike ? 'DELETE' : 'POST',
        headers: misHeaders
      });
    } catch (error) {
      // Si la petición falla, revertimos el botón a su estado original
      setLikesMap(estadoAnterior => ({ 
        ...estadoAnterior, 
        [postId]: { liked: yaTieneLike, count: cantidadActual } 
      }));
    }
  };

  // Función para crear un nuevo objetivo en el backend
  const btnGuardarObjetivo = async () => {
    if (!nuevoObjetivo.title.trim() || !nuevoObjetivo.community_id) {
      setErrorObj('Completa el título y selecciona una comunidad.');
      return;
    }
    
    setIsSaving(true); 
    setErrorObj('');
    
    try {
      const configPeticion = {
        method: 'POST',
        headers: { ...misHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoObjetivo)
      };
      
      const respuesta = await fetch('/api/goals', configPeticion);
      if (!respuesta.ok) throw new Error('No se pudo guardar el objetivo');
      
      // Si se guardó, volvemos a pedir la lista completa para actualizar la pantalla
      const peticionLista = await fetch('/api/goals', { headers: misHeaders });
      const nuevaLista = await peticionLista.json();
      
      setObjetivos(Array.isArray(nuevaLista) ? nuevaLista : []);
      
      // Limpiamos el formulario y lo cerramos
      setNuevoObjetivo({ title: '', difficulty: 'easy', community_id: '' }); 
      setShowFormObj(false);
      
    } catch (err) { 
      setErrorObj(err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };


  // ==========================================
  // 4. LÓGICA DE INTERFAZ (CALENDARIO)
  // ==========================================
  
  const añoActual = fechaCal.getFullYear();
  const mesActual = fechaCal.getMonth();
  const fechaDeHoy = new Date();
  
  const diaPrimerSemana = new Date(añoActual, mesActual, 1).getDay();
  const diasTotalesDelMes = new Date(añoActual, mesActual + 1, 0).getDate();
  
  // Obtenemos qué días exactos de este mes forman parte de la racha
  const historialRacha = calcularDiasRacha(user?.streak);
  const diasRachaEsteMes = historialRacha.filter(d => d.mes === mesActual && d.año === añoActual);
  const diasRachaSet = new Set(diasRachaEsteMes.map(d => d.dia));
  
  // Función para saber si un día concreto pinta inicio, medio, o fin de racha
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
  const misPostsParaMostrar = tabActual === 'likes' ? postsLikes : postsPropios;
  const isCargandoPosts = tabActual === 'likes' ? loadingLikes : loading;


  // ==========================================
  // 5. RENDERIZADO DEL COMPONENTE HTML
  // ==========================================

  return (
    <div className="hb-screen perfil-screen">
      
      <button className="perfil-nivel-badge" onClick={() => setShowProgreso(true)}>
        <span className="nivel-numero">{user?.rank_id || 1}</span>
      </button>

      {/* ── Cabecera del Perfil ── */}
      <header className="perfil-header">
        <div className="perfil-portada">
          <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600" alt="Portada" className="portada-img" />
        </div>
        
        <div className="perfil-info">
          <div className="perfil-avatar-container">
            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200" alt="Avatar" className="perfil-avatar" />
          </div>
          
          <div className="perfil-datos">
            <div className="perfil-nombres">
              <h2>{user?.username || '—'}</h2>
              <span>@{user?.username || '—'}</span>
            </div>
            
            <div className="perfil-acciones">
              <button className="hb-btn hb-btn--primary btn-seguir">Tu perfil</button>
              <button className="perfil-settings" aria-label="Ajustes" onClick={onConfiguracion}>⚙️</button>
            </div>
          </div>
        </div>

        {/* ── Estadísticas ── */}
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
              {comunidades.length > 0 ? (
                comunidades.map(comunidad => (
                  <span key={comunidad.id} className="stat-tag">#{comunidad.name}</span>
                ))
              ) : (
                <span className="stat-tag">Sin comunidades</span>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Navegación de Pestañas ── */}
      <div className="perfil-tabs">
        <button 
          className={`tab-btn ${tabActual === 'publicaciones' ? 'active' : ''}`} 
          onClick={() => setTabActual('publicaciones')}
        >
          Publicaciones
        </button>
        <button 
          className={`tab-btn ${tabActual === 'likes' ? 'active' : ''}`} 
          onClick={() => setTabActual('likes')}
        >
          Likes
        </button>
      </div>

      {/* ── Galería de Publicaciones ── */}
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

          return (
            <div 
              key={post.id} 
              className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`} 
              onClick={() => setPostSeleccionado(post)} 
              style={{ cursor: 'pointer' }}
            >
              {post.media_url && <img src={parsearUrl(post.media_url)} alt="Post user" />}
              <div className="post-footer-mini">
                <p>{post.content}</p>
                <span className="post-meta">
                  {formatearFecha(post.created_at)}
                  <button 
                    className={`like-btn ${liked ? 'liked' : ''}`} 
                    onClick={e => toggleLike(post, e)}
                  >
                    {liked ? '♥' : '♡'} {likeCount}
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Modal: Detalle de Publicación ── */}
      {postSeleccionado && (
        <div className="modal-overlay post-overlay" onClick={() => setPostSeleccionado(null)}>
          <div className="post-detail-card" onClick={e => e.stopPropagation()}>
            
            <div className="post-detail-header">
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100" alt="Avatar" className="post-detail-avatar" />
              <span className="post-detail-username">{postSeleccionado.username || user?.username}</span>
              <button className="post-detail-btn-seguir">Tu post</button>
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
              <div className="post-detail-comment">
                <strong>Comunidad:</strong> {postSeleccionado.community_name || 'Sin comunidad'}
              </div>
              <div className="post-detail-comment">
                <strong>Comentarios:</strong> {postSeleccionado.comments_count || 0}
              </div>
              <div className="post-detail-date">
                {formatearFecha(postSeleccionado.created_at)}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal: Progreso y Objetivos ── */}
      {showProgreso && (
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

            {/* Calendario */}
            <div className="calendario-placeholder">
              <div className="cal-header">
                <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={() => setFechaCal(new Date(añoActual, mesActual - 1, 1))}>&lt;</span>
                <span>{MESES[mesActual]} {añoActual}</span>
                <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={() => setFechaCal(new Date(añoActual, mesActual + 1, 1))}>&gt;</span>
              </div>
              
              <div className="cal-grid">
                {/* Días de la semana */}
                {DIAS_SEMANA.map(dia => <span key={dia} className="cal-weekday">{dia}</span>)}
                
                {/* Espacios vacíos hasta que empieza el mes */}
                {Array.from({ length: diaPrimerSemana }).map((_, i) => <span key={`vacio-${i}`} />)}
                
                {/* Días del mes con lógica de racha */}
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

            {/* Objetivos */}
            <div className="objetivos-section">
              <div className="objetivos-header">
                <h3>⭐ Objetivos</h3>
                <button 
                  className="btn-add" 
                  onClick={() => { setShowFormObj(!showFormObj); setErrorObj(''); }}
                >
                  {showFormObj ? '✕ Cancelar' : '＋ Añadir'}
                </button>
              </div>

              {/* Formulario Añadir Objetivo */}
              {showFormObj && (
                <div className="objetivo-form">
                  <div className="hb-field">
                    <label>Título</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Correr 5km" 
                      value={nuevoObjetivo.title} 
                      onChange={e => setNuevoObjetivo({...nuevoObjetivo, title: e.target.value})} 
                    />
                  </div>
                  <div className="hb-field">
                    <label>Dificultad</label>
                    <select 
                      className="objetivo-select" 
                      value={nuevoObjetivo.difficulty} 
                      onChange={e => setNuevoObjetivo({...nuevoObjetivo, difficulty: e.target.value})}
                    >
                      <option value="easy">Fácil</option>
                      <option value="medium">Media</option>
                      <option value="hard">Difícil</option>
                    </select>
                  </div>
                  <div className="hb-field">
                    <label>Comunidad</label>
                    <select 
                      className="objetivo-select" 
                      value={nuevoObjetivo.community_id} 
                      onChange={e => setNuevoObjetivo({...nuevoObjetivo, community_id: e.target.value})}
                    >
                      <option value="">-- Selecciona --</option>
                      {comunidades.map(comunidad => (
                        <option key={comunidad.id} value={comunidad.id}>{comunidad.name}</option>
                      ))}
                    </select>
                  </div>
                  {errorObj && <p className="objetivo-error">{errorObj}</p>}
                  <button 
                    className="hb-btn hb-btn--primary" 
                    onClick={btnGuardarObjetivo} 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar objetivo'}
                  </button>
                </div>
              )}

              {/* Lista de Objetivos */}
              <ul className="objetivos-list">
                {!objetivos.length && !showFormObj && (
                  <p className="objetivo-vacio">No tienes objetivos aún.</p>
                )}
                
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
                    <input 
                      type="checkbox" 
                      checked={objetivo.status === 'completed'} 
                      onChange={async () => {
                        if (objetivo.status === 'completed') return;
                        await fetch(`/api/goals/${objetivo.id}/complete`, { method: 'PATCH', headers: misHeaders });
                        setObjetivos(objetivos.map(o => o.id === objetivo.id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
                      }} 
                    />
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* ── Menú Inferior Fijo ── */}
      <BottomNav
        active="perfil"
        onInicio={onInicio}
        onExplorar={onExplorar}
        onPerfil={onPerfil}
        onCrear={onCrear}
      />
      
    </div>
  );
}