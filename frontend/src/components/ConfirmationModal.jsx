export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  onConfirm, 
  onCancel,
  isLoading = false,
  variant = 'primary'
}) {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <h3 className="confirmation-title">{title}</h3>
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-buttons">
          <button 
            className="hb-btn hb-btn--secondary confirmation-btn" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`hb-btn hb-btn--primary confirmation-btn confirmation-btn--${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
