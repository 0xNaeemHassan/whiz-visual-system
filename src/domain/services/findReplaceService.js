const TEXT_SCOPES = {
  titles: ['title'],
  decks: ['deck'],
  bodyText: ['body', 'thesis', 'verdict', 'pullQuote'],
  chips: ['topicTag', 'status', 'desk', 'volume'],
  labels: ['bigLabel', 'handle', 'socialX', 'socialSub'],
  footers: ['sourceLinks'],
  metadata: ['issueNum', 'date', 'slug', 'nextDrop'],
};

const ARRAY_TEXT_SCOPES = {
  bodyText: ['bullPoints', 'bearPoints', 'mechanismSteps', 'riskNotes', 'evidencePoints'],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMatcher(findText, { caseSensitive = false, wholeWord = false } = {}) {
  if (!findText) return null;
  const escaped = escapeRegex(findText);
  const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
  return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
}

function replaceInString(value, matcher, replaceText) {
  if (typeof value !== 'string' || !matcher) return { value, changes: 0 };
  let changes = 0;
  const nextValue = value.replace(matcher, () => {
    changes += 1;
    return replaceText;
  });
  return { value: nextValue, changes };
}

function shouldProcessFrame(frame, filter = {}) {
  const { mode = 'current_frame', currentFrameId, selectedFrameIds = [] } = filter;
  if (mode === 'all_frames') return true;
  if (mode === 'selected_sections') return selectedFrameIds.includes(frame.frameId);
  return frame.frameId === currentFrameId;
}

export function getEditableScopes() {
  return {
    text: TEXT_SCOPES,
    arrays: ARRAY_TEXT_SCOPES,
    tables: ['tableHeaders', 'tableRows'],
    structured: ['stats', 'timelineEvents', 'gridItems'],
  };
}

export function previewFindReplace({ frames = [], findText = '', replaceText = '', options = {}, filter = {} }) {
  const matcher = buildMatcher(findText, options);
  if (!matcher) return [];
  const preview = [];

  frames.forEach((frame) => {
    if (!shouldProcessFrame(frame, filter)) return;
    const content = frame.content || {};
    Object.entries(TEXT_SCOPES).forEach(([scope, keys]) => {
      keys.forEach((key) => {
        const current = content[key];
        const result = replaceInString(current, matcher, replaceText);
        if (result.changes > 0) preview.push({ frameId: frame.frameId, scope, path: key, before: current, after: result.value, changes: result.changes });
      });
    });
  });

  return preview;
}

export function applyFindReplace({ frames = [], findText = '', replaceText = '', options = {}, filter = {} }) {
  const matcher = buildMatcher(findText, options);
  if (!matcher) return { frames, replacements: 0, preview: [] };
  const preview = [];
  let replacements = 0;

  const nextFrames = frames.map((frame) => {
    if (!shouldProcessFrame(frame, filter)) return frame;
    const content = { ...(frame.content || {}) };

    Object.entries(TEXT_SCOPES).forEach(([scope, keys]) => {
      keys.forEach((key) => {
        const result = replaceInString(content[key], matcher, replaceText);
        if (result.changes > 0) {
          preview.push({ frameId: frame.frameId, scope, path: key, before: content[key], after: result.value, changes: result.changes });
          content[key] = result.value;
          replacements += result.changes;
        }
      });
    });

    Object.entries(ARRAY_TEXT_SCOPES).forEach(([scope, keys]) => {
      keys.forEach((key) => {
        if (!Array.isArray(content[key])) return;
        content[key] = content[key].map((item, idx) => {
          const result = replaceInString(item, matcher, replaceText);
          if (result.changes > 0) {
            preview.push({ frameId: frame.frameId, scope, path: `${key}[${idx}]`, before: item, after: result.value, changes: result.changes });
            replacements += result.changes;
          }
          return result.value;
        });
      });
    });

    if (Array.isArray(content.stats)) {
      content.stats = content.stats.map((stat, idx) => {
        const label = replaceInString(stat?.label, matcher, replaceText);
        const value = replaceInString(stat?.value, matcher, replaceText);
        if (!label.changes && !value.changes) return stat;
        if (label.changes) preview.push({ frameId: frame.frameId, scope: 'labels', path: `stats[${idx}].label`, before: stat.label, after: label.value, changes: label.changes });
        if (value.changes) preview.push({ frameId: frame.frameId, scope: 'table_cells', path: `stats[${idx}].value`, before: stat.value, after: value.value, changes: value.changes });
        replacements += label.changes + value.changes;
        return { ...stat, label: label.value, value: value.value };
      });
    }

    if (Array.isArray(content.tableHeaders)) {
      content.tableHeaders = content.tableHeaders.map((header, idx) => {
        const result = replaceInString(header, matcher, replaceText);
        if (result.changes) {
          preview.push({ frameId: frame.frameId, scope: 'table_cells', path: `tableHeaders[${idx}]`, before: header, after: result.value, changes: result.changes });
          replacements += result.changes;
        }
        return result.value;
      });
    }
    if (Array.isArray(content.tableRows)) {
      content.tableRows = content.tableRows.map((row, rowIdx) => Object.fromEntries(Object.entries(row || {}).map(([key, val]) => {
        const result = replaceInString(val, matcher, replaceText);
        if (result.changes) {
          preview.push({ frameId: frame.frameId, scope: 'table_cells', path: `tableRows[${rowIdx}].${key}`, before: val, after: result.value, changes: result.changes });
          replacements += result.changes;
        }
        return [key, result.value];
      })));
    }

    return { ...frame, content };
  });

  return { frames: nextFrames, replacements, preview };
}
