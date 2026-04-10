import { useState, useEffect } from 'react';
import '../styles/habitual.css';
import '../styles/inicio.css';
import '../styles/perfil.css';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_SEMANA = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function PerfilScreen({ onExplorar, onInicio, onPerfil, onCrear }) {
  // --- ESTADOS --- (todo apretado para que ocupe menos)
  const [tabActual, setTabActual] = useState('publicaciones');
  const [showProgreso, setShowProgreso] = useState(false);
  const [postSeleccionado, setPostSeleccionado] = useState(null);
  const [user, setUser] = useState(null);
  const [comunidades, setComunidades] = useState([]);
  const [postsPropios, setPostsPropios] = useState([]);
  const [postsLikes, setPostsLikes] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [errorFetch, setErrorFetch] = useState('');
  
  // Modal objetivos
  const [showFormObj, setShowFormObj] = useState(false);
  const [nuevoObjetivo, setNuevoObjetivo] = useState({ title: '', difficulty: 'easy', community_id: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorObj, setErrorObj] = useState('');
  const [fechaCal, setFechaCal] = useState(new Date());

  const token = localStorage.getItem('token');
  const misHeaders = { 'Authorization': `Bearer ${token}` };

  // --- HELPERS Y LOGICA (modo oneliner) ---
  const parsearUrl = url => (!url ? '' : url.startsWith('http') ? url : `/api${url}`);
  const formatearFecha = iso => iso ? new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' }) : '';
  const calcularDiasRacha = strk => Array.from({ length: strk || 0 }, (_, i) => { let d = new Date(); d.setDate(d.getDate() - i); return { mes: d.getMonth(), año: d.getFullYear(), dia: d.getDate() }; });

  useEffect(() => {
    if (!token) return setErrorFetch('No hay sesión activa.') || setLoading(false);
    const cargarDatos = async () => {
      try {
        const [p, c, po, o] = await Promise.all([
          fetch('/api/profile', { headers: misHeaders }).then(r => r.json()),
          fetch('/api/user/communities', { headers: misHeaders }).then(r => r.ok ? r.json() : []),
          fetch('/api/posts/user', { headers: misHeaders }).then(r => r.json()),
          fetch('/api/goals', { headers: misHeaders }).then(r => r.ok ? r.json() : [])
        ]);
        if (p.error) throw new Error(p.error);
        setUser(p); setComunidades(Array.isArray(c)?c:[]); setPostsPropios(Array.isArray(po)?po:[]); setObjetivos(Array.isArray(o)?o:[]);
      } catch (err) { setErrorFetch(err.message); } finally { setLoading(false); }
    };
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tabActual !== 'likes' || !token) return;
    setLoadingLikes(true);
    fetch('/api/posts/liked', { headers: misHeaders })
      .then(r => r.json())
      .then(data => setPostsLikes(Array.isArray(data) ? data : []))
      .catch(() => setPostsLikes([]))
      .finally(() => setLoadingLikes(false));
  }, [tabActual, token]);

  const btnGuardarObjetivo = async () => {
    if (!nuevoObjetivo.title.trim() || !nuevoObjetivo.community_id) return setErrorObj('Completa título y comunidad bro.');
    setIsSaving(true); setErrorObj('');
    try {
      const res = await fetch('/api/goals', { method: 'POST', headers: { ...misHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoObjetivo) });
      if (!res.ok) throw new Error('Peto el fetch de crear objetivo');
      const nuevaLista = await fetch('/api/goals', { headers: misHeaders }).then(r => r.json());
      setObjetivos(Array.isArray(nuevaLista) ? nuevaLista : []);
      setNuevoObjetivo({ title: '', difficulty: 'easy', community_id: '' }); setShowFormObj(false);
    } catch (err) { setErrorObj(err.message); } finally { setIsSaving(false); }
  };

  // Variables de calendario y render
  let añoAct = fechaCal.getFullYear(), mesAct = fechaCal.getMonth(), hoyCale = new Date();
  let diaPrimer = new Date(añoAct, mesAct, 1).getDay(), diasDelMes = new Date(añoAct, mesAct + 1, 0).getDate();
  const diasRachaSet = new Set(calcularDiasRacha(user?.streak).filter(d => d.mes === mesAct && d.año === añoAct).map(d => d.dia));
  const getClaseRacha = dia => !diasRachaSet.has(dia) ? '' : (diasRachaSet.has(dia - 1) && diasRachaSet.has(dia + 1) ? 'racha-medio' : diasRachaSet.has(dia - 1) ? 'racha-fin' : diasRachaSet.has(dia + 1) ? 'racha-inicio' : 'racha-unico');
  let miProgreso = user?.score ? Math.min(100, user.score % 100) : 0;
  const misPostsActuales = tabActual === 'likes' ? postsLikes : postsPropios;
  const isCargandoPosts = tabActual === 'likes' ? loadingLikes : loading;

  return (
    <div className="hb-screen perfil-screen">
      <button className="perfil-nivel-badge" onClick={() => setShowProgreso(true)}><span className="nivel-numero">{user?.rank_id || 1}</span></button>

      {/* HEADER PERFIL */}
      <header className="perfil-header">
        <div className="perfil-portada"><img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600" alt="Portada" className="portada-img" /></div>
        <div className="perfil-info">
          <div className="perfil-avatar-container"><img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200" alt="Avatar" className="perfil-avatar" /></div>
          <div className="perfil-datos">
            <div className="perfil-nombres"><h2>{user?.username || '—'}</h2><span>@{user?.username || '—'}</span></div>
            <button className="hb-btn hb-btn--primary btn-seguir">Tu perfil</button>
          </div>
        </div>
        <div className="perfil-stats">
          {loading ? <span className="stat-tag">Cargando...</span> : errorFetch ? <span className="stat-tag">{errorFetch}</span> : (
            <>
              <span className="stat-tag">⚡ {user?.streak || 0} días</span><span className="stat-tag">🖼️ {user?.posts_count || 0} Posts</span>
              <span className="stat-tag">👥 {user?.follower_count || 0} Seguidores</span><span className="stat-tag">👣 {user?.following_count || 0} Siguiendo</span>
              {comunidades.length ? comunidades.map((c, i) => <span key={i} className="stat-tag">#{c.name}</span>) : <span className="stat-tag">Sin comunidades</span>}
            </>
          )}
        </div>
      </header>

      {/* TABS Y GALERIA */}
      <div className="perfil-tabs">
        <button className={`tab-btn ${tabActual === 'publicaciones' ? 'active' : ''}`} onClick={() => setTabActual('publicaciones')}>Publicaciones</button>
        <button className={`tab-btn ${tabActual === 'likes' ? 'active' : ''}`} onClick={() => setTabActual('likes')}>Likes</button>
      </div>

      <section className="perfil-galeria">
        {isCargandoPosts && <p className="perfil-empty-state">Cargando...</p>}
        {!isCargandoPosts && !misPostsActuales.length && <p className="perfil-empty-state">{tabActual === 'likes' ? 'Aún no has dado likes. Explora!' : 'Sin publicaciones.'}</p>}
        {!isCargandoPosts && misPostsActuales.map(p => (
          <div key={p.id} className={`perfil-post ${p.media_url ? '' : 'perfil-post--sin-img'}`} onClick={() => setPostSeleccionado(p)} style={{ cursor: 'pointer' }}>
            {p.media_url && <img src={parsearUrl(p.media_url)} alt="Post user" />}
            <div className="post-footer-mini"><p>{p.content}</p><span className="post-meta">{formatearFecha(p.created_at)}<span className="like-icon">♡ {p.likes_count || 0}</span></span></div>
          </div>
        ))}
      </section>

      {/* MODAL DETALLE POST */}
      {postSeleccionado && (
        <div className="modal-overlay post-overlay" onClick={() => setPostSeleccionado(null)}>
          <div className="post-detail-card" onClick={e => e.stopPropagation()}>
            <div className="post-detail-header"><img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100" alt="Avatar" className="post-detail-avatar" /><span className="post-detail-username">{postSeleccionado.username || user?.username}</span><button className="post-detail-btn-seguir">Tu post</button></div>
            {postSeleccionado.media_url && <img src={parsearUrl(postSeleccionado.media_url)} alt="Contenido" className="post-detail-img" />}
            <div className="post-detail-footer">
              <div className="post-detail-likes"><span className="heart-icon">♡</span><span className="like-count">{postSeleccionado.likes_count || 0}</span></div>
              <div className="post-detail-caption"><strong>{postSeleccionado.username || user?.username}</strong> {postSeleccionado.content}</div>
              <div className="post-detail-comment"><strong>Comunidad:</strong> {postSeleccionado.community_name || 'Sin comunidad'}</div>
              <div className="post-detail-comment"><strong>Comentarios:</strong> {postSeleccionado.comments_count || 0}</div>
              <div className="post-detail-date">{formatearFecha(postSeleccionado.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROGRESO Y OBJETIVOS */}
      {showProgreso && (
        <div className="modal-overlay" onClick={() => setShowProgreso(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="progreso-circular"><span>{miProgreso}%</span><small>Progreso</small></div>
              <div className="progreso-nivel"><span className="nivel-insignia">{user?.rank_id || 1}</span><small>{user?.rank_name || 'Nivel'}</small></div>
            </div>

            <div className="calendario-placeholder">
              <div className="cal-header">
                <span style={{ cursor:'pointer', padding:'0 10px' }} onClick={() => setFechaCal(new Date(añoAct, mesAct - 1, 1))}>&lt;</span>
                <span>{MESES[mesAct]} {añoAct}</span>
                <span style={{ cursor:'pointer', padding:'0 10px' }} onClick={() => setFechaCal(new Date(añoAct, mesAct + 1, 1))}>&gt;</span>
              </div>
              <div className="cal-grid">
                {DIAS_SEMANA.map(d => <span key={d} className="cal-weekday">{d}</span>)}
                {Array.from({ length: diaPrimer }).map((_, i) => <span key={`v${i}`} />)}
                {Array.from({ length: diasDelMes }, (_, i) => i + 1).map(dia => (
                  <div key={dia} className={`cal-dia-wrapper ${getClaseRacha(dia)}`}><span className={`cal-dia-num ${dia === hoyCale.getDate() && mesAct === hoyCale.getMonth() && añoAct === hoyCale.getFullYear() ? 'hoy' : ''}`}>{dia}</span></div>
                ))}
              </div>
            </div>

            <div className="objetivos-section">
              <div className="objetivos-header"><h3>⭐ Objetivos</h3><button className="btn-add" onClick={() => { setShowFormObj(!showFormObj); setErrorObj(''); }}>{showFormObj ? '✕ Cancelar' : '＋ Añadir'}</button></div>
              
              {showFormObj && (
                <div className="objetivo-form">
                  <div className="hb-field"><label>Título</label><input type="text" placeholder="Ej: Correr 5km" value={nuevoObjetivo.title} onChange={e => setNuevoObjetivo({...nuevoObjetivo, title: e.target.value})} /></div>
                  <div className="hb-field"><label>Dificultad</label><select className="objetivo-select" value={nuevoObjetivo.difficulty} onChange={e => setNuevoObjetivo({...nuevoObjetivo, difficulty: e.target.value})}><option value="easy">Fácil</option><option value="medium">Media</option><option value="hard">Difícil</option></select></div>
                  <div className="hb-field"><label>Comunidad</label><select className="objetivo-select" value={nuevoObjetivo.community_id} onChange={e => setNuevoObjetivo({...nuevoObjetivo, community_id: e.target.value})}><option value="">-- Selecciona --</option>{comunidades.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  {errorObj && <p className="objetivo-error">{errorObj}</p>}
                  <button className="hb-btn hb-btn--primary" onClick={btnGuardarObjetivo} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar objetivo'}</button>
                </div>
              )}

              <ul className="objetivos-list">
                {!objetivos.length && !showFormObj && <p className="objetivo-vacio">No tienes objetivos aún.</p>}
                {objetivos.map(obj => (
                  <li key={obj.id}>
                    <div><p>{obj.title}</p><small>{obj.status === 'completed' ? `Completado el ${formatearFecha(obj.completed_at)}` : `${obj.community_name || '—'} · ${obj.difficulty}`}</small></div>
                    <input type="checkbox" checked={obj.status === 'completed'} onChange={async () => {
                      if (obj.status === 'completed') return;
                      await fetch(`/api/goals/${obj.id}/complete`, { method: 'PATCH', headers: misHeaders });
                      setObjetivos(objetivos.map(o => o.id === obj.id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR INFERIOR */}
      <nav className="inicio-nav">
        <button className="inicio-nav-item" onClick={onInicio}><span>⌂</span><span>Inicio</span></button>
        <button className="inicio-nav-item" onClick={onExplorar}><span>🔍</span><span>Explorar</span></button>
        <button className="inicio-nav-item inicio-nav-item--active" onClick={onPerfil}><span>👤</span><span>Perfil</span></button>
        <button className="inicio-nav-item" onClick={onCrear}><span>＋</span><span>Crear</span></button>
      </nav>
    </div>
  );
}