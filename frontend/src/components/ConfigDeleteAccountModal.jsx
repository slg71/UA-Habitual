export default function ConfigDeleteAccountModal({
  open,
  loading,
  error,
  password,
  confirmPassword,
  onClose,
  onDelete,
  onPasswordChange,
  onConfirmPasswordChange
}) {
  if (!open) return null

  return (
    <div className="cfg-overlay">
      <div className="cfg-modal">
        <h2 className="cfg-modal-titulo">¿Desea eliminar tu cuenta?</h2>
        <p className="cfg-modal-texto">
          Se eliminarán todos los datos de la cuenta y se cerrará la sesión automáticamente.
        </p>

        <div className="hb-field">
          <label>Contraseña</label>
          <input type="password" placeholder="Contraseña" value={password} onChange={e => onPasswordChange(e.target.value)} />
        </div>

        <div className="hb-field">
          <label>Confirmar contraseña</label>
          <input type="password" placeholder="Contraseña" value={confirmPassword} onChange={e => onConfirmPasswordChange(e.target.value)} />
        </div>

        {error && <p className="cfg-error">{error}</p>}

        <div className="cfg-botones">
          <button type="button" className="hb-btn hb-btn--secondary cfg-btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="hb-btn hb-btn--primary cfg-btn" onClick={onDelete} disabled={loading}>
            {loading ? 'Eliminando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}