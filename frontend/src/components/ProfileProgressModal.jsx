export default function ProfileProgressModal({
  open,
  onClose,
  user,
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
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="progreso-circular">
            <span>{progress}%</span>
            <small>Progreso</small>
          </div>
          <div className="progreso-nivel">
            <span className="nivel-insignia">{user?.rank_id || 1}</span>
            <small>{user?.rank_name || 'Nivel'}</small>
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
            <h3>⭐ Objetivos</h3>
            <button className="btn-add" onClick={onToggleForm}>
              {showForm ? '✕ Cancelar' : '＋ Añadir'}
            </button>
          </div>

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
              <li key={objetivo.id}>
                <div>
                  <p>{objetivo.title}</p>
                  <small>
                    {objetivo.status === 'completed'
                      ? `Completado el ${objetivo.completed_at ? new Date(objetivo.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}`
                      : `${objetivo.community_name || '—'} · ${objetivo.difficulty}`}
                  </small>
                </div>
                <input type="checkbox" checked={objetivo.status === 'completed'} onChange={() => onCompleteGoal(objetivo)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}