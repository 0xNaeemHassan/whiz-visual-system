const safeArray = (value) => Array.isArray(value) ? value : [];

const isEqual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const diffCount = (a, b) => {
  const maxLength = Math.max(safeArray(a).length, safeArray(b).length);
  let changed = 0;
  for (let i = 0; i < maxLength; i += 1) {
    if (!isEqual(safeArray(a)[i], safeArray(b)[i])) changed += 1;
  }
  return changed;
};

export function buildSaveDiff(currentState, selectedSave) {
  if (!selectedSave) return null;

  const currentContent = currentState?.content || {};
  const selectedContent = selectedSave?.content || {};

  const contentFieldChanges = [
    'title', 'deck', 'body', 'topicTag', 'issueNum', 'verdict', 'bigNumber', 'bigLabel', 'status', 'date', 'desk',
  ].filter((key) => !isEqual(currentContent[key], selectedContent[key]));

  const timelineDelta = diffCount(currentContent.timelineEvents, selectedContent.timelineEvents);
  const statsDelta = diffCount(currentContent.stats, selectedContent.stats);
  const tableRowsDelta = diffCount(currentContent.tableRows, selectedContent.tableRows);

  const sections = {
    content: { changed: contentFieldChanges.length > 0 || timelineDelta > 0 || statsDelta > 0 || tableRowsDelta > 0, count: contentFieldChanges.length + timelineDelta + statsDelta + tableRowsDelta },
    theme: { changed: !isEqual(currentState.theme, selectedSave.theme), count: !isEqual(currentState.theme, selectedSave.theme) ? 1 : 0 },
    overrides: { changed: !isEqual(currentState.overrides, selectedSave.overrides), count: !isEqual(currentState.overrides, selectedSave.overrides) ? 1 : 0 },
    layout: { changed: !isEqual(currentState.frameId, selectedSave.frameId) || !isEqual(currentState.aspectRatio, selectedSave.aspectRatio), count: (!isEqual(currentState.frameId, selectedSave.frameId) ? 1 : 0) + (!isEqual(currentState.aspectRatio, selectedSave.aspectRatio) ? 1 : 0) },
  };

  const destructive = [];
  if (!isEqual(currentState.theme?.id, selectedSave.theme?.id)) destructive.push('Theme will be replaced.');
  if (safeArray(currentContent.timelineEvents).length > safeArray(selectedContent.timelineEvents).length) destructive.push('Timeline rows will be removed.');
  if (safeArray(currentContent.stats).length > safeArray(selectedContent.stats).length) destructive.push('Stat rows will be removed.');
  if (safeArray(currentContent.tableRows).length > safeArray(selectedContent.tableRows).length) destructive.push('Table rows will be removed.');
  if (safeArray(currentContent.bullPoints).length > safeArray(selectedContent.bullPoints).length) destructive.push('Bull points will be removed.');

  return {
    sections,
    contentFieldChanges,
    destructive,
    metrics: { timelineDelta, statsDelta, tableRowsDelta },
  };
}
