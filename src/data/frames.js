/** @typedef {import('../types/editor.js').FrameDefinition} FrameDefinition */
// All 50 frames data
/** @type {FrameDefinition[]} */
export const FRAMES = [
  // TIER A — Weekly Recaps (1-7)
  { id: 1, tier: 'A', tierName: 'Weekly Recaps', name: 'The Ticker Tape', desc: 'Full-width scrolling-style header listing every event of the week as ticker symbols. Below, 6-9 mini cards in a 3×3 grid expanding each tag.', tags: ['weekly', 'recap', 'events'], layout: 'grid' },
  { id: 2, tier: 'A', tierName: 'Weekly Recaps', name: 'The Order Book', desc: 'Two columns BIDS (bullish) and ASKS (bearish) side-by-side. Center spread shows the week\'s headline story.', tags: ['weekly', 'analysis', 'comparison'], layout: 'bull-bear' },
  { id: 3, tier: 'A', tierName: 'Weekly Recaps', name: 'The Trading Floor Schedule', desc: 'A vertical timeline running Monday → Sunday, with events plotted at their actual day. Theme color = the dominant narrative.', tags: ['weekly', 'timeline', 'calendar'], layout: 'timeline' },
  { id: 4, tier: 'A', tierName: 'Weekly Recaps', name: 'The Watchlist', desc: 'A clean monospace table styled exactly like a portfolio app: TICKER / EVENT / TIME / IMPACT / WHIZ TAKE. 8-12 rows.', tags: ['weekly', 'table', 'data'], layout: 'table' },
  { id: 5, tier: 'A', tierName: 'Weekly Recaps', name: 'The Pre-Market Brief', desc: 'Editorial layout — large headline at top, then 3 stacked horizontal modules: TOP STORY, BENEATH THE FOLD, ON YOUR RADAR.', tags: ['weekly', 'editorial', 'brief'], layout: 'editorial' },
  { id: 6, tier: 'A', tierName: 'Weekly Recaps', name: 'The Confluence Map', desc: 'A central "this week\'s narrative" node with 5-8 events branching out as connected nodes — a network graph.', tags: ['weekly', 'network', 'map'], layout: 'network' },
  { id: 7, tier: 'A', tierName: 'Weekly Recaps', name: 'The Earnings Calendar', desc: 'Mimics an earnings calendar: protocol logo, date, estimate (community expectation), actual (what happened), Whiz\'s call.', tags: ['weekly', 'calendar', 'table'], layout: 'table' },

  // TIER B — Project Deep-Dives (8-15)
  { id: 8, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Pitch Deck Slide', desc: 'Centered logo, one-sentence thesis, 4 stat tiles in a row, then a 3-paragraph editorial body with pull-quote. Feels like an investment memo.', tags: ['deep-dive', 'project', 'stats'], layout: 'pitch-deck' },
  { id: 9, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Anatomy', desc: 'Project mechanism shown as a labeled diagram with callout lines. Use isometric illustration in the center.', tags: ['deep-dive', 'diagram', 'explainer'], layout: 'anatomy' },
  { id: 10, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Token Specs', desc: 'Specs sheet: tokenomics donut chart on the left, specs table on the right, unlock schedule bar across the bottom.', tags: ['deep-dive', 'tokenomics', 'data'], layout: 'table' },
  { id: 11, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Comparable Set', desc: 'Subject project center-stage; 3 competitors flank it; bottom row of stat-bars shows where it leads/lags.', tags: ['deep-dive', 'comparison', 'peers'], layout: 'stats' },
  { id: 12, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Mechanism Walkthrough', desc: '6-step horizontal flow with numbered hexagonal nodes. Use for "how it works" posts.', tags: ['deep-dive', 'explainer', 'flow'], layout: 'mechanism' },
  { id: 13, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Bull/Bear Split', desc: 'Vertical center split. Left half BULL CASE (theme color tinted), right half BEAR CASE (red tinted). 3 numbered points each. Bottom strip: WHIZ\'S CALL.', tags: ['deep-dive', 'analysis', 'opinion'], layout: 'bull-bear' },
  { id: 14, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Founder Card', desc: 'Top half: portrait + name + role + project. Bottom half: 3-quote pull from interviews/threads plus a KEY SHIPS timeline.', tags: ['deep-dive', 'profile', 'founder'], layout: 'founder' },
  { id: 15, tier: 'B', tierName: 'Project Deep-Dives', name: 'The Audit Sheet', desc: 'Project graded across 8 axes (Team, Tokenomics, Product, TVL, Audit Status, Community, Catalysts, Risk) with letter grades.', tags: ['deep-dive', 'audit', 'grades'], layout: 'scorecard' },

  // TIER C — Comparative Tables (16-22)
  { id: 16, tier: 'C', tierName: 'Comparative Tables', name: 'The Leaderboard', desc: 'Top 10 ranked, gold/silver/bronze treatment for top 3, single-line stats. Built for screenshot-and-share virality.', tags: ['comparison', 'ranking', 'table'], layout: 'table' },
  { id: 17, tier: 'C', tierName: 'Comparative Tables', name: 'The Winners & Losers', desc: 'Two stacked tables: WINNERS up top, LOSERS beneath, mirrored layout. Same metric, different sides.', tags: ['comparison', 'winners', 'losers'], layout: 'table' },
  { id: 18, tier: 'C', tierName: 'Comparative Tables', name: 'The Matrix', desc: '2×2 quadrant chart with axis labels. Plot 12-20 protocols by 2 dimensions (e.g., Yield × Risk).', tags: ['comparison', 'matrix', 'chart'], layout: 'matrix' },
  { id: 19, tier: 'C', tierName: 'Comparative Tables', name: 'The Spec Sheet', desc: 'Side-by-side feature comparison, 4-6 protocols across the top, 8-12 features down the side. Checkmarks and differentiators.', tags: ['comparison', 'features', 'specs'], layout: 'table' },
  { id: 20, tier: 'C', tierName: 'Comparative Tables', name: 'The Yield Tape', desc: 'Pure data table, monospace throughout, designed to look exactly like a Bloomberg yield curve readout. APRs ranked.', tags: ['comparison', 'yield', 'apy'], layout: 'table' },
  { id: 21, tier: 'C', tierName: 'Comparative Tables', name: 'The Tier List', desc: 'S/A/B/C/D rows of project logos, each tier color-coded. Bottom strip explains criteria. Goes viral every time.', tags: ['comparison', 'tier-list', 'viral'], layout: 'tier-list' },
  { id: 22, tier: 'C', tierName: 'Comparative Tables', name: 'The Head-to-Head', desc: 'Just 2 protocols, deeply compared across 10 dimensions, with a final VERDICT callout at the bottom.', tags: ['comparison', 'head-to-head', 'versus'], layout: 'bull-bear' },

  // TIER D — Risk & Mechanism Explainers (23-29)
  { id: 23, tier: 'D', tierName: 'Risk & Explainers', name: 'The Threat Model', desc: '4 quadrants of risk types (Smart Contract / Economic / Governance / Operational) with severity dots.', tags: ['risk', 'security', 'explainer'], layout: 'threat-model', defaultAccentPolicy: { themeId: 'liquidation-red' } },
  { id: 24, tier: 'D', tierName: 'Risk & Explainers', name: 'The Failure Tree', desc: 'Top: headline outcome (Depeg). Branches downward into cascading causes. Fault-tree analysis from engineering.', tags: ['risk', 'stablecoin', 'tree'], layout: 'failure-tree', defaultAccentPolicy: { themeId: 'liquidation-red' } },
  { id: 25, tier: 'D', tierName: 'Risk & Explainers', name: 'The Postmortem', desc: 'Editorial deep-dive: WHAT HAPPENED / ROOT CAUSE / TIMELINE / RECOVERY / LESSONS. For hacks and exploits.', tags: ['risk', 'hack', 'postmortem'], layout: 'postmortem', defaultAccentPolicy: { themeId: 'liquidation-red' } },
  { id: 26, tier: 'D', tierName: 'Risk & Explainers', name: 'The Mental Model', desc: 'A single concept explained with a labeled illustration center-stage and 3 numbered "reads" beneath.', tags: ['explainer', 'education', 'concept'], layout: 'mental-model', defaultAccentPolicy: { themeId: 'liquidation-red' } },
  { id: 27, tier: 'D', tierName: 'Risk & Explainers', name: 'The Trust Stack', desc: 'Vertical stack of layers (User → Frontend → Contract → Custodian → Chain), each labeled with trust assumption.', tags: ['risk', 'decentralization', 'layers'], layout: 'trust-stack', defaultAccentPolicy: { themeId: 'liquidation-red' } },
  { id: 28, tier: 'D', tierName: 'Risk & Explainers', name: 'The Black Box Opened', desc: 'Left: what users see (marketing claim). Right: what\'s actually happening underneath. Side-by-side reveal.', tags: ['risk', 'transparency', 'reveal'], layout: 'bull-bear', defaultAccentPolicy: { themeId: 'liquidation-red' } },
  { id: 29, tier: 'D', tierName: 'Risk & Explainers', name: 'The Risk Heatmap', desc: 'Grid of 20-30 protocols, color-graded cells from green to red across 5 risk dimensions.', tags: ['risk', 'heatmap', 'comparison'], layout: 'heatmap', defaultAccentPolicy: { themeId: 'liquidation-red' } },

  // TIER E — Ecosystem Maps (30-35)
  { id: 30, tier: 'E', tierName: 'Ecosystem Maps', name: 'The Constellation', desc: 'Logos plotted on a dark "starfield" background, grouped by category with thin connecting lines.', tags: ['ecosystem', 'map', 'network'], layout: 'constellation' },
  { id: 31, tier: 'E', tierName: 'Ecosystem Maps', name: 'The Stack', desc: 'Vertical layered diagram: Settlement → DA → Execution → Apps → Users. Project logos slotted into layers.', tags: ['ecosystem', 'layers', 'infra'], layout: 'stack' },
  { id: 32, tier: 'E', tierName: 'Ecosystem Maps', name: 'The Subway Map', desc: 'Categories run as colored "subway lines." Projects are "stations." Transfer hubs for multi-category projects.', tags: ['ecosystem', 'subway', 'map'], layout: 'subway' },
  { id: 33, tier: 'E', tierName: 'Ecosystem Maps', name: 'The Periodic Table', desc: 'Each protocol = a "tile" with abbreviation, full name, TVL, "chain group" color. Arranged like Mendeleev\'s table.', tags: ['ecosystem', 'viral', 'table'], layout: 'periodic' },
  { id: 34, tier: 'E', tierName: 'Ecosystem Maps', name: 'The Org Chart', desc: 'For ecosystem-with-hierarchy posts (L1 → L2s → L3s → apps). Tree structure, expanding rightward.', tags: ['ecosystem', 'hierarchy', 'tree'], layout: 'org-chart' },
  { id: 35, tier: 'E', tierName: 'Ecosystem Maps', name: 'The Trade Routes', desc: 'World-map style with crypto flows drawn as arcs between hubs (stablecoin flows, bridge volumes). High effort, high reward.', tags: ['ecosystem', 'flows', 'global'], layout: 'trade-routes' },

  // TIER F — Yield & Data Trackers (36-41)
  { id: 36, tier: 'F', tierName: 'Yield & Data', name: 'The Yield Tape (Fresh)', desc: 'Identical to #20 but with FRESH ▸ {DATE} stamp top-right marking it as the latest weekly snapshot.', tags: ['yield', 'weekly', 'apy'], layout: 'table' },
  { id: 37, tier: 'F', tierName: 'Yield & Data', name: 'The Sortable Grid', desc: 'Card-grid (3×3 or 4×3) of opportunities, each card showing protocol, APR, chain, asset, and a risk-dot indicator.', tags: ['yield', 'grid', 'opportunities'], layout: 'grid' },
  { id: 38, tier: 'F', tierName: 'Yield & Data', name: 'The Bracket', desc: 'Tournament-style bracket of 8/16 yield strategies. Round 1 → Round 2 → WHIZ\'S PICK final.', tags: ['yield', 'bracket', 'tournament'], layout: 'bracket' },
  { id: 39, tier: 'F', tierName: 'Yield & Data', name: 'The Curve', desc: 'A real chart (yield curve, TVL line, fee chart) takes up 60% of canvas, with annotation callouts at inflection points.', tags: ['yield', 'chart', 'analysis'], layout: 'curve' },
  { id: 40, tier: 'F', tierName: 'Yield & Data', name: 'The Flow Diagram', desc: '"$1,000 USDC starts here →" with the path traced through swaps, deposits, harvests, ending with final yield.', tags: ['yield', 'flow', 'actionable'], layout: 'flow' },
  { id: 41, tier: 'F', tierName: 'Yield & Data', name: 'The Risk-Adjusted Top 10', desc: 'Leaderboard ranked by Sharpe-style risk-adjusted return, not raw APY. Differentiates from every other yield list.', tags: ['yield', 'ranking', 'risk-adjusted'], layout: 'scorecard' },

  // TIER G — Macro & Thesis (42-46)
  { id: 42, tier: 'G', tierName: 'Macro & Thesis', name: 'The Thesis Page', desc: 'Magazine cover-style. Massive headline, full-bleed background illustration, deck line, byline. One long essay-style column.', tags: ['macro', 'thesis', 'editorial'], layout: 'thesis' },
  { id: 43, tier: 'G', tierName: 'Macro & Thesis', name: 'The 3-Layer Thesis', desc: 'Three numbered tiers stacked: Premise / Mechanism / Implication. Each tier has its own visual treatment.', tags: ['macro', 'thesis', 'framework'], layout: 'three-layer' },
  { id: 44, tier: 'G', tierName: 'Macro & Thesis', name: 'The Counter-Take', desc: '"THE CONSENSUS:" on the left in muted gray. "THE WHIZ TAKE:" on the right in theme color. Two paragraphs each.', tags: ['macro', 'opinion', 'contrarian'], layout: 'bull-bear' },
  { id: 45, tier: 'G', tierName: 'Macro & Thesis', name: 'The Long Bet', desc: 'A timeline running 2026 → 2030 with predicted milestones plotted, each with a confidence percentage.', tags: ['macro', 'prediction', 'timeline'], layout: 'long-bet' },
  { id: 46, tier: 'G', tierName: 'Macro & Thesis', name: 'The Quote Wall', desc: '6-9 quote cards from prominent figures arranged in a grid, all about a single theme. You provide the synthesis.', tags: ['macro', 'quotes', 'grid'], layout: 'quote' },

  // TIER H — Specialty Formats (47-50)
  { id: 47, tier: 'H', tierName: 'Specialty', name: 'The Glossary Page', desc: 'A-Z dictionary spread for one topic (e.g., Stablecoin Glossary). Two-column layout. Permanent reference.', tags: ['specialty', 'education', 'reference'], layout: 'glossary' },
  { id: 48, tier: 'H', tierName: 'Specialty', name: 'The Field Guide', desc: 'Like a birdwatching field guide but for protocols. Each "species" gets a card with illustration, habitat, diet, spotting tips.', tags: ['specialty', 'creative', 'viral'], layout: 'field-guide' },
  { id: 49, tier: 'H', tierName: 'Specialty', name: 'The Receipt', desc: 'Looks like a printed paper receipt. Lists "what you paid" (gas, fees, slippage) for a specific user journey. Mono throughout.', tags: ['specialty', 'creative', 'shareable'], layout: 'receipt' },
  { id: 50, tier: 'H', tierName: 'Specialty', name: 'The Cover Story', desc: 'Once a quarter. Magazine-cover treatment: full-bleed hero illustration, single massive headline, VOL.III ISSUE badge.', tags: ['specialty', 'quarterly', 'flagship'], layout: 'cover-story' },
];

export const TIER_NAMES = {
  A: 'Weekly Recaps', B: 'Project Deep-Dives', C: 'Comparative Tables',
  D: 'Risk & Explainers', E: 'Ecosystem Maps', F: 'Yield & Data',
  G: 'Macro & Thesis', H: 'Specialty'
};


export const LAYOUTS = getRegisteredLayouts();
const LAYOUT_IDS = new Set(LAYOUTS.map((layout) => layout.id));
const unknownLayouts = FRAMES.filter((frame) => !LAYOUT_IDS.has(frame.layout));
if (unknownLayouts.length > 0) {
  const ids = unknownLayouts.map((frame) => frame.layout).join(', ');
  throw new Error(`Unregistered layouts detected: ${ids}`);
}
