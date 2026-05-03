import { resolveRiskAccent } from '../riskAccentPolicy';
import { buildCitationModel } from './citationModel';
import { getLayoutCostSeverity, getMaxImageDrawSize } from '../../utils/perfProfiler';

function countTextRuns(content, citations) {
  const baseFields = [content?.topicTag, content?.title, content?.deck, content?.body, content?.handle].filter(Boolean).length;
  const citationFields = citations?.entries?.length ? 1 : 0;
  return baseFields + citationFields;
}

function estimateLayoutCost(scene) {
  const gradients = scene.background?.gradient ? 1 : 0;
  const effects = 0;
  const imageCount = Array.isArray(scene.content?.images) ? scene.content.images.length : 0;
  const tableDensity = Array.isArray(scene.content?.tableRows) ? Math.min(scene.content.tableRows.length / 10, 2) : 0;
  const textRuns = countTextRuns(scene.content, scene.citations);
  const nodes = 8 + textRuns + gradients + imageCount;
  const score = +(nodes * 0.9 + textRuns * 1.2 + imageCount * 2.4 + effects * 1.5 + gradients * 1.8 + tableDensity * 4).toFixed(2);
  return { score, components: { nodes, textRuns, imageCount, effects, gradients, tableDensity } };
}

function buildExportDegradations(scene, { tier = 2 } = {}) {
  const complexity = estimateLayoutCost(scene);
  const severity = getLayoutCostSeverity(complexity.score, { tier });
  const disabledLayers = [];
  if (severity === 'medium' || severity === 'high' || severity === 'critical') {
    disabledLayers.push('decorative.topicTag');
  }
  if (severity === 'high' || severity === 'critical') {
    disabledLayers.push('decorative.accentBar');
  }
  if (severity === 'critical') {
    disabledLayers.push('decorative.citationStrip');
  }
  return {
    complexity: { ...complexity, severity, tier },
    disabledLayers,
    reduceEffectComplexity: severity === 'high' || severity === 'critical',
    simplifyGradients: severity !== 'low',
    maxImageDrawSize: getMaxImageDrawSize({ tier, severity }),
  };
}

export function createSceneModel({ frameId, theme, content, overrides, aspectRatio, bgGradient, locale = 'en-US' }) {
  const accentResolution = resolveRiskAccent({ frameId, theme, overrides });
  const citationMode = content?.exportCitationMode || content?.citationMode || 'off';
  const scene = {
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
    citations: buildCitationModel(content, citationMode, { strictMode: Boolean(content?.strictMode) }),
  };
  scene.exportProfiling = buildExportDegradations(scene, { tier: Number(content?.performanceTier) || 2 });
  return scene;
}
