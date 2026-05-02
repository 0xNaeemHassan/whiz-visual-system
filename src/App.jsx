import { useState, useEffect, useCallback, Component, lazy, Suspense } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Toast from './components/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_THEME } from './data/themes';

// K4: Code splitting — lazy load pages
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Library    = lazy(() => import('./pages/Library'));
const Editor     = lazy(() => import('./pages/Editor'));
const Themes     = lazy(() => import('./pages/Themes'));
const Typography = lazy(() => import('./pages/Typography'));
const Planner    = lazy(() => import('./pages/Planner'));
const Docs       = lazy(() => import('./pages/Docs'));

const PAGES = {
  dashboard:  'Dashboard',
  library:    'Frame Library',
  editor:     'Frame Editor',
  themes:     'Color Themes',
  typography: 'Typography',
  planner:    'Content Planner',
  docs:       'Documentation',
};

// L1, L2: SVG icons instead of Unicode
const NAV_ICONS = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  library: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  editor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>,
  planner: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  themes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>,
  // Fix #87: Typography and Docs added to bottom nav
  typography: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>,
  docs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

// Fix #87: Show all 7 pages on mobile bottom nav
const BOTTOM_NAV = [
  { id: 'dashboard', label: 'Home' },
  { id: 'library',   label: 'Library' },
  { id: 'editor',    label: 'Create' },
  { id: 'planner',   label: 'Plan' },
  { id: 'themes',    label: 'Themes' },
];

// Fix #5: Docs page was writing #doc-* hashes that conflicted with app routing.
// Now we use state-based routing internally; URL uses only app-level hashes (#/page).
function getPageFromHash() {
  const hash = window.location.hash;
  // Handle #/page and legacy bare #page; ignore #doc-* (docs internal)
  const clean = hash.replace('#/', '').replace(/^#/, '').split('?')[0];
  // Strip doc-internal sub-hashes
  if (clean.startsWith('doc-')) return 'docs';
  return PAGES[clean] ? clean : 'dashboard';
}

// K1: Real React Error Boundary per page (class component)
class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(`Error Boundary [${this.props.page}]:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#8B95A3' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠</div>
          <h3 style={{ color: '#F4F5F7', marginBottom: 8, fontSize: 16 }}>
            Something went wrong in {this.props.page}
          </h3>
          <p style={{ fontSize: 12, marginBottom: 16, maxWidth: 360, lineHeight: 1.6, margin: '0 auto 16px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn btn-primary btn-sm"
            onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--dim)' }}>
      <div className="spinner" />
    {/* M-13: First-run onboarding modal */}
      {showOnboarding && (
        <div className="modal-overlay open" onClick={() => { setShowOnboarding(false); setHasSeenOnboarding(true); }} style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: 18 }}>Welcome to Whiz ✦</span>
            </div>
            <div style={{ padding: '4px 0 16px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Whiz is a visual system for creating <strong style={{ color: 'var(--fg)' }}>DeFi infographic frames</strong> — ready to post on X, Farcaster, or Substack.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  ['✦', 'Frame Library', 'Browse 50 templates across 8 layouts'],
                  ['◐', 'Editor', 'Edit content, style, and export to PNG or WebP'],
                  ['☰', 'Planner', 'Plan your content calendar with CSV import/export'],
                  ['◉', 'Themes', 'Switch or create custom color themes'],
                ].map(([icon, name, desc]) => (
                  <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: 16, color: 'var(--accent)', lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--font-m)', padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                Tip: ⌘S saves your work · ⌘Z undoes content changes · ⌘⇧Z redoes
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowOnboarding(false); setHasSeenOnboarding(true); navigateTo('docs'); }}>Read Docs</button>
              <button className="btn btn-primary" onClick={() => { setShowOnboarding(false); setHasSeenOnboarding(true); navigateTo('library'); }}>Browse Frames →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTheme, setActiveTheme] = useLocalStorage('whiz-theme', DEFAULT_THEME);
  const [activeFontPairing, setActiveFontPairing] = useLocalStorage('whiz-font-pairing', {
    id: 'default', name: 'Space Grotesk + Inter',
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  });
  // Fix #11: editingFrame now includes a serial so Editor can detect re-opens of the same frame
  const [editingFrame, setEditingFrame] = useState(null);
  // M-13: Onboarding — show once for new users
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage('whiz-onboarding-done', false);
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding);

  // Fix #63: newFrameSignal — bump this to tell Editor to reset to a blank new frame
  const [newFrameSignal, setNewFrameSignal] = useState(0);
  // Fix #24: Library pre-filter state (passed via navigateTo)
  const [libraryPreFilter, setLibraryPreFilter] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() });
  }, []);

  const navigateTo = useCallback((p, frameId, opts = {}) => {
    setPage(p);
    if (p === 'editor') {
      if (frameId !== undefined) {
        // Fix #11: Wrap in object with a serial so Editor always sees a "new" signal
        setEditingFrame({ frameId, serial: Date.now(), issue: opts.issue || null });
      } else if (opts.newFrame) {
        // Fix #38/63: Explicit "new frame" action — Editor should reset everything
        setEditingFrame(null);
        setNewFrameSignal(n => n + 1);
      }
    }
    if (p === 'library' && opts.tier) {
      // Fix #23/24: Pre-filter Library by tier
      setLibraryPreFilter({ tier: opts.tier });
    } else if (p !== 'library') {
      setLibraryPreFilter(null);
    }
    setSidebarOpen(false);
    window.history.pushState({ page: p }, '', `#/${p}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fix #11: Expose clearEditingFrame so Editor can clear it after consuming
  const clearEditingFrame = useCallback(() => setEditingFrame(null), []);

  // Listen for browser back/forward
  useEffect(() => {
    const handler = () => {
      setPage(getPageFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Set initial hash
  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState({ page: 'dashboard' }, '', '#/dashboard');
    }
  }, []);

  // Escape key handler — Fix #26: only dispatch whiz-escape, not page-level escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        // Only dispatch to active page to avoid ghost events on hidden pages
        window.dispatchEvent(new CustomEvent('whiz-escape', { detail: { page } }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [page]);

  const pageProps = {
    showToast, activeTheme, setActiveTheme, navigateTo,
    editingFrame, clearEditingFrame, newFrameSignal,
    libraryPreFilter, setLibraryPreFilter,
    activeFontPairing, setActiveFontPairing,
  };

  const pageStyle = {
    '--theme-accent': activeTheme.accent,
    '--theme-base':   activeTheme.base,
  };

  const renderPage = (id, PageComponent) => (
    <div
      key={id}
      style={{ display: page === id ? 'block' : 'none' }}
      className="page"
      id={page === id ? 'main-content' : undefined}
      aria-hidden={page !== id}
    >
      {/* Fix #110: Per-page error boundaries so one crash doesn't kill the whole app */}
      <PageErrorBoundary page={id}>
        <Suspense fallback={<PageLoader />}>
          <PageComponent {...pageProps} isActive={page === id} />
        </Suspense>
      </PageErrorBoundary>
    </div>
  );

  return (
    <div id="app" style={pageStyle}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar page={page} onNav={navigateTo} open={sidebarOpen} theme={activeTheme} />
      <main className="main">
        <TopBar
          title={PAGES[page]}
          page={page}
          onHamburger={() => setSidebarOpen(o => !o)}
          showToast={showToast}
          activeTheme={activeTheme}
          navigateTo={navigateTo}
        />
        {renderPage('dashboard', Dashboard)}
        {renderPage('library', Library)}
        {renderPage('editor', Editor)}
        {renderPage('themes', Themes)}
        {renderPage('typography', Typography)}
        {renderPage('planner', Planner)}
        {renderPage('docs', Docs)}
      </main>

      {/* Fix #87: All 5 primary nav items shown */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
        {BOTTOM_NAV.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => navigateTo(item.id)}
            aria-label={`Go to ${item.label}`}
            aria-current={page === item.id ? 'page' : undefined}
          >
            <span className="bnav-icon" aria-hidden="true">{NAV_ICONS[item.id]}</span>
            <span className="bnav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Fix #34/36: FAB now triggers a proper new-frame reset, uses SVG icon */}
      <button
        className="fab"
        onClick={() => navigateTo('editor', undefined, { newFrame: true })}
        aria-label="Create New Frame"
        title="New Frame"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <Toast toast={toast} />
    {/* M-13: First-run onboarding modal */}
      {showOnboarding && (
        <div className="modal-overlay open" onClick={() => { setShowOnboarding(false); setHasSeenOnboarding(true); }} style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ fontSize: 18 }}>Welcome to Whiz ✦</span>
            </div>
            <div style={{ padding: '4px 0 16px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Whiz is a visual system for creating <strong style={{ color: 'var(--fg)' }}>DeFi infographic frames</strong> — ready to post on X, Farcaster, or Substack.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  ['✦', 'Frame Library', 'Browse 50 templates across 8 layouts'],
                  ['◐', 'Editor', 'Edit content, style, and export to PNG or WebP'],
                  ['☰', 'Planner', 'Plan your content calendar with CSV import/export'],
                  ['◉', 'Themes', 'Switch or create custom color themes'],
                ].map(([icon, name, desc]) => (
                  <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: 16, color: 'var(--accent)', lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--font-m)', padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                Tip: ⌘S saves your work · ⌘Z undoes content changes · ⌘⇧Z redoes
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowOnboarding(false); setHasSeenOnboarding(true); navigateTo('docs'); }}>Read Docs</button>
              <button className="btn btn-primary" onClick={() => { setShowOnboarding(false); setHasSeenOnboarding(true); navigateTo('library'); }}>Browse Frames →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
