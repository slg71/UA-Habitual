export default function ConfigPreferenceRow({ label, active, onToggle }) {
  return (
    <div className="cfg-fila">
      <span>{label}</span>
      <button
        type="button"
        className={`cfg-toggle ${active ? 'cfg-toggle--on' : ''}`}
        onClick={onToggle}
        aria-pressed={active}
      >
        <span className="cfg-toggle-bola" />
      </button>
    </div>
  )
}