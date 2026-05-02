import { getFirstPartyThemes } from '../plugins/firstPartyThemes.js';

export const THEMES = getFirstPartyThemes();
export const DEFAULT_THEME = THEMES[0];
