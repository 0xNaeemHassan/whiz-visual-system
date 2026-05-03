const PHASE_RANK = { draft: 0, review: 1, 'publish-ready': 2 };

const safeObject = (value) => (value && typeof value === 'object' ? value : {});
const stable = (value) => JSON.stringify(value ?? null, Object.keys(value || {}).sort?.() || undefined);

const addChange = (bucket, type, label, details, destructive = false) => {
  bucket.push({ type, label, details, destructive });
};

export const buildSaveDiff = ({ currentState, saveState }) => {
  const groups = [];
  const destructiveFlags = [];
  const current = currentState || {};
  const save = saveState || {};

  const contentChanges = [];
  const currentContent = safeObject(current.content);
  const saveContent = safeObject(save.content);
  const keys = new Set([...Object.keys(currentContent), ...Object.keys(saveContent)]);
  keys.forEach((key) => {
    const before = currentContent[key];
    const after = saveContent[key];
    if (before === undefined && after !== undefined) addChange(contentChanges, 'added', key, 'Field will be added.');
    else if (before !== undefined && after === undefined) {
      addChange(contentChanges, 'removed', key, 'Field will be removed.', true);
      destructiveFlags.push(`Remove content field: ${key}`);
    } else if (JSON.stringify(before) !== JSON.stringify(after)) addChange(contentChanges, 'changed', key, 'Value will change.');
  });
  if (contentChanges.length) groups.push({ key: 'content', label: 'Content', changes: contentChanges });

  const themeChanges = [];
  if (stable(current.theme) !== stable(save.theme)) addChange(themeChanges, 'changed', 'Theme', 'Theme tokens will change.');
  if (themeChanges.length) groups.push({ key: 'theme', label: 'Theme', changes: themeChanges });

  const overrideChanges = [];
  const currentOverrides = safeObject(current.overrides);
  const saveOverrides = safeObject(save.overrides);
  const overrideKeys = new Set([...Object.keys(currentOverrides), ...Object.keys(saveOverrides)]);
  overrideKeys.forEach((key) => {
    if (!(key in saveOverrides) && key in currentOverrides) {
      addChange(overrideChanges, 'removed', key, 'Override will be removed.', true);
      destructiveFlags.push(`Remove style override: ${key}`);
    } else if (!(key in currentOverrides) && key in saveOverrides) addChange(overrideChanges, 'added', key, 'Override will be added.');
    else if (JSON.stringify(currentOverrides[key]) !== JSON.stringify(saveOverrides[key])) addChange(overrideChanges, 'changed', key, 'Override value will change.');
  });
  if (overrideChanges.length) groups.push({ key: 'overrides', label: 'Overrides', changes: overrideChanges });

  const phaseChanges = [];
  const currPhase = current.workflowPhase || 'draft';
  const savePhase = save.workflowPhase || 'draft';
  if (currPhase !== savePhase) {
    const downgrade = (PHASE_RANK[savePhase] ?? 0) < (PHASE_RANK[currPhase] ?? 0);
    addChange(phaseChanges, 'changed', 'Workflow phase', `${currPhase} → ${savePhase}`, downgrade);
    if (downgrade) destructiveFlags.push(`Workflow phase downgrade: ${currPhase} → ${savePhase}`);
  }
  if (phaseChanges.length) groups.push({ key: 'workflow', label: 'Workflow Phase', changes: phaseChanges });

  const lockChanges = [];
  const currLocks = safeObject(current.sectionLocks);
  const hasSaveLocks = Boolean(save.sectionLocks && typeof save.sectionLocks === 'object');
  const saveLocks = hasSaveLocks ? safeObject(save.sectionLocks) : null;
  if (saveLocks) {
    const lockKeys = new Set([...Object.keys(currLocks), ...Object.keys(saveLocks)]);
    lockKeys.forEach((key) => {
      const before = Boolean(currLocks[key]);
      const after = Boolean(saveLocks[key]);
      if (before !== after) {
        const reset = before && !after;
        addChange(lockChanges, 'changed', key, before ? 'Locked → Unlocked' : 'Unlocked → Locked', reset);
        if (reset) destructiveFlags.push(`Section lock reset: ${key}`);
      }
    });
  }
  if (lockChanges.length) groups.push({ key: 'locks', label: 'Section Locks', changes: lockChanges });

  return { groups, hasChanges: groups.length > 0, destructiveFlags };
};
