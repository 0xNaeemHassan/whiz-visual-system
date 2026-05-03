import { useEffect, useMemo, useRef, useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'library', label: 'Library', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> },
  { id: 'editor', label: 'Editor', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg> },
  { id: 'planner', label: 'Planner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> },
  { id: 'themes', label: 'Themes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg> },
  { id: 'typography', label: 'Typography', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg> },
  { id: 'docs', label: 'Docs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg> },
];

const UI_STATE_KEY = 'whiz-right-panel-ui';

export default function Sidebar({ page, onNav, open, theme, formSections = [], actions = {}, validationErrors = {}, onFieldChange }) {
  const panelRef = useRef(null);
  const [sectionOpen, setSectionOpen] = useState({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(UI_STATE_KEY) || '{}');
      setSectionOpen(saved.sectionOpen || {});
      if (panelRef.current && typeof saved.scrollTop === 'number') panelRef.current.scrollTop = saved.scrollTop;
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({ sectionOpen, scrollTop: panelRef.current?.scrollTop || 0 }));
  }, [sectionOpen]);

  const completion = useMemo(() => Object.fromEntries(formSections.map(s => [s.id, (s.fields || []).every(f => !validationErrors[f.id])])), [formSections, validationErrors]);

  const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand"><div className="sidebar-logo"><span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: theme.accent, letterSpacing: '-0.02em' }}>WHIZ</span></div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'var(--dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>DEFI DESK</div></div>
      <nav className="sidebar-nav">{NAV_ITEMS.map(item => (<button key={item.id} className={`sidebar-item ${page === item.id ? 'active' : ''}`} onClick={() => onNav(item.id)} aria-label={`Go to ${item.label}`} aria-current={page === item.id ? 'page' : undefined}><span className="sidebar-icon" aria-hidden="true">{item.icon}</span><span className="sidebar-label">{item.label}</span></button>))}</nav>

      {!!formSections.length && <div ref={panelRef} style={{ marginTop: 10, overflowY: 'auto', maxHeight: '42vh', paddingRight: 4 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {formSections.map(s => <button key={s.id} className="btn btn-ghost btn-sm" onClick={() => jumpTo(s.id)}>{s.title}</button>)}
        </div>
        {formSections.map(section => {
          const isOpen = sectionOpen[section.id] ?? true;
          return <section key={section.id} id={section.id} className="editor-section">
            <button className="btn btn-ghost btn-sm w-full" onClick={() => setSectionOpen(prev => ({ ...prev, [section.id]: !isOpen }))} style={{ justifyContent: 'space-between', display: 'flex' }}>
              <strong>{section.title}</strong><span>{completion[section.id] ? '✓ Complete' : '• In progress'}</span>
            </button>
            {isOpen && (section.fields || []).map(field => <div className="form-group" key={field.id}><label className="form-label">{field.label}</label><input id={field.id} value={field.value || ''} onChange={e => onFieldChange?.(field.id, e.target.value)} />{validationErrors[field.id] && <div style={{ color: '#FFB3B3', fontSize: 10, marginTop: 4 }}>{validationErrors[field.id]}</div>}</div>)}
          </section>;
        })}
        <button className="btn btn-ghost btn-sm w-full" onClick={() => panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>↑ Back to top</button>
      </div>}

      {!!formSections.length && <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-2)', paddingTop: 8, display: 'grid', gap: 6 }}>
        <button className="btn btn-secondary btn-sm" onClick={actions.onSave}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={actions.onValidate}>Validate</button>
        <button className="btn btn-primary btn-sm" onClick={actions.onExport}>Export</button>
      </div>}
      <div className="sidebar-footer"><div className="sidebar-version">v8.0 — Premium Edition</div></div>
    </aside>
  );
}
