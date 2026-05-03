const CONTENT_PATH_SCOPES = {
  text: {
    titles: ['title'],
    decks: ['deck'],
    bodyText: ['body', 'thesis', 'verdict', 'pullQuote'],
    chips: ['topicTag', 'status', 'desk', 'volume'],
    labels: ['bigLabel', 'handle', 'socialX', 'socialSub'],
    footers: ['sourceLinks', 'footer.left', 'footer.center', 'footer.right'],
    metadata: ['issueNum', 'date', 'slug', 'nextDrop', 'metadata.issueNum', 'metadata.date', 'metadata.slug', 'metadata.nextDrop'],
  },
  arrays: {
    bodyText: ['bullPoints', 'bearPoints', 'mechanismSteps', 'riskNotes', 'evidencePoints'],
  },
  tables: ['tableHeaders', 'tableRows'],
  structured: ['stats', 'timelineEvents', 'gridItems', 'metadata', 'footer'],
};

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function buildMatcher(findText, { caseSensitive = false, wholeWord = false } = {}) {
  if (!findText) return null;
  const escaped = escapeRegex(findText);
  return new RegExp(wholeWord ? `\\b${escaped}\\b` : escaped, caseSensitive ? 'g' : 'gi');
}
function replaceInString(value, matcher, replaceText) {
  if (typeof value !== 'string' || !matcher) return { value, changes: 0 };
  let changes = 0;
  const nextValue = value.replace(matcher, () => { changes += 1; return replaceText; });
  return { value: nextValue, changes };
}

function shouldProcessFrame(frame, filter = {}) {
  const { mode = 'current_frame', currentFrameId, selectedFrameIds = [], draftIds = [] } = filter;
  if (mode === 'all_frames' || mode === 'all_saved_drafts') return true;
  if (mode === 'selected_sections') return selectedFrameIds.includes(frame.frameId);
  if (mode === 'saved_drafts') return draftIds.includes(frame.frameId);
  return frame.frameId === currentFrameId;
}

function getAtPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}
function setAtPath(obj, path, value) {
  const keys = path.split('.');
  const leaf = keys.pop();
  const parent = keys.reduce((acc, key) => {
    if (acc[key] == null || typeof acc[key] !== 'object') acc[key] = {};
    return acc[key];
  }, obj);
  parent[leaf] = value;
}

function walkText(value, matcher, replaceText, path = '', hits = []) {
  if (typeof value === 'string') {
    const result = replaceInString(value, matcher, replaceText);
    if (result.changes > 0) hits.push({ path, before: value, after: result.value, changes: result.changes, value: result.value });
    return { value: result.value, hits };
  }
  if (Array.isArray(value)) {
    const next = value.map((item, idx) => walkText(item, matcher, replaceText, `${path}[${idx}]`, hits).value);
    return { value: next, hits };
  }
  if (value && typeof value === 'object') {
    const next = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walkText(v, matcher, replaceText, path ? `${path}.${k}` : k, hits).value]));
    return { value: next, hits };
  }
  return { value, hits };
}

export function getEditableScopes() { return CONTENT_PATH_SCOPES; }
export function getEditableContentPaths() {
  return [
    ...Object.values(CONTENT_PATH_SCOPES.text).flat(),
    ...Object.values(CONTENT_PATH_SCOPES.arrays).flat(),
    ...CONTENT_PATH_SCOPES.tables,
    ...CONTENT_PATH_SCOPES.structured,
  ];
}

export function previewFindReplace({ frames = [], findText = '', replaceText = '', options = {}, filter = {} }) {
  return applyFindReplace({ frames, findText, replaceText, options, filter, mutate: false }).preview;
}

export function applyFindReplace({ frames = [], findText = '', replaceText = '', options = {}, filter = {}, mutate = true }) {
  const matcher = buildMatcher(findText, options);
  if (!matcher) return { frames, replacements: 0, preview: [], batch: null };
  const preview = [];
  let replacements = 0;

  const nextFrames = frames.map((frame) => {
    if (!shouldProcessFrame(frame, filter)) return frame;
    const content = { ...(frame.content || {}) };

    Object.entries(CONTENT_PATH_SCOPES.text).forEach(([scope, keys]) => {
      keys.forEach((path) => {
        const current = getAtPath(content, path);
        const result = replaceInString(current, matcher, replaceText);
        if (result.changes > 0) {
          setAtPath(content, path, result.value);
          preview.push({ frameId: frame.frameId, scope, path, before: current, after: result.value, changes: result.changes });
          replacements += result.changes;
        }
      });
    });

    [...Object.values(CONTENT_PATH_SCOPES.arrays).flat(), ...CONTENT_PATH_SCOPES.tables, ...CONTENT_PATH_SCOPES.structured].forEach((path) => {
      const current = getAtPath(content, path);
      const walked = walkText(current, matcher, replaceText, path, []);
      if (walked.hits.length) {
        setAtPath(content, path, walked.value);
        walked.hits.forEach((hit) => {
          preview.push({ frameId: frame.frameId, scope: 'structured', path: hit.path, before: hit.before, after: hit.after, changes: hit.changes });
          replacements += hit.changes;
        });
      }
    });

    return { ...frame, content };
  });

  const batch = { type: 'find_replace_batch', replacements, preview, filter: { ...filter }, options: { ...options } };
  return { frames: mutate ? nextFrames : frames, replacements, preview, batch, nextFrames };
}
