import { useEffect, useMemo, useState } from 'react';
import { useUIEventContext } from '../state/UIEventContext';
import { AccessibleIconButton } from './primitives';
export default function TopBar({ title, page, onHamburger, showToast, activeTheme, navigateTo }) {
  const { activityEntries, unreadCount, markActivityLogRead } = useUIEventContext();
  const [showLog, setShowLog] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const filteredEntries = useMemo(() => (
    severityFilter === 'all'
      ? activityEntries
      : activityEntries.filter((entry) => entry.status === severityFilter)
  ), [activityEntries, severityFilter]);

  const toggleLog = () => {
    const next = !showLog;
    setShowLog(next);
    if (next) markActivityLogRead();
  };
  const handleEntryKeyNav = (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const entries = Array.from(event.currentTarget.querySelectorAll('[data-log-entry="true"]'));
    const currentIndex = entries.findIndex((node) => node === document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    const offset = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = Math.min(entries.length - 1, Math.max(0, currentIndex + offset));
    entries[nextIndex]?.focus();
  };
  useEffect(() => {
    if (!showLog) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setShowLog(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLog]);

  return (
    <div className="topbar">
      <AccessibleIconButton className="hamburger" onClick={onHamburger} label="Open navigation menu">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="3" y1="6" x2="17" y2="6"/>
          <line x1="3" y1="10" x2="14" y2="10"/>
          <line x1="3" y1="14" x2="17" y2="14"/>
        </svg>
      </AccessibleIconButton>
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
          title="Open theme settings"
          aria-label="Open theme settings"
          role="button"
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
        <button className="btn btn-secondary btn-sm" onClick={toggleLog} aria-expanded={showLog} aria-controls="activity-log-panel">
          Activity {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      </div>
      {showLog && (
        <div
          id="activity-log-panel"
          role="dialog"
          aria-label="Activity log"
          style={{ position: 'absolute', top: 56, right: 16, zIndex: 30, width: 360, maxHeight: 360, overflow: 'auto', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 10 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 12 }}>Activity Log</strong>
            <select aria-label="Filter activity severity" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="all">All</option><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option>
            </select>
          </div>
          <ul onKeyDown={handleEntryKeyNav} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredEntries.length === 0 ? <li style={{ fontSize: 11, opacity: 0.7 }}>No activity yet.</li> : filteredEntries.map((entry) => (
              <li data-log-entry="true" key={entry.id} tabIndex={0} role="article" aria-label={`${entry.status} ${entry.type} ${entry.message}`} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ textTransform: 'uppercase', opacity: 0.8 }}>{entry.status}</span>
                  <time>{new Date(entry.timestamp).toLocaleTimeString()}</time>
                </div>
                <div>{entry.message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
