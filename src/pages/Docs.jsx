import { useState, useEffect, useRef, useCallback } from 'react';
import { parseHashLocation, buildHash } from '../router/hashRouter';

const SECTIONS = [
  { id: 'intro', label: 'Introduction', group: 'OVERVIEW' },
  { id: 'metaphor', label: 'Core Metaphor', group: 'OVERVIEW' },
  { id: 'frame-system', label: 'Universal Frame System', group: 'SYSTEM' },
  { id: 'color', label: 'Color Theming', group: 'SYSTEM' },
  { id: 'typography-doc', label: 'Typography', group: 'SYSTEM' },
  { id: 'data-presentation', label: 'Data Presentation', group: 'SYSTEM' },
  { id: 'phase1', label: 'Phase 1: Foundation', group: 'PLAYBOOK' },
  { id: 'phase2', label: 'Phase 2: Cadence', group: 'PLAYBOOK' },
  { id: 'phase3', label: 'Phase 3: Production', group: 'PLAYBOOK' },
  { id: 'phase4', label: 'Phase 4: Compounding', group: 'PLAYBOOK' },
  { id: 'non-neg', label: 'Non-Negotiables', group: 'RULES' },
];

export default function Docs({ activeTheme }) {
  const [activeSection, setActiveSection] = useState('intro');
  const [docsSearch, setDocsSearch] = useState('');
  const visibleSections = docsSearch.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(docsSearch.toLowerCase()) ||
        (Array.isArray(s.items) ? s.items.some(item => (typeof item === 'string' ? item : item.title || '').toLowerCase().includes(docsSearch.toLowerCase())) : false)
      )
    : SECTIONS;
  const [tocOpen, setTocOpen] = useState(false); // I3: Mobile TOC toggle
  const contentRef = useRef(null);

  // Docs-local navigation: read ?section=... from current app hash route
  useEffect(() => {
    const { query } = parseHashLocation(window.location.hash);
    const section = query.get('section');
    if (section && SECTIONS.find((s) => s.id === section)) {
      setActiveSection(section);
      setTimeout(() => {
        const el = document.getElementById(`doc-${section}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  // I1: TOC scroll-tracking with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('doc-', '');
            setActiveSection(id);
            // I2: Update URL hash without scroll
            const { route, query } = parseHashLocation(window.location.hash);
    query.set('section', id);
    window.history.replaceState(window.history.state, '', buildHash(route, query));
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(`doc-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(`doc-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
    setTocOpen(false);
    const { route, query } = parseHashLocation(window.location.hash);
    query.set('section', id);
    window.history.replaceState(window.history.state, '', buildHash(route, query));
  }, []);

  // L15: Use proper heading tags
  const Section = ({ id, title, children }) => (
    <section id={`doc-${id}`} className="docs-section" aria-labelledby={`heading-${id}`}>
      <h2 id={`heading-${id}`} className="docs-h1">{title}</h2>
      {children}
    </section>
  );

  const SubHead = ({ children }) => <h3 className="docs-h2">{children}</h3>;

  return (
    <>
      <div className="page-header docs-page-header">
        <div className="page-title">Documentation
        <div className="search-wrap docs-search-wrap">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="5"/><path d="m15 15-3-3"/></svg>
          <input placeholder="Search docs…" value={docsSearch} onChange={e => setDocsSearch(e.target.value)} />
          {docsSearch && <button className="search-clear" onClick={() => setDocsSearch('')}>✕</button>}
        </div></div>
        <div className="page-desc">The complete Whiz Defi Desk operating manual — from foundation to compounding growth.</div>
      </div>

      <div className="docs-layout">
        {/* I3: Mobile TOC toggle */}
        <button className="docs-toc-toggle" onClick={() => setTocOpen(o => !o)} aria-label="Toggle table of contents">
          {tocOpen ? '✕ Close' : '☰ Contents'}
        </button>

        {/* TOC — I1: scroll tracking, I2: deep links, I3: mobile responsive, L14: nav element */}
        <nav className={`docs-toc ${tocOpen ? 'open' : ''}`} aria-label="Table of Contents">
          {(() => {
            let lastGroup = null;
            return SECTIONS.map(s => {
              const showGroup = s.group !== lastGroup;
              lastGroup = s.group;
              return (
                <div key={s.id}>
                  {showGroup && <div className="docs-toc-section">{s.group}</div>}
                  <a className={`docs-toc-item ${activeSection === s.id ? 'active' : ''}`}
                    href={`#doc-${s.id}`}
                    onClick={(e) => { e.preventDefault(); scrollTo(s.id); }}>
                    {s.label}
                  </a>
                </div>
              );
            });
          })()}
        </nav>

        {/* Content */}
        <div className="docs-content" ref={contentRef} style={{ '--docs-accent': activeTheme.accent }}>

          <Section id="intro" title="The Whiz Visual System™">
            <p className="docs-p">A complete 50-frame brand framework for DeFi infographics. Built around a single unifying visual metaphor — applied consistently to every post you create.</p>
            <div className="docs-tip">
              <strong>Core principle:</strong> Your system needs its own metaphor — a unifying visual world that's instantly recognizable as YOU. Every post looks like a piece of professional trading infrastructure.
            </div>
            <p className="docs-p">Unlike generic design templates, the Whiz Visual System is opinionated. Three sub-metaphors rotate inside one world:</p>
            <ul className="docs-list">
              <li><strong>Terminal Mode</strong> — for data, lists, rankings (mono fonts, tight grids)</li>
              <li><strong>Research Note Mode</strong> — for deep-dives, theses (editorial, larger type)</li>
              <li><strong>Dashboard Mode</strong> — for ecosystem maps, comparisons (card grids, icons)</li>
            </ul>
          </Section>

          <Section id="metaphor" title="The Core Metaphor: DeFi Trading Desk">
            <p className="docs-p">Every post looks like a piece of professional trading infrastructure: a Bloomberg terminal, an order book, a portfolio dashboard, a research note from a quant desk.</p>
            <p className="docs-p"><strong>Not playful. Not cartoon. Authoritative, sharp, "alpha-locked."</strong></p>
            <div className="docs-code">{`METAPHOR:
  Bloomberg Terminal → data-dense frames
  Investment Memo    → deep-dive frames  
  Trading Dashboard  → comparison frames
  Research Report    → thesis frames`}</div>
            <p className="docs-p">The comparison to Elis_Defi's macOS terminal aesthetic: it works because it has a <em>consistent metaphor</em> applied to every post. Your moat is built the same way — not through variety, but through relentless consistency.</p>
          </Section>

          <Section id="frame-system" title="The Universal Frame System">
            <p className="docs-p">Every Whiz infographic shares 7 anchor elements. This is your DNA — never skip any of them.</p>

            <SubHead>1. The Ticker Header</SubHead>
            <p className="docs-p">A horizontal "market ticker" bar at the very top, ~50px tall, dark background. Monospace text includes: <code className="docs-inline-code-accent">WHIZ.DEFI ▸ {'{DATE}'} ▸ {'{ISSUE_NUMBER}'} ▸ {'{TOPIC_TAG}'} ▸ ALPHA UNLOCKED ▸</code></p>
            <div className="docs-tip">Looks like a stock ticker. Static image, but feels alive.</div>

            <SubHead>2. The Slug Block (top-left)</SubHead>
            <div className="docs-code">{`ISSUE / 047
FILED / 04.29.26
DESK  / YIELD`}</div>
            <p className="docs-p">Monospace font, 10-12pt, muted color. Mimics a research-note byline. This is what makes it feel like a filed document, not a social post.</p>

            <SubHead>3. The Topic Tag (top-right)</SubHead>
            <p className="docs-p">A pill-shaped tag: <code className="docs-inline-code-accent">▸ STABLECOIN RISK</code> — the color of the pill equals the post's theme color. The only place the theme color appears in the frame chrome itself.</p>

            <SubHead>4. The Spine (left edge)</SubHead>
            <p className="docs-p">A 4-6px vertical bar running the full height of the post, in the post's theme color. Inside, rotated 90°: <code className="docs-inline-code-accent">WHIZ DEFI DESK / VOL.{'{VOLUME}'}</code></p>

            <SubHead>5. The Title Slab</SubHead>
            <p className="docs-p">Bold, oversized title in Space Grotesk 700, with a thin horizontal rule beneath it AND a one-line "deck" (subtitle in italic) explaining what the post answers. This is the editorial heart.</p>

            <SubHead>6. The Footer Strip (~70px)</SubHead>
            <div className="docs-code">{`LEFT:   @0xWhizMiz + avatar
CENTER: STATUS: PUBLISHED ▸ NEXT DROP: 05.06.26 ▸ SOURCES VERIFIED ✓
RIGHT:  WHIZ.DEFI/{ISSUE_NUMBER} · social icons`}</div>

            <SubHead>7. The Corner Trim</SubHead>
            <p className="docs-p">Each of the 4 corners has a small L-shaped bracket (⌐ ¬ ⌐ ¬). Subtle, but signals "this is a Whiz post" instantly. Like camera viewfinder marks.</p>
          </Section>

          <Section id="color" title="Color Theming System">
            <p className="docs-p">Never random, always meaningful. Each post uses ONE theme color, expressed in only 4 places:</p>
            <ul className="docs-list">
              <li>The spine (6px vertical bar)</li>
              <li>The topic tag pill</li>
              <li>~20% of section headers</li>
              <li>One accent element (a chart line, a key number)</li>
            </ul>
            <p className="docs-p">Everything else stays in the neutral system: <code className="docs-inline-code-accent">#0F1318</code> (near-black), <code className="docs-inline-code-accent">#F4F5F7</code> (off-white), <code className="docs-inline-code-accent">#8B95A3</code> (muted gray).</p>
            <div className="docs-warning"><strong>This is what makes posts feel cohesive — restraint with color.</strong> The temptation to add more color is always wrong.</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 12 }}>
              {[
                ['Vault Navy', '#0B1A3A', '#6FA8FF', 'Stablecoins, treasuries, RWAs'],
                ['Yield Green', '#0A3D2E', '#3CE6A6', 'APYs, farming, staking'],
                ['Bull Gold', '#1F1608', '#E5B23A', 'BTC, store-of-value, macro'],
                ['Liquidation Red', '#2A0A0A', '#FF5A5A', 'Exploits, hacks, risk'],
                ['L2 Teal', '#062F33', '#3FE2D6', 'Rollups, scaling, infra'],
                ['Privacy Plum', '#1B0B2E', '#B97AFF', 'ZK, privacy, mixers'],
              ].map(([name, base, accent, usage]) => (
                <div key={name} style={{ padding: '8px 10px', background: base, borderRadius: 'var(--r)', borderLeft: `3px solid ${accent}` }}>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: accent, fontWeight: 600, marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{usage}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="typography-doc" title="Typography System">
            <p className="docs-p"><strong>Three fonts, no exceptions:</strong></p>
            <div className="docs-code">{`Display: Space Grotesk 700   → Titles, big numbers, section heads
Body:    Inter 400/500        → All paragraphs, table cells, captions
Mono:    JetBrains Mono 400/600 → Ticker, slug, footer, code, data tags`}</div>
            <p className="docs-p"><strong>Font sizes are quantized — never freeform:</strong></p>
            <div className="docs-code">10 / 12 / 14 / 18 / 24 / 36 / 56 / 84pt</div>
            <div className="docs-tip">This single quantization rule makes your work look 10× more professional. The brain reads consistent rhythms as authoritative.</div>
          </Section>

          <Section id="data-presentation" title="Data Presentation System">
            <SubHead>Big Number Callout</SubHead>
            <p className="docs-p">84pt Space Grotesk, theme color, with a tiny mono label above (TVL / 24H VOL).</p>

            <SubHead>Stat Ribbon</SubHead>
            <p className="docs-p">5 stats in a horizontal row separated by thin vertical rules. No boxes — cleaner than card-per-stat.</p>

            <SubHead>Mini-Charts</SubHead>
            <p className="docs-p">Sparklines only, 60px tall max, single-color, no gridlines, no axis labels — just the shape. The shape IS the data.</p>

            <SubHead>Tables</SubHead>
            <p className="docs-p">No borders. Only horizontal rules between rows. Alternate row backgrounds at 4% opacity. Headers in mono uppercase.</p>

            <SubHead>Tags / Chips</SubHead>
            <p className="docs-p">Pill shape, 1px border in theme color, mono uppercase text, theme color text on transparent background.</p>
          </Section>

          <Section id="phase1" title="Phase 1: Foundation (Week 1)">
            <SubHead>Day 1 — Build the Master Frame</SubHead>
            <p className="docs-p">Open Figma (free). Create a 1080×1350 canvas. Build your universal frame — all 7 elements. Save as a Figma Component named <code style={{ fontFamily: 'var(--font-m)', color: activeTheme.accent }}>WHIZ_FRAME_MASTER</code>. Every future post starts by duplicating this. Never edit the master directly.</p>

            <SubHead>Day 2 — Build the 10 Color Themes</SubHead>
            <p className="docs-p">Create a "Variables" file in Figma with 10 theme colors as named tokens: <code style={{ fontFamily: 'var(--font-m)', color: activeTheme.accent }}>Theme/VaultNavy/Base, Theme/VaultNavy/Accent</code>. When you switch themes, the entire frame recolors with one click.</p>

            <SubHead>Day 3 — Install the 3 Fonts</SubHead>
            <p className="docs-p">Download Space Grotesk, Inter, JetBrains Mono from Google Fonts. Install on your machine, add to Figma. Build a "Type Styles" set with the 8 quantized sizes.</p>

            <SubHead>Day 4 — Build Your Core 5 Templates</SubHead>
            <p className="docs-p">Start with: Frame 04 (Watchlist), Frame 12 (Mechanism Walkthrough), Frame 17 (Winners & Losers), Frame 20 (Yield Tape), Frame 23 (Threat Model). These 5 will cover ~70% of your weekly posting.</p>

            <SubHead>Day 5 — Create Your Mascot/Avatar</SubHead>
            <p className="docs-p">Generate a mascot in Midjourney:</p>
            <div className="docs-code">{`"a small minimalist cyberpunk character icon, neon teal accents on 
dark background, geometric shapes, vector mascot for a DeFi research 
desk, transparent background, single color logo style"`}</div>

            <SubHead>Day 6 — Set Up the Notion Content OS</SubHead>
            <p className="docs-p">Create a Notion database with: Issue # / Frame # / Theme Color / Topic / Status / Publish Date / Source Links / Caption Draft. Add 20 row drafts now so you never start from blank. Use the Content Planner in this tool as your digital equivalent.</p>

            <SubHead>Day 7 — Ship Issue 001</SubHead>
            <p className="docs-p">Pick Frame 04 (The Watchlist). Make it about this week's notable yield opportunities. Ship it. Don't agonize. <strong>Issue 001 is supposed to be your worst.</strong></p>
          </Section>

          <Section id="phase2" title="Phase 2: Cadence (Weeks 2-12)">
            <p className="docs-p">Run a 3-post weekly rhythm:</p>
            <div style={{ marginBottom: 16 }}>
              {[
                { day: 'Monday', type: 'Weekly Recap', frames: 'Frame 01, 02, 04, 05', color: '#3CE6A6' },
                { day: 'Wednesday', type: 'Project Deep-Dive', frames: 'Frame 08, 09, 12, 15', color: '#6FA8FF' },
                { day: 'Friday', type: 'Tracker / Tier List / Comparison', frames: 'Frame 16, 20, 21, 37', color: '#E5B23A' },
              ].map(r => (
                <div key={r.day} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-m)', color: r.color, fontWeight: 700, width: 90, flexShrink: 0 }}>{r.day.toUpperCase()}</span>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{r.type}</div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--dim)' }}>{r.frames}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="docs-tip">Once per month, swap Friday for a Macro/Thesis post (Frame 42, 43, 44) — this is your authority builder. Once per quarter, ship a Cover Story (Frame 50).</div>
          </Section>

          <Section id="phase3" title="Phase 3: Production Workflow (Per Post)">
            {[
              { time: 'Hour 0-1', title: 'Research & Outline', body: 'Define your "one question." Verify all numbers in DefiLlama / Dune / GitHub / governance forum. Write 5-7 bullet points. Pick the frame number and theme color.' },
              { time: 'Hour 1-2', title: 'Layout', body: 'Duplicate master frame in Figma. Switch the theme color variable. Drop in the matching frame template. Pour your content into the placeholder text/data slots.' },
              { time: 'Hour 2-3', title: 'Visuals', body: 'Logos from cryptologos.cc / DefiLlama. AI-generated illustrations from Midjourney/Nano Banana ONLY for hero panels (Frame 09, 24, 42, 50). Sparklines from real data.' },
              { time: 'Hour 3-4', title: 'Polish', body: 'Alignment pass (everything snaps). Spacing pass (auto-layout). Color discipline check (theme color in only 4 places). Read every word aloud. One peer review.' },
              { time: 'Hour 4 (15 min)', title: 'Ship', body: 'Export PNG at 2x (2160×2700). Filename: whiz_issue047_{frame}_{topic}.png. Post on X with 2-3 line caption. Pin if it\'s a banger.' },
            ].map(step => (
              <div key={step.time} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: activeTheme.accent, fontWeight: 600, width: 100, flexShrink: 0, paddingTop: 2 }}>{step.time}</div>
                <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', borderLeft: `2px solid ${activeTheme.accent}` }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </Section>

          <Section id="phase4" title="Phase 4: Compounding (Month 3+)">
            {[
              { title: 'The Receipts Folder', body: 'Every Saturday, screenshot your week\'s posts. After 12 weeks, post a "first quarter wrap" thread with all 36 visuals — this drives a massive follower spike.' },
              { title: 'The Substack Move', body: 'Around Issue 30, launch whiz.substack.com. Each week\'s post = a Substack edition. Converts X followers into owned audience.' },
              { title: 'The Quarterly Cover Story', body: 'Issue 50, 100, 150 → Frame 50. These become your "best of" posts and get pinned-tweet treatment.' },
              { title: 'The Series', body: 'When a topic has legs, run a 3-part series. E.g., "Stablecoin Risk: Part I — Centralized / Part II — Algorithmic / Part III — Yield-Bearing". Cohesion compounds.' },
            ].map(item => (
              <div key={item.title} style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: activeTheme.accent, fontFamily: 'var(--font-m)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </Section>

          <Section id="non-neg" title="The Non-Negotiables">
            <div className="docs-tip">Tape this above your desk.</div>
            {[
              'One question per post. Write it before you open Figma. If you can\'t, you don\'t have a post.',
              'One theme color per post. Used in only 4 places.',
              'Three fonts. Eight sizes. No exceptions.',
              'Master frame is sacred. Never edit it on a per-post basis. Edit the inside, never the frame.',
              'Verify every number against the primary source. One wrong APR kills 6 months of credibility.',
              'Ship Monday/Wednesday/Friday. Cadence > perfection.',
              'Tag every project featured. Free distribution is the whole game.',
              'Pin the bangers. Update your pinned post weekly.',
              'The first 50 will teach you what the next 500 should be. Ship them fast.',
              'Boring consistency > creative chaos. The Whiz Visual System is the moat.',
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: activeTheme.accent, fontWeight: 700, flexShrink: 0, width: 28 }}>{String(i+1).padStart(2,'0')}.</span>
                <span style={{ fontSize: 13, lineHeight: 1.5 }}>{rule}</span>
              </div>
            ))}
          </Section>

        </div>
      </div>
    </>
  );
}
