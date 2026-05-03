export default function PanelSection({ id, title, open, onToggle, complete = null, children }) {
  return (
    <section id={id} className="editor-section panel-collapsible">
      <button type="button" className="panel-section-head" onClick={onToggle} aria-expanded={open}>
        <span className="editor-section-title" style={{ marginBottom: 0 }}>{title}</span>
        <span style={{ display:'flex', gap: 8, alignItems:'center' }}>
          {complete !== null && <span className={`panel-complete ${complete ? 'ok':'warn'}`}>{complete ? 'Complete' : 'Needs work'}</span>}
          <span>{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open && <div className="panel-section-body">{children}</div>}
    </section>
  );
}
