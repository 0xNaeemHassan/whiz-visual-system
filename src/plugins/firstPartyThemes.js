import { registerTheme, getRegisteredThemes } from './index.js';

const BUILTIN_THEMES = [
  { id: 'yield-green',     name: 'Yield Green',      useFor: 'APYs, farming, staking',           base: '#0A3D2E', accent: '#3CE6A6', text: '#B8F5E0', semanticTextPrimary:'#F4F6FA', semanticTextSecondary:'#D3DAE6', semanticTextMuted:'#A4AFBF', semanticTextStatus:'#B9C6D9', semanticBgSurface:'#0F1117', semanticBgElevated:'#161922', semanticBgMuted:'#1C2030' },
  { id: 'vault-navy',      name: 'Vault Navy',        useFor: 'Stablecoins, treasuries, RWAs',    base: '#0B1A3A', accent: '#6FA8FF', text: '#BFDBFF' },
  { id: 'bull-gold',       name: 'Bull Gold',         useFor: 'BTC, store-of-value, macro',       base: '#1F1608', accent: '#E5B23A', text: '#F7DFA0' },
  { id: 'liquidation-red', name: 'Liquidation Red',   useFor: 'Exploits, hacks, risk warnings',   base: '#2A0A0A', accent: '#FF5A5A', text: '#FFBBBB' },
  { id: 'l2-teal',         name: 'L2 Teal',           useFor: 'Rollups, scaling, infra',          base: '#062F33', accent: '#3FE2D6', text: '#ADFAF5' },
  { id: 'privacy-plum',    name: 'Privacy Plum',      useFor: 'ZK, privacy, mixers',              base: '#1B0B2E', accent: '#B97AFF', text: '#E0C8FF' },
  { id: 'ai-magenta',      name: 'AI Magenta',        useFor: 'Crypto × AI posts',                base: '#2A0922', accent: '#F03DC2', text: '#FFBAEA' },
  { id: 'memecoin-lime',   name: 'Memecoin Lime',     useFor: 'Memes, retail flows',              base: '#15200A', accent: '#C7FF3C', text: '#EDFFA8' },
  { id: 'governance-slate',name: 'Governance Slate',  useFor: 'DAOs, votes, proposals',           base: '#1A1F26', accent: '#9DB4D0', text: '#D0E0F0' },
  { id: 'bridge-orange',   name: 'Bridge Orange',     useFor: 'Cross-chain, interop',             base: '#2A1306', accent: '#FF8A3D', text: '#FFCBA0' },
];

BUILTIN_THEMES.forEach((theme) => {
  registerTheme({
    id: `theme.${theme.id}`,
    name: `Theme: ${theme.name}`,
    version: '1.0.0',
    firstParty: true,
    capabilities: { theme: true },
    constraints: { readOnly: true },
    hooks: {},
    theme,
  });
});

export function getFirstPartyThemes() {
  return getRegisteredThemes();
}
