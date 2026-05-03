import { resolveRiskAccent } from '../riskAccentPolicy';
import { buildCitationModel } from './citationModel';

export function createSceneModel({ frameId, theme, content, overrides, aspectRatio, bgGradient, locale = 'en-US' }) {
  const accentResolution = resolveRiskAccent({ frameId, theme, overrides });
  const citationMode = content?.exportCitationMode || content?.citationMode || 'off';
  return {
    frameId,
    dimensions: { width: aspectRatio.w, height: aspectRatio.h },
    background: {
      solid: overrides?.frameBg || theme?.base || '#0F1318',
      gradient: bgGradient || null,
    },
    palette: {
      accent: accentResolution.accent,
      textPrimary: overrides?.title?.color || '#F4F5F7',
      textSecondary: overrides?.deck?.color || '#8B95A3',
      body: overrides?.body?.color || '#8B95A3',
    },
    typography: {
      titleSize: overrides?.title?.fontSize || 52,
      deckSize: overrides?.deck?.fontSize || 18,
      bodySize: overrides?.body?.fontSize || 15,
    },
    locale,
    content: {
      issueNum: content?.issueNum || '',
      topicTag: content?.topicTag || '',
      title: content?.title || '',
      deck: content?.deck || '',
      body: content?.body || '',
      handle: content?.handle || '',
    },
    citations: buildCitationModel(content, citationMode),
  };
}
