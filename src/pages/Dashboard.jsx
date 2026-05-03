import { useState, useMemo } from 'react';
import { FRAMES, TIER_NAMES } from '../data/frames';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TICKER_CONTRACT } from '../domain/tickerContract';
import { SemanticChip } from '../components/primitives';
import { computeMilestoneProgress } from '../domain/services/milestoneTrackerService';
import { secureStorage } from '../storage/secureStorage';

export default function Dashboard({ navigateTo, showToast, activeTheme }) {
  const [saves] = useLocalStorage('whiz-saves', []);
  const [issues] = useLocalStorage('whiz-issues', []);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !secureStorage.settings.get('whiz-onboarded'); } catch(e) { return true; }
  });

  const published = issues.filter(i => i.status === 'published').length;
  const totalSaves = saves.length;
  const draftCount = issues.filter(i => i.status === 'draft' || i.status === 'wip').length;

  // D7: Last edited timestamp
  const lastEdited = saves.length > 0 ? new Date(saves.reduce((mx, s) => Math.max(mx, s.savedAt || 0), 0)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  const lastPublished = issues.filter(i => i.status === 'published').length > 0 ? 'Yes' : 'No';
  const milestoneProgress = useMemo(() => computeMilestoneProgress({ issues, frames: FRAMES }), [issues]);

  const sep = TICKER_CONTRACT.separator;
  const tickerText = `WHIZ.DEFI${sep}BRAND OS v8.0${sep}50 FRAMES${sep}10 THEMES${sep}ALPHA UNLOCKED${sep}TERMINAL MODE${sep}RESEARCH NOTE MODE${sep}DASHBOARD MODE${sep}`;

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try { secureStorage.settings.set('whiz-onboarded', '1'); } catch(e) {}
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">The Whiz Desk</div>
        <div className="page-desc">Your DeFi brand OS — build, customize, and ship 50-frame infographic content.{lastEdited && <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)', marginLeft: 8 }}>Last edit: {lastEdited}</span>}</div>
      </div>

      {/* D8: Onboarding for new users */}
      {showOnboarding && (
        <div style={{ padding: '20px 24px', marginBottom: 20, background: `linear-gradient(135deg, ${activeTheme.accent}08 0%, transparent 100%)`, border: `1px solid ${activeTheme.accent}30`, borderRadius: 'var(--r)', position: 'relative' }}>
          <button onClick={dismissOnboarding} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 700, color: activeTheme.accent, marginBottom: 8 }}>Welcome to Whiz v8.0</div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 14, maxWidth: 600 }}>Your DeFi infographic system is ready. Start by creating your first frame in the Editor, or browse the Library to find the perfect template for your content.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => { navigateTo('editor'); dismissOnboarding(); }}>Create First Frame →</button>
            <button className="btn btn-secondary" onClick={() => { navigateTo('library'); dismissOnboarding(); }}>Browse Library</button>
            <button className="btn btn-ghost" onClick={() => { navigateTo('docs'); dismissOnboarding(); }}>Read Docs</button>
          </div>
        </div>
      )}

      {/* Ticker — D5: animated with CSS */}
      <div className="ticker-bar" aria-hidden="true">
        <div className="ticker-inner" style={{ color: activeTheme.accent, fontFamily: TICKER_CONTRACT.typography.fontFamily, fontSize: `${TICKER_CONTRACT.typography.fontSizePx}px`, fontWeight: TICKER_CONTRACT.typography.fontWeight, letterSpacing: `${TICKER_CONTRACT.typography.letterSpacingEm}em`, textTransform: TICKER_CONTRACT.typography.textTransform, paddingLeft: `${TICKER_CONTRACT.padding.textInlineStartPct}%`, animationDuration: `${TICKER_CONTRACT.speed.default}s` }}>{tickerText}{tickerText}</div>
      </div>

      {/* Stats — D1: meaningful values */}
      <div className="dash-stats">
        {[
          { label: 'TOTAL FRAMES', value: '50', sub: 'templates ready' },
          { label: 'COLOR THEMES', value: '10', sub: 'systematic palettes' },
          { label: 'SAVED DESIGNS', value: totalSaves, sub: totalSaves > 0 ? `last: ${new Date(saves.reduce((mx, s) => Math.max(mx, s.savedAt || 0), 0)).toLocaleDateString()}` : 'in local storage' },
          { label: 'ISSUES LOGGED', value: issues.length, sub: `${published} published · ${draftCount} in progress` },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: activeTheme.accent }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><strong>Milestone Tracker</strong><span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)' }}>{Math.round(milestoneProgress.progress * 100)}%</span></div>
        <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}><div style={{ width: `${Math.round(milestoneProgress.progress * 100)}%`, height: '100%', background: activeTheme.accent }} /></div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Next milestone: {milestoneProgress.nextMilestone.label}</div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Quick Actions — D6: proper icons */}
        <div className="card">
          <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Quick Actions</div>
          <div className="quick-actions">
            <button className="btn btn-primary" onClick={() => navigateTo('editor', undefined, { newFrame: true })}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:6}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Frame
            </button>
            <button className="btn btn-secondary" onClick={() => navigateTo('library', undefined, { tier: row?.tier })}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:6}}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Browse Library
            </button>
            <button className="btn btn-secondary" onClick={() => navigateTo('planner')}>+ Add Issue</button>
            <button className="btn btn-secondary" onClick={() => navigateTo('themes')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:6}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/></svg>
              Switch Theme
            </button>
            <button className="btn btn-ghost" onClick={() => navigateTo('docs')} aria-label="Read documentation">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:6}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Read Manual
            </button>
          </div>
          <div className="divider" />
          <div className="font-mono text-xs" style={{ color: 'var(--dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>The 3-Post Weekly Rhythm</div>
          {[
            { day: 'MON', type: 'Weekly Recap', frameIds: [1, 2, 4, 5], color: '#3CE6A6' },
            { day: 'WED', type: 'Project Deep-Dive', frames: '08, 09, 12, 15', color: '#6FA8FF' },
            { day: 'FRI', type: 'Tracker / Tier List', frames: '16, 20, 21, 37', color: '#E5B23A' },
          ].map(r => (
            <div key={r.day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: r.color, width: 30, fontWeight: 700 }}>{r.day}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{r.type}</span>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)' }}>Frames {r.frames}</span>
            </div>
          ))}
        </div>

        {/* Frame Tiers */}
        <div className="card">
          <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Frame Tiers</div>
          {Object.entries(TIER_NAMES).map(([tier, name]) => {
            const count = FRAMES.filter(f => f.tier === tier).length;
            return (
              <div key={tier} className="flex items-center gap-2" style={{ padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s', marginBottom: 8 }}
                onClick={() => navigateTo('library')}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <SemanticChip kind="category" value={`tier-${tier}`}>TIER {tier}</SemanticChip>
                <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)' }}>{count} frames</span>
              </div>
            );
          })}
        </div>

        {/* Non-Negotiables */}
        <div className="card">
          <div className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>The Non-Negotiables</div>
          {[
            'One question per post. Write it before you open Figma.',
            'One theme color per post. Used in only 4 places.',
            'Three fonts. Eight sizes. No exceptions.',
            'Master frame is sacred. Never edit it per post.',
            'Verify every number against the primary source.',
            'Ship Monday / Wednesday / Friday.',
            'Tag every project featured. Free distribution.',
            'Pin the bangers. Update pinned post weekly.',
            'The first 50 will teach you what the next 500 should be.',
            'Boring consistency > creative chaos.',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: activeTheme.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{String(i+1).padStart(2,'0')}.</span>
              {rule}
            </div>
          ))}
        </div>

        {/* D3: Recent Saves — clicking navigates with specific save data */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Saves ({totalSaves})</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('editor', undefined, { newFrame: true })}>Open Editor →</button>
              {saves.length > 5 && <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)' }}>showing last 5 of {saves.length}</span>}
            </div>
          </div>
          {saves.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
              <div>No saves yet — create your first frame in the editor.</div>
            </div>
          ) : (
            <div className="saves-list">
              {saves.slice(-5).reverse().map(s => (
                <div key={s.id} className="save-item" onClick={() => navigateTo('editor', s.frameId, { saveId: s.id })} style={{ cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: s.theme?.base || 'var(--bg-3)', border: `2px solid ${s.theme?.accent || 'var(--border)'}`, flexShrink: 0 }} />
                  <div className="save-item-info">
                    <div className="save-item-name">{s.title || `Frame ${s.frameId}`}</div>
                    <div className="save-item-meta">{new Date(s.savedAt).toLocaleDateString()} · Frame #{s.frameId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="divider" />
          {/* D4: Pipeline with create CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="font-mono text-xs" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Content Pipeline ({draftCount} in progress)</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('planner')}>+ New Issue</button>
          </div>
          {issues.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: '10px 0' }}>No issues yet. <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('planner')} style={{ display: 'inline', textDecoration: 'underline' }}>Create one →</button></div>
          ) : (
            issues.slice(-3).reverse().map(issue => (
              <div key={issue.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 6, cursor: 'pointer' }} onClick={() => navigateTo('planner')}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)', width: 32 }}>#{issue.issueNum}</span>
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.topic || 'Untitled'}</span>
                <SemanticChip kind="status" value={issue.status}>{issue.status}</SemanticChip>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}