export default function DownloadConfirmModal({ onConfirm, onCancel, filename }) {
  return (
    <div 
      className="modal-overlay" 
      onClick={onCancel}
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        className="download-confirm-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--hb-bg)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '380px',
          textAlign: 'center',
          border: '2px solid var(--hb-green-dk)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        <h3 style={{ 
          color: 'var(--hb-brown)', 
          marginTop: 0, 
          marginBottom: '16px',
          fontSize: '20px',
          fontWeight: 700
        }}>
          📥 Descargar archivo
        </h3>
        <p style={{ 
          color: 'var(--hb-text)', 
          fontSize: '15px', 
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          ¿Quieres descargar los archivos de este post?
        </p>
        {filename && (
          <p style={{ 
            color: 'var(--hb-brown)', 
            fontSize: '13px', 
            fontWeight: 600, 
            marginBottom: '24px', 
            wordBreak: 'break-all',
            background: 'rgba(168, 200, 164, 0.15)',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--hb-green-lt)'
          }}>
            {filename}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              border: '2px solid var(--hb-green-lt)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'var(--hb-green-dk)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s',
              flex: 1
            }}
            onMouseEnter={e => {
              e.target.style.background = 'var(--hb-green-lt)'
              e.target.style.color = 'var(--hb-green-dk)'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'transparent'
              e.target.style.color = 'var(--hb-green-dk)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '10px',
              background: 'var(--hb-green-dk)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s',
              flex: 1
            }}
            onMouseEnter={e => {
              e.target.style.background = 'var(--hb-green)'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 12px rgba(93, 133, 89, 0.4)'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'var(--hb-green-dk)'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            Descargar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
