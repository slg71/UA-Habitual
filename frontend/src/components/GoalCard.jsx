export default function GoalCard({ 
  goal, 
  onComplete, 
  onDelete,
  isCompleting = false,
  isDeleting = false
}) {
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#7ea87a';      // verde
      case 'medium': return '#f4b942';    // naranja/amarillo
      case 'hard': return '#d32f2f';      // rojo
      default: return '#7ea87a';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Medio';
      case 'hard': return 'Difícil';
      default: return 'Desconocido';
    }
  };

  const isExpiring = goal.expires_at ? 
    (new Date(goal.expires_at) - new Date()) < (24 * 60 * 60 * 1000) : false;

  const daysRemaining = goal.expires_at ? 
    Math.ceil((new Date(goal.expires_at) - new Date()) / (24 * 60 * 60 * 1000)) : 0;

  return (
    <div className="goal-card">
      <div className="goal-header">
        <div className="goal-title-section">
          <h4 className="goal-title">{goal.title}</h4>
          <span 
            className="goal-difficulty-badge" 
            style={{ backgroundColor: getDifficultyColor(goal.difficulty) }}
          >
            {getDifficultyText(goal.difficulty)}
          </span>
        </div>
        <div className="goal-points">
          +{goal.points || 0} pts
        </div>
      </div>

      {goal.description && (
        <p className="goal-description">{goal.description}</p>
      )}

      <div className="goal-community">
        #{goal.community_name || 'comunidad'}
      </div>

      <div className="goal-footer">
        <div className={`goal-expiring ${isExpiring ? 'expiring-warning' : ''}`}>
          ⏱️ {daysRemaining > 0 ? `${daysRemaining}d restantes` : 'Vence hoy'}
        </div>
        <div className="goal-actions">
          {goal.status === 'pending' ? (
            <>
              <button 
                className="goal-btn goal-btn--complete"
                onClick={() => onComplete(goal)}
                disabled={isCompleting}
              >
                {isCompleting ? '...' : '✓'}
              </button>
              <button 
                className="goal-btn goal-btn--delete"
                onClick={() => onDelete(goal)}
                disabled={isDeleting}
              >
                {isDeleting ? '...' : '🗑️'}
              </button>
            </>
          ) : (
            <div className="goal-completed">
              ✓ Completado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
