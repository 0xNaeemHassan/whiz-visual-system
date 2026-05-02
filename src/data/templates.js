/** @typedef {import('../types/editor.js').FrameContent} FrameContent */
// Per-frame content templates — gives users a ready-to-edit scaffold
/** @type {Record<number, Partial<FrameContent>>} */
export const FRAME_TEMPLATES = {
  // Frame 4 — The Watchlist
  4: {
    topicTag: 'YIELD TRACKER',
    title: 'THE WATCHLIST',
    deck: 'Eight yield opportunities worth your attention this week.',
    tableHeaders: ['PROTOCOL','ASSET','APY','RISK','GRADE'],
    tableRows: [
      {col1:'Aave',col2:'USDC',col3:'5.2%',col4:'Low',col5:'A+'},
      {col1:'Pendle',col2:'stETH',col3:'14.1%',col4:'Med',col5:'B+'},
      {col1:'Morpho',col2:'USDT',col3:'7.3%',col4:'Low',col5:'A-'},
      {col1:'Compound',col2:'ETH',col3:'3.8%',col4:'Low',col5:'A'},
      {col1:'Yearn',col2:'DAI',col3:'9.2%',col4:'Med',col5:'B+'},
      {col1:'Convex',col2:'crvUSD',col3:'11.4%',col4:'Med',col5:'B'},
      {col1:'Frax',col2:'FRAX',col3:'6.7%',col4:'Med',col5:'B+'},
      {col1:'Spark',col2:'sDAI',col3:'5.0%',col4:'Low',col5:'A'},
    ],
    stats:[{label:'AVG APY',value:'7.7%'},{label:'TOP YIELD',value:'14.1%'},{label:'PROTOCOLS',value:'8'},{label:'CHAINS',value:'4'}],
  },
  // Frame 8 — The Pitch Deck Slide
  8: {
    topicTag: 'PROJECT BRIEF',
    title: 'PENDLE FINANCE',
    deck: 'The only protocol that lets you trade future yield as a separate asset class.',
    stats:[{label:'TVL',value:'$3.2B'},{label:'24H VOL',value:'$140M'},{label:'APY',value:'14.1%'},{label:'CHAINS',value:'6'}],
    body: 'Pendle splits yield-bearing tokens into two components: Principal Tokens (PT) and Yield Tokens (YT). This separation allows traders to take fixed-rate positions or speculate on yield direction.\n\nThe protocol has seen exponential growth in 2024-2025 as institutional appetite for yield derivatives grows.',
    pullQuote: 'The AMM that lets you trade time itself.',
    thesis: 'Yield derivatives become a core fixed-income primitive once rates and carry are tradable on-chain.',
    mechanismSteps: [
      'Split yield-bearing assets into principal and future-yield claims.',
      'Route PT/YT into concentrated AMM pools for price discovery.',
      'Let users choose fixed yield (PT) or variable yield exposure (YT).',
    ],
    riskNotes: [
      'Yield compression can reduce YT upside in lower-rate regimes.',
      'Smart contract and oracle dependencies remain material.',
    ],
    evidencePoints: [
      'Sustained TVL growth across multiple chains.',
      'Improving daily volume and open interest in PT/YT markets.',
    ],
  },
  // Frame 13 — Bull/Bear Split
  13: {
    topicTag: 'ANALYSIS',
    title: 'ETHEREUM L2 WARS',
    deck: 'Is the multi-rollup future inevitable, or will one chain dominate?',
    bullPoints: ['Arbitrum leads with $18B TVL and growing developer ecosystem','Base is onboarding the next 100M users via Coinbase distribution','OP Stack adoption means network effects compound across chains'],
    bearPoints: ['Fragmented liquidity reduces capital efficiency across the ecosystem','Bridge risks multiply as cross-rollup activity grows','No dominant L2 means no clear winner to bet on'],
    bigLabel: 'BULL CASE',
    verdict: 'BEAR CASE',
    thesis: 'The L2 endgame is a fragmented but interoperable market, not winner-take-all.',
    mechanismSteps: [
      'Distribution channels seed users into different rollup ecosystems.',
      'Developer tooling standards reduce switching costs across stacks.',
      'Liquidity routers abstract fragmentation at execution time.',
    ],
    riskNotes: ['Bridge and messaging failures remain systemic risk vectors.'],
    evidencePoints: ['TVL and activity are growing across multiple leading rollups in parallel.'],
  },
  // Frame 15 — The Audit Sheet
  15: {
    topicTag: 'PROJECT GRADE',
    title: 'AAVE V3 AUDIT',
    deck: 'Graded across 8 axes of protocol quality.',
    stats:[{label:'OVERALL',value:'A'},{label:'TVL',value:'$12B'},{label:'AUDITS',value:'7'},{label:'AGE',value:'4yr'}],
    tableRows: [
      {col1:'Team',col2:'Known, public, reputable leadership',col3:'A+'},
      {col1:'Tokenomics',col2:'stkAAVE with real fee capture',col3:'A'},
      {col1:'Product',col2:'Category-leading money market',col3:'A+'},
      {col1:'TVL Trajectory',col2:'Steady growth, multi-chain',col3:'A'},
      {col1:'Audit Status',col2:'7 audits, bug bounty active',col3:'A+'},
      {col1:'Community',col2:'Governance highly active',col3:'A-'},
      {col1:'Catalysts',col2:'GHO stablecoin expansion',col3:'B+'},
      {col1:'Risk',col2:'Smart contract risk low; governance risk exists',col3:'B+'},
    ],
    thesis: 'Aave remains the benchmark blue-chip lender due to durable product-market fit and governance execution.',
    mechanismSteps: [
      'Assess protocol quality across team, product, security, and market traction.',
      'Translate each axis into a letter-grade scorecard.',
      'Weight aggregate output toward downside protection and sustainability.',
    ],
    riskNotes: ['Governance capture and parameter mistakes can degrade risk posture quickly.'],
    evidencePoints: ['Multi-year operating history with repeated audits and active governance cadence.'],
  },
  // Frame 16 — Leaderboard
  16: {
    topicTag: 'RANKINGS',
    title: 'TOP 10 PROTOCOLS BY TVL',
    deck: 'The biggest protocols by total value locked this week.',
    stats:[{label:'TOTAL TVL',value:'$120B'},{label:'TOP CHAIN',value:'ETH'},{label:'YTD GROWTH',value:'+34%'}],
    tableHeaders: ['#','PROTOCOL','TVL','CHAIN','CHANGE'],
    tableRows: [
      {col1:'Lido',col2:'$32B',col3:'ETH',col4:'+2.1%'},
      {col1:'AAVE',col2:'$12B',col3:'MULTI',col4:'+0.8%'},
      {col1:'EigenLayer',col2:'$11B',col3:'ETH',col4:'+5.4%'},
      {col1:'Uniswap',col2:'$9B',col3:'MULTI',col4:'-1.2%'},
      {col1:'Pendle',col2:'$3.2B',col3:'MULTI',col4:'+12.3%'},
    ],
  },
  // Frame 21 — Tier List
  21: {
    topicTag: 'TIER LIST',
    title: 'DEFI YIELD PROTOCOLS',
    deck: 'Ranked by reliability, APY sustainability, and risk-adjusted returns.',
    tableRows: [
      {col1:'Aave',col2:'S'},{col1:'Morpho',col2:'S'},
      {col1:'Pendle',col2:'A'},{col1:'Compound',col2:'A'},{col1:'Yearn',col2:'A'},
      {col1:'Convex',col2:'B'},{col1:'Frax',col2:'B'},{col1:'Balancer',col2:'B'},
      {col1:'Ribbon',col2:'C'},{col1:'Opyn',col2:'C'},
    ],
    body: 'Criteria: TVL > $1B for S tier, sustainable yield source, audit history, governance quality',
  },
  // Frame 25 — Postmortem
  25: {
    topicTag: 'POST-MORTEM',
    title: 'CURVE HACK',
    deck: "$70M drained via reentrancy in Vyper compiler. Here's what happened.",
    tableRows: [{
      col1: '$70M drained from Curve stablecoin pools via reentrancy vulnerability in Vyper compiler versions 0.2.15-0.3.0.',
      col2: "Legacy Vyper compiler bug — reentrancy lock wasn't enforced in specific versions. Not a Curve design flaw.",
      col3: 'CRV token recovery plan, white-hat negotiation returned ~75% of funds.',
      col4: 'Always verify compiler version in audit scope. Reentrancy can exist at compiler, not just code level.',
    }],
  },
  // Frame 42 — Thesis
  42: {
    topicTag: 'THESIS',
    title: 'THE END OF MERCENARY YIELD',
    deck: 'Why the era of unsustainable APYs is finally closing — and what comes next.',
    body: "Three years ago, triple-digit APYs were table stakes for any new DeFi protocol. Liquidity mining was the only customer acquisition strategy anyone needed.\n\nThe protocols that survived aren't the ones that offered the most — they're the ones that built real revenue. Aave. Uniswap. Curve. All of them generate genuine fees before offering incentives.\n\nThe next generation of yield is boring. And boring is exactly what we need.",
  },
  // Frame 49 — The Receipt
  49: {
    topicTag: 'THE RECEIPT',
    title: '$1,000 USDC IN PENDLE',
    deck: "Here's what you actually paid to deploy $1,000 in Pendle's stETH strategy.",
    tableRows: [
      {col1:'ETH → Arbitrum bridge',col2:'LayerZero',col3:'$1.20',col4:'risk'},
      {col1:'USDC → stETH swap',col2:'1inch, 0.1% slippage',col3:'$1.00',col4:'risk'},
      {col1:'Pendle LP deposit',col2:'Gas: 0.003 ETH',col3:'$0.47',col4:'risk'},
      {col1:'30-day yield',col2:'14.1% APY base',col3:'+$11.75',col4:'benefit'},
      {col1:'PENDLE point rewards',col2:'~2000 pts est.',col3:'+$4.00',col4:'benefit'},
    ],
  },
  // Frame 50 — Cover Story
  50: {
    topicTag: 'QUARTERLY COVER',
    title: 'THE YEAR YIELD GREW UP',
    deck: 'How DeFi went from speculative farming to institutional-grade fixed income in 18 months.',
    volume: 'II',
    issueNum: '050',
  },
};

import { createDefaultContent, hasRequiredContentShape } from '../domain/editorDefaults.js';

// Merge with canonical defaults for any unspecified fields
export function getFrameTemplate(frameId) {
  const defaultContent = createDefaultContent();
  const template = FRAME_TEMPLATES[frameId];
  const merged = template ? { ...defaultContent, ...template } : defaultContent;

  if (!hasRequiredContentShape(merged)) {
    throw new Error(`Template merge removed required content keys for frame ${frameId}`);
  }

  return merged;
}

export const CONTENT_TEMPLATES = Object.entries(FRAME_TEMPLATES).map(([id, content]) => ({
  id: `frame-${id}`,
  name: `Frame ${id}`,
  desc: content.deck || content.topicTag || 'Quick-start content preset',
  content,
}));


const LAYOUT_REQUIRED_FIELDS = {
  table: ['tableRows'],
  'bull-bear': ['bullPoints', 'bearPoints'],
  timeline: ['timelineEvents'],
  grid: ['gridItems'],
  stats: ['stats'],
};

export function createTemplateForLayout(layout) {
  const base = createDefaultContent();
  const requiredFields = LAYOUT_REQUIRED_FIELDS[layout] || [];
  for (const field of requiredFields) {
    if (base[field] === undefined) {
      base[field] = Array.isArray(base[field]) ? [] : '';
    }
  }
  return base;
}

export function checkTemplateLayoutCompatibility(template, layout) {
  const requiredFields = LAYOUT_REQUIRED_FIELDS[layout] || [];
  const missingFields = requiredFields.filter((field) => {
    const value = template?.[field];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === '';
  });

  return {
    isCompatible: missingFields.length === 0,
    missingFields,
  };
}
