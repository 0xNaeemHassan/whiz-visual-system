import { FRAMES } from '../data/frames';
import { THEMES } from '../plugins/firstPartyThemes';

const RISK_DEFAULT_THEME_ID = 'liquidation-red';

const frameById = new Map(FRAMES.map((frame) => [frame.id, frame]));
const themeById = new Map(THEMES.map((theme) => [theme.id, theme]));

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function resolveRiskAccent({ frameId, theme, overrides }) {
  const frame = frameById.get(Number(frameId));
  const defaultThemeId = frame?.defaultAccentPolicy?.themeId;
  const hasRiskPolicy = isNonEmptyString(defaultThemeId);

  const fallbackAccent = theme?.accent || '#4CC2FF';
  if (!hasRiskPolicy) {
    return { accent: overrides?.accent?.color || fallbackAccent, usedRiskDefault: false, warned: false };
  }

  const policyTheme = themeById.get(defaultThemeId) || themeById.get(RISK_DEFAULT_THEME_ID);
  const policyAccent = policyTheme?.accent || '#FF5A5A';
  const requestedAccent = overrides?.accent?.color;
  const acknowledged = overrides?.accent?.riskOverrideAcknowledged === true;

  if (!isNonEmptyString(requestedAccent)) {
    return { accent: policyAccent, usedRiskDefault: true, warned: false };
  }

  if (acknowledged) {
    return { accent: requestedAccent, usedRiskDefault: false, warned: false };
  }

  return { accent: policyAccent, usedRiskDefault: true, warned: requestedAccent.toLowerCase() !== policyAccent.toLowerCase() };
}

