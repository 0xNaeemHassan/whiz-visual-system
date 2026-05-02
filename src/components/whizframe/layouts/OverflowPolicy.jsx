const TYPE_TOKENS = [84, 56, 36, 24, 18, 14, 12];

const BUDGETS = {
  core: {
    portrait: { title: { maxLines: 3, maxChars: 72 }, deck: { maxLines: 4, maxChars: 200 }, body: { maxLines: 16, maxChars: 1100 } },
    landscape: { title: { maxLines: 2, maxChars: 56 }, deck: { maxLines: 3, maxChars: 150 }, body: { maxLines: 11, maxChars: 760 } },
  },
  extended: {
    portrait: { title: { maxLines: 2, maxChars: 54 }, deck: { maxLines: 3, maxChars: 140 }, body: { maxLines: 12, maxChars: 820 } },
    landscape: { title: { maxLines: 2, maxChars: 42 }, deck: { maxLines: 2, maxChars: 110 }, body: { maxLines: 9, maxChars: 600 } },
  },
};
const PRIMITIVE_BUDGETS = {
  statsCardLabel: { maxLines: 1, maxChars: 22 },
  statsCardValue: { maxLines: 1, maxChars: 16 },
  tableCell: { maxLines: 1, maxChars: 26 },
  footerStream: { maxLines: 1, maxChars: 170 },
  chipTag: { maxLines: 1, maxChars: 18 },
};

const nearestScaleToken = (size = 36) => {
  for (const token of [...TYPE_TOKENS].reverse()) {
    if (token < size) return token;
  }
  return TYPE_TOKENS[TYPE_TOKENS.length - 1];
};

const clampLines = (text = '', maxLines = 3, charsPerLine = 28) => text.slice(0, maxLines * charsPerLine).trim();

const ellipsis = (text = '', maxChars = 120) => (text.length <= maxChars ? text : `${text.slice(0, maxChars - 1).trimEnd()}…`);

const compressText = ({ text = '', budget, style = {}, baseSize }) => {
  const actions = [];
  let nextText = text;
  const nextStyle = { ...style };

  if (nextText.length > budget.maxChars * 0.9) {
    nextStyle.letterSpacing = Math.min(Number(style.letterSpacing ?? -0.02), -0.03);
    actions.push('tighten-tracking');
  }

  if (nextText.length > budget.maxChars) {
    nextStyle.fontSize = nearestScaleToken(baseSize);
    actions.push('reduce-font');
  }

  if (nextText.length > budget.maxChars * 1.2) {
    nextText = clampLines(nextText, budget.maxLines, Math.round(budget.maxChars / budget.maxLines));
    actions.push('clamp-lines');
  }

  if (nextText.length > budget.maxChars) {
    nextText = ellipsis(nextText, budget.maxChars);
    actions.push('ellipsis');
  }

  return { text: nextText, style: nextStyle, actions };
};

const normalizeStat = (stat = {}, ov = {}) => ({
  label: compressText({ text: stat.label || '', budget: PRIMITIVE_BUDGETS.statsCardLabel, style: ov.statsLabel, baseSize: ov.statsLabel?.fontSize || 10 }),
  value: compressText({ text: stat.value || '', budget: PRIMITIVE_BUDGETS.statsCardValue, style: ov.statsValue, baseSize: ov.statsValue?.fontSize || 18 }),
});

const normalizeRow = (row = [], ov = {}) => row.map((cell) => compressText({
  text: String(cell ?? ''),
  budget: PRIMITIVE_BUDGETS.tableCell,
  style: ov.tableCell,
  baseSize: ov.tableCell?.fontSize || 12,
}));

const normalizeChips = (topicTag = '', chips = [], ov = {}) => {
  const seed = chips.length ? chips : topicTag.split(/\s+/).filter(Boolean);
  return seed.map((chip) => compressText({ text: chip, budget: PRIMITIVE_BUDGETS.chipTag, style: ov.tag, baseSize: ov.tag?.fontSize || 10 }));
};

export function applyOverflowPolicy({ family = 'core', aspectRatio, content = {}, ov = {}, baseTitleSize = 36 }) {
  const ratioKey = (aspectRatio?.w || 1080) > (aspectRatio?.h || 1350) ? 'landscape' : 'portrait';
  const familyBudget = BUDGETS[family] || BUDGETS.core;
  const budget = familyBudget[ratioKey];

  const title = compressText({ text: content.title, budget: budget.title, style: ov.title, baseSize: ov.title?.fontSize || baseTitleSize });
  const deck = compressText({ text: content.deck, budget: budget.deck, style: ov.deck, baseSize: ov.deck?.fontSize || 18 });
  const body = compressText({ text: content.body, budget: budget.body, style: ov.body, baseSize: ov.body?.fontSize || 16 });
  const normalizedStats = (content.stats || []).map((stat) => normalizeStat(stat, ov));
  const normalizedHeaders = normalizeRow(content.tableHeaders || [], ov);
  const normalizedRows = (content.tableRows || []).map((row) => normalizeRow(row, ov));
  const footerStreamSource = (content.footerStreamText || '').trim()
    || (content.footerFields || []).join(' ▸ ')
    || '';
  const footerStream = compressText({ text: footerStreamSource, budget: PRIMITIVE_BUDGETS.footerStream, style: ov.footerStream, baseSize: ov.footerStream?.fontSize || 10 });
  const normalizedChips = normalizeChips(content.topicTag || '', content.chips || content.tags || [], ov);

  return {
    content: {
      ...content,
      title: title.text,
      deck: deck.text,
      body: body.text,
      stats: normalizedStats.map((s) => ({ ...s, label: s.label.text, value: s.value.text })),
      tableHeaders: normalizedHeaders.map((h) => h.text),
      tableRows: normalizedRows.map((row) => row.map((cell) => cell.text)),
      footerStreamText: footerStream.text,
      chips: normalizedChips.map((chip) => chip.text),
      tags: normalizedChips.map((chip) => chip.text),
    },
    ov: { ...ov, title: title.style, deck: deck.style, body: body.style, footerStream: footerStream.style },
    actions: {
      title: title.actions, deck: deck.actions, body: body.actions,
      stats: normalizedStats.map((s) => ({ label: s.label.actions, value: s.value.actions })),
      tableHeaders: normalizedHeaders.map((h) => h.actions),
      tableRows: normalizedRows.map((row) => row.map((cell) => cell.actions)),
      footerStream: footerStream.actions,
      chips: normalizedChips.map((chip) => chip.actions),
    },
    budget,
    primitiveBudgets: PRIMITIVE_BUDGETS,
  };
}
