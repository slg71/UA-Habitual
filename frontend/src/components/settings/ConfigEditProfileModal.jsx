export default function ConfigEditProfileModal({
  open,
  loading,
  saving,
  error,
  success,
  username,
  email,
  avatarPreview,
  bannerPreview,
  onClose,
  onSave,
  onUsernameChange,
  onEmailChange,
  onAvatarChange,
  onBannerChange,
  onPasswordChange,
  onConfirmPasswordChange,
  newPassword,
  confirmPassword
}) {
  if (!open) return null

  return (
    <div className="cfg-overlay">
      <div className="cfg-modal cfg-modal--edit">
        <h2 className="cfg-modal-titulo">Editar perfil</h2>
        <p className="cfg-modal-texto">Actualiza tu nombre, email, contraseña o imágenes de perfil.</p>

        {loading ? (
          <p className="cfg-modal-texto">Cargando información...</p>
        ) : (
          <div className="cfg-modal-scrollable">
            <form className="hb-form" onSubmit={e => { e.preventDefault(); onSave() }}>
              <div className="hb-field">
                <label>Nombre de usuario</label>
                <input type="text" placeholder="Tu nombre de usuario" value={username} onChange={e => onUsernameChange(e.target.value)} />
              </div>

              <div className="hb-field">
                <label>Email</label>
                <input type="email" placeholder="usuario@ejemplo.com" value={email} onChange={e => onEmailChange(e.target.value)} />
              </div>

              <div className="hb-field">
                <label>Foto de perfil</label>
                <input type="file" accept="image/*" onChange={e => onAvatarChange(e.target.files?.[0] || null)} />
              </div>

              <div className="hb-field">
                <label>Foto de portada</label>
                <input type="file" accept="image/*" onChange={e => onBannerChange(e.target.files?.[0] || null)} />
              </div>

              {avatarPreview && <img className="cfg-image-preview" src={avatarPreview} alt="Vista previa avatar" />}
              {bannerPreview && <img className="cfg-image-preview" src={bannerPreview} alt="Vista previa portada" />}

              <div className="hb-field">
                <label>Nueva contraseña</label>
                <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => onPasswordChange(e.target.value)} />
              </div>

              <div className="hb-field">
                <label>Confirmar contraseña</label>
                <input type="password" placeholder="Repite la contraseña" value={confirmPassword} onChange={e => onConfirmPasswordChange(e.target.value)} />
              </div>

              {error && <p className="cfg-error">{error}</p>}
              {success && <p className="cfg-success">{success}</p>}
            </form>
          </div>
        )}

        <div className="cfg-botones">
          <button type="button" className="hb-btn hb-btn--secondary cfg-btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="hb-btn hb-btn--primary cfg-btn" onClick={onSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}