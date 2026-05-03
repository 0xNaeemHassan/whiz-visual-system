import { MOTION_PREFERENCE } from '../hooks/useMotionPreference';

export default function TopBar({ title, page, onHamburger, showToast, activeTheme, navigateTo, motionPreference, setMotionPreference }) {
  return (
    <div className="topbar">
      <button className="hamburger" onClick={onHamburger} aria-label="Toggle menu">
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
      <div className="topbar-actions">
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', background: 'var(--bg-3)',
            borderRadius: 'var(--r)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'all var(--t)',
          }}
          onClick={() => navigateTo('themes')}
          title="Switch theme"
        >
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: activeTheme.accent, flexShrink: 0, display: 'inline-block',
            boxShadow: `0 0 6px ${activeTheme.accent}50`,
          }} />
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)' }}>
            {activeTheme.name}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigateTo('editor')}>
          \u2726 New Frame
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)' }}>
          Motion
          <select className="motion-select" value={motionPreference} onChange={(e) => setMotionPreference(e.target.value)}>
            <option value={MOTION_PREFERENCE.SYSTEM}>System</option>
            <option value={MOTION_PREFERENCE.REDUCE}>Reduce</option>
            <option value={MOTION_PREFERENCE.FULL}>Full</option>
          </select>
        </label>
      </div>
    </div>
  );
}
