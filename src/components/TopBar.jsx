export default function TopBar({ title, page, onHamburger, showToast, activeTheme, navigateTo }) {
  return (
    <div className="topbar">
      <button className="hamburger touch-target" onClick={onHamburger} aria-label="Toggle menu">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="3" y1="6" x2="17" y2="6"/>
          <line x1="3" y1="10" x2="14" y2="10"/>
          <line x1="3" y1="14" x2="17" y2="14"/>
        </svg>
      </button>
      <div>
        <div className="topbar-title">{title}</div>
        {page && <div className="topbar-sub" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, fontFamily: 'var(--font-m)' }}>
          {({'dashboard':'Dashboard','editor':'Editor','library':'Frame Library','planner':'Planner','themes':'Themes','typography':'Typography','docs':'Docs'})[page] || page}
        </div>}
      </div>
      <div className="topbar-actions touch-group">
        <button
          type="button"
          className="touch-target-compact-wrap"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', background: 'var(--bg-3)',
            borderRadius: 'var(--r)', border: '1px solid var(--border)',
            transition: 'all var(--t)',
          }}
          onClick={() => navigateTo('themes')}
          title="Switch theme"
          aria-label="Switch theme"
        >
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: activeTheme.accent, flexShrink: 0, display: 'inline-block',
            boxShadow: `0 0 6px ${activeTheme.accent}50`,
          }} />
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)' }}>
            {activeTheme.name}
          </span>
        </button>
        <button className="btn btn-primary btn-sm touch-target" onClick={() => navigateTo('editor')}>
          ✦ New Frame
        </button>
      </div>
    </div>
  );
}
