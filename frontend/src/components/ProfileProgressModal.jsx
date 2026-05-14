import { useState } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 36;

const formatFechaBorrado = (createdAt) => {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
};

export default function ProfileProgressModal({
  open,
  onClose,
  user,
  nivel,
  progress,
  monthLabel,
  yearLabel,
  onPrevMonth,
  onNextMonth,
  weekdays,
  emptySlots,
  daysInMonth,
  isToday,
  getStreakClass,
  showForm,
  onToggleForm,
  newGoal,
  onChangeGoal,
  onSaveGoal,
  saving,
  error,
  communities,
  goals,
  onCompleteGoal
}) {
  const [showHelp, setShowHelp] = useState(false);
  if (!open) return null;

  const progressOffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
  {/* Círculo de progreso con barra */}
  <div className="progreso-circular">
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r="36" fill="none" stroke="var(--hb-bg)" strokeWidth="7" />
      <circle
        cx="44" cy="44" r="36"
        fill="none"
        stroke="var(--hb-green-lt)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="44" y="38"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '20px', fontWeight: 'bold', fill: 'var(--hb-brown)', fontFamily: 'var(--hb-font-title)' }}
      >
        {progress}%
      </text>
      <text
        x="44" y="58"
        textAnchor="middle"
        style={{ fontSize: '11px', fill: 'var(--hb-brown-mid)', fontFamily: 'var(--hb-font-body)' }}
      >
        Progreso
      </text>
    </svg>
  </div>

  {/* Nivel — sin barra, solo número centrado */}
  <div className="progreso-nivel">
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r="36" fill="none" stroke="var(--hb-bg)" strokeWidth="7" />
      <text
        x="44" y="38"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '28px', fontWeight: 'bold', fill: 'var(--hb-brown)', fontFamily: 'var(--hb-font-title)' }}
      >
        {nivel || 1}
      </text>
      <text
        x="44" y="58"
        textAnchor="middle"
        style={{ fontSize: '11px', fill: 'var(--hb-brown-mid)', fontFamily: 'var(--hb-font-body)' }}
      >
        Nivel
      </text>
    </svg>
  </div>
</div>

        <div className="calendario-placeholder">
          <div className="cal-header">
            <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={onPrevMonth}>&lt;</span>
            <span>{monthLabel} {yearLabel}</span>
            <span style={{ cursor: 'pointer', padding: '0 10px' }} onClick={onNextMonth}>&gt;</span>
          </div>
          <div className="cal-grid">
            {weekdays.map(dia => <span key={dia} className="cal-weekday">{dia}</span>)}
            {Array.from({ length: emptySlots }).map((_, i) => <span key={`vacio-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(diaDelMes => (
              <div key={diaDelMes} className={`cal-dia-wrapper ${getStreakClass(diaDelMes)}`}>
                <span className={`cal-dia-num ${isToday(diaDelMes) ? 'hoy' : ''}`}>{diaDelMes}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="objetivos-section">
          <div className="objetivos-header">
            <h3>Objetivos</h3>
            <div className="objetivos-header-actions">
              <button type="button" className="goal-help-btn" onClick={() => setShowHelp(prev => !prev)}>
                ?
              </button>
              <button className="btn-add" onClick={onToggleForm}>
                {showForm ? '✕ Cancelar' : '＋ Añadir'}
              </button>
            </div>
          </div>

          {showHelp && (
            <div className="goal-help-box">
              <p>Los objetivos se borran en una semana y se eliminaran automáticamente, si no se ha pulsado como objetivo completado, se borraran y no se podran sumar los puntos.</p>
              <p>Cada dificultad da más o menos puntos: si buscas un objetivo desafiante, marca objetivo difícil, si prefieres algo más sencillo, marca objetivo fácil.</p>
              <p>No hagas trampa con la dificultad: solo tú puedes ver estos objetivos. Úsalo como motivación, no para presumir.</p>
            </div>
          )}

          {showForm && (
            <div className="objetivo-form">
              <div className="hb-field">
                <label>Título</label>
                <input type="text" placeholder="Ej: Correr 5km" value={newGoal.title} onChange={e => onChangeGoal({ title: e.target.value })} />
              </div>
              <div className="hb-field">
                <label>Dificultad</label>
                <select className="objetivo-select" value={newGoal.difficulty} onChange={e => onChangeGoal({ difficulty: e.target.value })}>
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
              <div className="hb-field">
                <label>Comunidad</label>
                <select className="objetivo-select" value={newGoal.community_id} onChange={e => onChangeGoal({ community_id: e.target.value })}>
                  <option value="">-- Selecciona --</option>
                  {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {error && <p className="objetivo-error">{error}</p>}
              <button className="hb-btn hb-btn--primary" onClick={onSaveGoal} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar objetivo'}
              </button>
            </div>
          )}

          <ul className="objetivos-list">
            {!goals.length && !showForm && <p className="objetivo-vacio">No tienes objetivos aún.</p>}
            {goals.map(objetivo => (
              <li key={objetivo.id} className={`objetivo-item ${objetivo.status === 'completed' ? 'objetivo-item--completed' : ''}`}>
                <div className="objetivo-item-left">
                  <div>
                    <p className="objetivo-item-title">{objetivo.title}</p>
                    <small className="objetivo-item-meta">
                      {objetivo.status === 'completed'
                        ? `Completado el ${objetivo.completed_at
                            ? new Date(objetivo.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                            : ''}`
                        : `${objetivo.community_name || '—'} · ${objetivo.difficulty} · Se borra el ${formatFechaBorrado(objetivo.created_at)}`
                      }
                    </small>
                  </div>
                  <span className={`objetivo-badge objetivo-badge--${objetivo.difficulty}`}>
                    +{objetivo.points || 0} pts
                  </span>
                </div>
                <button
                  type="button"
                  className={`goal-action-btn ${objetivo.status === 'completed' ? 'goal-action-btn--done' : 'goal-action-btn--pending'}`}
                  onClick={() => onCompleteGoal(objetivo)}
                  disabled={objetivo.status === 'completed'}
                >
                  {objetivo.status === 'completed' ? 'Completado' : 'Marcar completado'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}