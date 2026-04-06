import { useState, useEffect } from 'react';
import '../styles/habitual.css';
import '../styles/inicio.css';
import '../styles/perfil.css';

// Ejemplo con API:
// const [usuario, setUsuario] = useState(null);
// const [postsPerfil, setPostsPerfil] = useState([]);
// const [objetivos, setObjetivos] = useState([]);

// useEffect(() => {
//   // Cargar datos del perfil
//   fetch('/api/perfil/me').then(r => r.json()).then(setUsuario);
//   // Cargar el feed del perfil
//   fetch('/api/perfil/posts').then(r => r.json()).then(setPostsPerfil);
//   // Cargar objetivos y rachas
//   fetch('/api/perfil/objetivos').then(r => r.json()).then(setObjetivos);
// }, []);

const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const diasSemana = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function PerfilScreen( { onExplorar, onInicio, onPerfil, onCrear } ) {
  // Estados de UI básicos
  const [tabActiva, setTabActiva] = useState('publicaciones');
  const [mostrarProgreso, setMostrarProgreso] = useState(false);
  const [postSeleccionado, setPostSeleccionado] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [etiquetas, setEtiquetas] = useState([]);
  const [postsUsuario, setPostsUsuario] = useState([]);
  const [perfilCargando, setPerfilCargando] = useState(true);
  const [postsCargando, setPostsCargando] = useState(true);
  const [perfilError, setPerfilError] = useState('');

  // ── Lógica del Calendario de Rachas ──
  const [fechaVisualizada, setFechaVisualizada] = useState(new Date()); 
  
  // Array simulado: días que el usuario ha cumplido el hábito en este mes
  const [diasRacha, setDiasRacha] = useState([2, 3, 4, 8, 9, 14, 15, 16, 17, 22]); 

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setPerfilError('No hay sesión activa.');
      setPerfilCargando(false);
      setPostsCargando(false);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    const cargarPerfil = async () => {
      try {
        setPerfilCargando(true);
        setPostsCargando(true);
        setPerfilError('');

        const [profileRes, communitiesRes, postsRes] = await Promise.all([
          fetch('/api/profile', { headers }),
          fetch('/api/user/communities', { headers }),
          fetch('/api/posts/user', { headers })
        ]);

        const profileData = await profileRes.json();
        const communitiesData = await communitiesRes.json();
        const postsData = await postsRes.json();

        if (!profileRes.ok) {
          throw new Error(profileData?.error || 'No se pudo cargar el perfil.');
        }

        if (!communitiesRes.ok) {
          throw new Error(communitiesData?.error || 'No se pudieron cargar las etiquetas.');
        }

        if (!postsRes.ok) {
          throw new Error(postsData?.error || 'No se pudieron cargar tus publicaciones.');
        }

        setUsuario(profileData);
        setEtiquetas(Array.isArray(communitiesData) ? communitiesData : []);
        setPostsUsuario(Array.isArray(postsData) ? postsData : []);
      } catch (error) {
        setPerfilError(error.message || 'Error al cargar los datos del perfil.');
      } finally {
        setPerfilCargando(false);
        setPostsCargando(false);
      }
    };

    cargarPerfil();
  }, []);

  const añoActual = fechaVisualizada.getFullYear();
  const mesActual = fechaVisualizada.getMonth();

  // Matemáticas del calendario
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const primerDiaDelMes = new Date(añoActual, mesActual, 1).getDay();

  // Navegación de meses
  const irMesAnterior = () => setFechaVisualizada(new Date(añoActual, mesActual - 1, 1));
  const irMesSiguiente = () => setFechaVisualizada(new Date(añoActual, mesActual + 1, 1));

  // Comprobar si el día renderizado es hoy para resaltarlo
  const fechaHoyReal = new Date();
  const esHoy = (dia) => {
    return dia === fechaHoyReal.getDate() && 
           mesActual === fechaHoyReal.getMonth() && 
           añoActual === fechaHoyReal.getFullYear();
  };

  // Determinar la clase CSS para hacer la cápsula continua de la racha
  const obtenerClaseRacha = (dia) => {
    if (!diasRacha.includes(dia)) return "";

    const tieneAnterior = diasRacha.includes(dia - 1);
    const tieneSiguiente = diasRacha.includes(dia + 1);

    if (tieneAnterior && tieneSiguiente) return "racha-medio";
    if (tieneAnterior) return "racha-fin";
    if (tieneSiguiente) return "racha-inicio";
    return "racha-unico";
  };

  // Arrays de ayuda para el renderizado del grid
  const celdasVacias = Array.from({ length: primerDiaDelMes });
  const celdasDias = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const username = usuario?.username || 'usuario';
  const postsCount = Number(usuario?.posts_count) || 0;
  const followerCount = Number(usuario?.follower_count) || 0;
  const followingCount = Number(usuario?.following_count) || 0;
  const rachaActual = Number(usuario?.streak) || 0;
  const etiquetasNombre = etiquetas
    .map((etiqueta) => etiqueta?.name)
    .filter(Boolean);
  const resolverUrlMedia = (mediaUrl) => {
    if (!mediaUrl) return '';
    if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;
    return `/api${mediaUrl}`;
  };
  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '';
    return new Date(fechaIso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="hb-screen perfil-screen">
      
      {/* ── Insignia de Nivel ── */}
      <button className="perfil-nivel-badge" onClick={() => setMostrarProgreso(true)}>
        {/* {usuario?.nivel || 0} */}
        <span className="nivel-numero">1</span>
      </button>

      {/* ── Cabecera ── */}
      <header className="perfil-header">
        <div className="perfil-portada">
          {/* <img src={usuario?.fotoPortada} ... /> */}
          <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600" alt="Playa" className="portada-img" />
        </div>
        
        <div className="perfil-info">
          <div className="perfil-avatar-container">
            {/* <img src={usuario?.fotoAvatar} ... /> */}
            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200" alt="Juanjo23" className="perfil-avatar" />
          </div>
          
          <div className="perfil-datos">
            <div className="perfil-nombres">
              <h2>{username}</h2>
              <span>@{username}</span>
            </div>
            <button className="hb-btn hb-btn--primary btn-seguir">Tu perfil</button>
          </div>
        </div>

        {/* ── Estadísticas ── */}
        <div className="perfil-stats">
          {perfilCargando ? (
            <span className="stat-tag">Cargando perfil...</span>
          ) : (
            <>
              <span className="stat-tag">⚡ {rachaActual} días</span>
              <span className="stat-tag">🖼️ {postsCount} Posts</span>
              <span className="stat-tag">👥 {followerCount} Seguidores</span>
              <span className="stat-tag">👥 {followingCount} Siguiendo</span>
              {etiquetasNombre.length ? (
                etiquetasNombre.map((nombre, index) => (
                  <span key={`${nombre}-${index}`} className="stat-tag">#{nombre}</span>
                ))
              ) : (
                <span className="stat-tag">Sin etiquetas</span>
              )}
            </>
          )}
          {!!perfilError && <span className="stat-tag">{perfilError}</span>}
        </div>
      </header>

      {/* ── Pestañas ── */}
      <div className="perfil-tabs">
        <button 
          className={`tab-btn ${tabActiva === 'publicaciones' ? 'active' : ''}`}
          onClick={() => setTabActiva('publicaciones')}
        >
          Publicaciones
        </button>
        <button 
          className={`tab-btn ${tabActiva === 'likes' ? 'active' : ''}`}
          onClick={() => setTabActiva('likes')}
        >
          Likes
        </button>
      </div>

      {/* ── Galería (Feed del perfil) ── */}
      <section className="perfil-galeria">
        {postsCargando && <p className="perfil-empty-state">Cargando publicaciones...</p>}
        {!postsCargando && !postsUsuario.length && (
          <p className="perfil-empty-state">Aun no tienes publicaciones.</p>
        )}
        {!postsCargando && postsUsuario.map(post => (
          <div
            key={post.id}
            className={`perfil-post ${post.media_url ? '' : 'perfil-post--sin-img'}`}
            onClick={() => setPostSeleccionado(post)}
            style={{ cursor: 'pointer' }}
          >
            {post.media_url && (
              <img src={resolverUrlMedia(post.media_url)} alt="Publicacion" />
            )}
            <div className="post-footer-mini">
              <p>{post.content}</p>
              <span className="post-meta">
                {formatearFecha(post.created_at)}
                <span className="like-icon">♡ {post.likes_count || 0}</span>
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Modal: Detalle de Publicación ── */}
      {postSeleccionado && (
        <div className="modal-overlay post-overlay" onClick={() => setPostSeleccionado(null)}>
          <div className="post-detail-card" onClick={e => e.stopPropagation()}>
            
            <div className="post-detail-header">
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100" alt="Avatar" className="post-detail-avatar" />
              <span className="post-detail-username">{postSeleccionado.username || username}</span>
              <button className="post-detail-btn-seguir">Tu post</button>
            </div>

            {postSeleccionado.media_url && (
              <img
                src={resolverUrlMedia(postSeleccionado.media_url)}
                alt="Contenido multimedia"
                className="post-detail-img"
              />
            )}

            <div className="post-detail-footer">
              <div className="post-detail-likes">
                <span className="heart-icon">♡</span>
                <span className="like-count">{postSeleccionado.likes_count || 0}</span>
              </div>
              
              <div className="post-detail-caption">
                <strong>{postSeleccionado.username || username}</strong> {postSeleccionado.content}
              </div>

              <div className="post-detail-comment">
                <strong>Comunidad:</strong> {postSeleccionado.community_name || 'Sin comunidad'}
              </div>

              <div className="post-detail-comment">
                <strong>Comentarios:</strong> {postSeleccionado.comments_count || 0}
              </div>

              <div className="post-detail-date">{formatearFecha(postSeleccionado.created_at)}</div>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal: Progreso y Calendario ── */}
      {mostrarProgreso && (
        <div className="modal-overlay" onClick={() => setMostrarProgreso(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="progreso-circular">
                <span>30%</span>
                <small>Progreso</small>
              </div>
              <div className="progreso-nivel">
                <span className="nivel-insignia">1</span>
                <small>Nivel</small>
              </div>
            </div>

            {/* ── Componente del Calendario ── */}
            <div className="calendario-placeholder">
              <div className="cal-header">
                <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={irMesAnterior}>&lt;</span> 
                <span>{nombresMeses[mesActual]} {añoActual}</span> 
                <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={irMesSiguiente}>&gt;</span>
              </div>
              
              <div className="cal-grid">
                {/* 1. Imprimir días de la semana (L, M, X...) */}
                {diasSemana.map(dia => (
                  <span key={dia} className="cal-weekday">{dia}</span>
                ))}
                
                {/* 2. Imprimir celdas vacías para cuadrar el día 1 en su columna correcta */}
                {celdasVacias.map((_, i) => (
                  <span key={`vacia-${i}`}></span>
                ))}

                {/* 3. Imprimir los días del mes y aplicar lógica de racha */}
                {celdasDias.map(dia => {
                  const claseRacha = obtenerClaseRacha(dia);
                  const esDiaHoy = esHoy(dia);

                  return (
                    <div key={dia} className={`cal-dia-wrapper ${claseRacha}`}>
                      <span className={`cal-dia-num ${esDiaHoy ? 'hoy' : ''}`}>
                        {dia}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Objetivos ── */}
            <div className="objetivos-section">
              <div className="objetivos-header">
                <h3>⭐ Objetivos</h3>
                <button className="btn-add">⊕ Añadir</button>
              </div>
              
              <ul className="objetivos-list">
                <li>
                  <div>
                    <p>Dibujar todos los días durante una semana</p>
                    <small>Quedan 5 días</small>
                  </div>
                  <input type="checkbox" />
                </li>
                <li>
                  <div>
                    <p>Dibujar un paisaje</p>
                    <small>Quedan 2 días</small>
                  </div>
                  <input type="checkbox" defaultChecked />
                </li>
              </ul>
            </div>
            
          </div>
        </div>
      )}

      {/* ── Nav inferior ── */}
      <nav className="inicio-nav">
        <button className="inicio-nav-item" onClick={onInicio}>
          <span>⌂</span>
          <span>Inicio</span>
        </button>
        <button className="inicio-nav-item" onClick={onExplorar}>
          <span>🔍</span>
          <span>Explorar</span>
        </button>
        <button className="inicio-nav-item inicio-nav-item--active" onClick={onPerfil}>
          <span>👤</span>
          <span>Perfil</span>
        </button>
        <button className="inicio-nav-item" onClick={onCrear}>
          <span>＋</span>
          <span>Crear</span>
        </button>
      </nav>

    </div>
  );
}